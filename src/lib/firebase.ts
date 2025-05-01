// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
} from "firebase/auth";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: "AIzaSyCm8t7qbP8hVWBgRU4BmdTG_ByEhZ9Bbew",
  authDomain: "workwise-2227a.firebaseapp.com",
  projectId: "workwise-2227a",
  storageBucket: "workwise-2227a.appspot.com",
  messagingSenderId: "23882934993",
  appId: "1:23882934993:web:c23a1a410cc81a1d17b3f0",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Optional: Enable emulators for local development if the environment is development
if (import.meta.env.DEV) {
  try {
    // Connect to emulators in development
    // connectAuthEmulator(auth, "http://localhost:9099");
    // connectFirestoreEmulator(db, "localhost", 8080);
    // connectFunctionsEmulator(functions, "localhost", 5001);
    connectStorageEmulator(storage, "localhost", 9199);
    console.log("Connected to Firebase Storage emulator on localhost:9199");
  } catch (e) {
    console.error("Error connecting to emulators", e);
  }
}

// Set CORS configuration for Storage
// This helps configure client-side settings to improve CORS behavior
storage.maxUploadRetryTime = 60000; // 60 seconds max retry time
storage.maxOperationRetryTime = 60000; // 60 seconds max operation time

// Configure Google provider to prompt account selection
googleProvider.setCustomParameters({
  prompt: "select_account",
});


