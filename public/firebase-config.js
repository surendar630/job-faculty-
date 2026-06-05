// Import the Firebase SDKs you need for Google sign-in.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';

// Firebase configuration for the active project used by this app.
const firebaseConfig = {
  apiKey: 'AIzaSyB_PLqF1qcEEhnrYaUA1k5Tsi61MW0xZS8',
  authDomain: 'job-faculty.firebaseapp.com',
  projectId: 'job-faculty',
  storageBucket: 'job-faculty.firebasestorage.app',
  messagingSenderId: '62016617558',
  appId: '1:62016617558:web:014890807abc948a928ff7',
  measurementId: 'G-EM3X896YYN'
};

// Google sign-in client IDs used by Firebase popup authentication.
export const GOOGLE_CLIENT_ID = '511476416933-ldnl6dlnmpkidc8boqnhckcjspouut9t.apps.googleusercontent.com';
export const GOOGLE_CLIENT_ID_ALT = '62016617558-2gcb7841fha9u1nre7alu2pt0s29b0m8.apps.googleusercontent.com';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({ prompt: 'select_account' });

export { app, analytics, auth, googleProvider, signInWithPopup };
export default app;
