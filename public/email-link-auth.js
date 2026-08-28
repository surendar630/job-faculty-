import { initFirebaseAuth } from '/firebase-config.js';

const EMAIL_STORAGE_KEY = 'emailForSignIn';

export async function setupEmailLinkAuth({ emailId, buttonId, statusId, redirectFallback }) {
  const emailInput = document.getElementById(emailId);
  const button = document.getElementById(buttonId);
  const status = document.getElementById(statusId);
  if (!emailInput || !button || !status) return;

  const setStatus = (message, isError = false) => {
    status.textContent = message;
    status.className = isError ? 'auth-link-status error' : 'auth-link-status';
  };

  try {
    const { auth, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } = await initFirebaseAuth();
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem(EMAIL_STORAGE_KEY);
      if (!email) email = window.prompt('Enter the email address where you received the sign-in link');
      if (!email) return setStatus('Email is required to complete sign-in.', true);

      const result = await signInWithEmailLink(auth, email, window.location.href);
      window.localStorage.removeItem(EMAIL_STORAGE_KEY);
      const response = await fetch('/auth/google-firebase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: await result.user.getIdToken() })
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      window.history.replaceState({}, document.title, window.location.pathname);
      window.location.href = data.redirect || redirectFallback;
      return;
    }

    button.addEventListener('click', async () => {
      const email = emailInput.value.trim();
      if (!email) return setStatus('Enter your email address first.', true);
      button.disabled = true;
      setStatus('Sending your secure sign-in link...');
      try {
        await sendSignInLinkToEmail(auth, email, {
          url: `${window.location.origin}${window.location.pathname}`,
          handleCodeInApp: true
        });
        window.localStorage.setItem(EMAIL_STORAGE_KEY, email);
        setStatus('Check your email and open the sign-in link on this device.');
      } catch (error) {
        console.error('Firebase email-link sign-in error:', error);
        setStatus('Could not send the sign-in link. Please try again.', true);
      } finally {
        button.disabled = false;
      }
    });
  } catch (error) {
    console.error('Firebase email-link setup error:', error);
    setStatus('Passwordless sign-in is temporarily unavailable.', true);
  }
}