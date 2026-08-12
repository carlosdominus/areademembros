import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import configData from '../../firebase-applet-config.json';

const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || configData.projectId,
  appId: metaEnv.VITE_FIREBASE_APP_ID || configData.appId,
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || configData.apiKey,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || configData.authDomain,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || configData.storageBucket,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || configData.messagingSenderId,
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || configData.measurementId,
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with local persistence
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error('Erro ao configurar persistência do Firebase Auth:', err);
});

// Initialize Firestore targeting the specific database ID
export const db = getFirestore(app, metaEnv.VITE_FIREBASE_DATABASE_ID || configData.firestoreDatabaseId || '(default)');
