// Browser-safe Firebase SDK imports for the static Express page.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';

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
  const app = initializeApp(config.firebaseConfig || DEFAULT_FIREBASE_CONFIG);
  const analytics = getAnalytics(app);
  const auth = getAuth(app);
  const googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: 'select_account',
    client_id: config.googleClientId || GOOGLE_CLIENT_ID
  });
  return { app, analytics, auth, googleProvider, signInWithPopup };
}

export { signInWithPopup };
