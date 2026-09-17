import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

/** Same Firebase project as Suwasiri / GP Care (`suwasiri-91824`). */
export const firebaseWebConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyALd8jtXBmIq2FLwr6yVFvldinKUQtF8e0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "suwasiri-91824.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "suwasiri-91824",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "suwasiri-91824.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "900720308322",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:900720308322:web:6874ced939987e6d7f613b",
};

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseWebConfig.apiKey && firebaseWebConfig.projectId && firebaseWebConfig.appId);
}

let app: FirebaseApp | undefined;
let db: Firestore | undefined;

export function getFirebaseApp(): FirebaseApp {
  if (app) return app;
  app = getApps()[0] ?? initializeApp(firebaseWebConfig);
  return app;
}

export function getFirebaseDb(): Firestore {
  if (!db) db = getFirestore(getFirebaseApp());
  return db;
}
