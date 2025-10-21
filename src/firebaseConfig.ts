// src/firebaseConfig.ts
import { initializeApp } from "firebase/app"; // Make sure initializeApp is imported
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// --- Add this console log for debugging ---
console.log("Reading VITE_FIREBASE_PROJECT_ID:", import.meta.env.VITE_FIREBASE_PROJECT_ID);
console.log("All env vars:", import.meta.env); // Log all Vite env vars
// ------------------------------------------

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID, // Must read correctly here
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db };

// TODO: Firebase Console Setup Reminder
// 1. Enable Anonymous Authentication in the Firebase console:
//    - Go to Authentication > Sign-in method > Anonymous > Enable
// 2. Set up Firestore database rules:
//    - Go to Firestore Database > Rules
//    - Consider rules for anonymous users and chat message storage