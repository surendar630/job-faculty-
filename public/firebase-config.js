// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA54_DnlblEXm5mDMgOhwTG2dx7JAhWSHQ",
  authDomain: "acadimeapro.firebaseapp.com",
  projectId: "acadimeapro",
  storageBucket: "acadimeapro.firebasestorage.app",
  messagingSenderId: "1037123729626",
  appId: "1:1037123729626:web:5f07c7087f62e35da38de3",
  measurementId: "G-44FDYL437S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
