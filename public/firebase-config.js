// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
