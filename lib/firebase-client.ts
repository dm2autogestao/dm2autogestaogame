"use client";

import { getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyAxS6qEJSXN6iPpsHWtUJ44gauRQYerCt4",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "dm2-auto-gestao-20260526.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "dm2-auto-gestao-20260526",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "dm2-auto-gestao-20260526.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "858551997910",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:858551997910:web:53e017a26e813634158077"
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

export const firebaseApp = isFirebaseConfigured && !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const firebaseAuth = isFirebaseConfigured ? getAuth(firebaseApp) : null;
export const firestoreDb = isFirebaseConfigured ? getFirestore(firebaseApp) : null;

export const googleProvider = new GoogleAuthProvider();
export const microsoftProvider = new OAuthProvider("microsoft.com");
