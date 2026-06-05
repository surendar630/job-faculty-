// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB_PLqF1qcEEhnrYaUA1k5Tsi61MW0xZS8",
  authDomain: "job-faculty.firebaseapp.com",
  projectId: "job-faculty",
  storageBucket: "job-faculty.firebasestorage.app",
  messagingSenderId: "62016617558",
  appId: "1:62016617558:web:014890807abc948a928ff7",
  measurementId: "G-EM3X896YYN"
};

// Google sign-in client IDs and API key used by Firebase popup authentication.
export const GOOGLE_CLIENT_ID = "62016617558-2gcb7841fha9u1nre7alu2pt0s29b0m8.apps.googleusercontent.com";
export const GOOGLE_CLIENT_ID_ALT = "62016617558-2gcb7841fha9u1nre7alu2pt0s29b0m8.apps.googleusercontent.com";
export const FIREBASE_API_KEY = "AIzaSyB_PLqF1qcEEhnrYaUA1k5Tsi61MW0xZS8";

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({ prompt: "select_account" });

export { app, analytics, auth, googleProvider, signInWithPopup };
export default app;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({ prompt: 'select_account' });

export { app, analytics, auth, googleProvider, signInWithPopup };
export default app;
