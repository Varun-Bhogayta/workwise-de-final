// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: "AIzaSyCm8t7qbP8hVWBgRU4BmdTG_ByEhZ9Bbew",
  authDomain: "workwise-2227a.firebaseapp.com",
  projectId: "workwise-2227a",
  storageBucket: "workwise-2227a.firebasestorage.app",
  messagingSenderId: "23882934993",
  appId: "1:23882934993:web:c23a1a410cc81a1d17b3f0",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app);
export const db = getFirestore(app);

// Configure Google provider to prompt account selection
googleProvider.setCustomParameters({
  prompt: "select_account",
});
