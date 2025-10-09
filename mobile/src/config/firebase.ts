import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase project configuration for Zawaj app
const firebaseConfig = {
  apiKey: "AIzaSyCzsnX3M-b44dvpzOCELPrrCSJWVbfcRsU",
  authDomain: "zawaj-febda.firebaseapp.com",
  databaseURL: "https://zawaj-febda-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "zawaj-febda",
  storageBucket: "zawaj-febda.firebasestorage.app",
  messagingSenderId: "793093011545",
  appId: "1:793093011545:web:a1c2dd937c60648a5d9948",
  measurementId: "G-NFGMB0DQV3"
};

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with offline persistence
const firestore = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
});

// Initialize Realtime Database for presence
const database = getDatabase(app);

// Initialize Auth with AsyncStorage persistence (for Firebase email auth to match user IDs)
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error: any) {
  // If already initialized, get the existing instance
  if (error.code === 'auth/already-initialized') {
    auth = getAuth(app);
  } else {
    throw error;
  }
}

export { app, firestore, database, auth };

