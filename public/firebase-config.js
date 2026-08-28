// Browser-safe Firebase SDK imports for the static Express page.
import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js';
import {
  getAuth,
  GoogleAuthProvider,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyB_PLqF1qcEEhnrYaUA1k5Tsi61MW0xZS8',
  authDomain: 'job-faculty.firebaseapp.com',
  projectId: 'job-faculty',
  storageBucket: 'job-faculty.firebasestorage.app',
  messagingSenderId: '62016617558',
  appId: '1:62016617558:web:014890807abc948a928ff7',
  measurementId: 'G-EM3X896YYN'
};

export const GOOGLE_CLIENT_ID = '62016617558-2gcb7841fha9u1nre7alu2pt0s29b0m8.apps.googleusercontent.com';
export const GOOGLE_CLIENT_ID_ALT = '62016617558-2gcb7841fha9u1nre7alu2pt0s29b0m8.apps.googleusercontent.com';
export const FIREBASE_API_KEY = 'AIzaSyB_PLqF1qcEEhnrYaUA1k5Tsi61MW0xZS8';

export async function getFirebaseRuntimeConfig() {
  try {
    const response = await fetch('/auth/config', { cache: 'no-store' });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('Falling back to bundled Firebase config:', error);
  }

  return {
    firebaseConfig: DEFAULT_FIREBASE_CONFIG,
    googleClientId: GOOGLE_CLIENT_ID,
    googleClientIdAlt: GOOGLE_CLIENT_ID_ALT,
    firebaseApiKey: FIREBASE_API_KEY
  };
}

export async function initFirebaseAuth() {
  const config = await getFirebaseRuntimeConfig();
  const app = getApps().length ? getApp() : initializeApp(config.firebaseConfig || DEFAULT_FIREBASE_CONFIG);
  let analytics = null;
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Firebase Analytics is unavailable in this browser:', error);
  }
  const auth = getAuth(app);
  const googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: 'select_account',
  });
  return { app, analytics, auth, googleProvider, isSignInWithEmailLink, sendSignInLinkToEmail, signInWithEmailLink, signInWithPopup };
}

export function describeFirebaseAuthError(error) {
  const code = error?.code || '';
  if (code === 'auth/unauthorized-domain') {
    return 'Google sign-in is not enabled for this website. Add job-fa.onrender.com in Firebase Authentication > Settings > Authorized domains.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Google sign-in is disabled. Enable the Google provider in Firebase Authentication > Sign-in method.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Your browser blocked the Google sign-in popup. Allow popups for this site and try again.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'The Google sign-in window was closed before authentication finished.';
  }
  return error?.message || 'Google sign-in failed. Please try again.';
}

export { isSignInWithEmailLink, sendSignInLinkToEmail, signInWithEmailLink, signInWithPopup };
