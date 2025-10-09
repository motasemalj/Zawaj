import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import { getMessaging } from 'firebase-admin/messaging';

/**
 * Firebase Admin SDK initialization
 * 
 * This service allows the backend to interact with Firebase services
 * including Firestore, Authentication, and Realtime Database
 */

// Initialize Firebase Admin only once
if (!getApps().length) {
  // Option 1: Use service account key file (recommended for production)
  // Download from Firebase Console > Project Settings > Service Accounts
  // const serviceAccount = require('../../path/to/serviceAccountKey.json');
  // admin.initializeApp({
  //   credential: admin.credential.cert(serviceAccount),
  //   databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com"
  // });
  
  // Option 2: Use default credentials (when deployed on Google Cloud)
  // admin.initializeApp({
  //   credential: admin.credential.applicationDefault(),
  //   databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com"
  // });
  
  // Use environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID || 'zawaj-febda';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  if (clientEmail && privateKey) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      databaseURL: `https://${projectId}-default-rtdb.europe-west1.firebasedatabase.app`,
    });
    console.log('✅ Firebase Admin initialized successfully');
  } else {
    console.warn('⚠️ Firebase Admin not initialized - missing credentials');
    console.warn('Make sure FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY are set in .env');
    // Initialize with minimal config for development
    initializeApp({
      projectId,
    });
  }
}

export const firestore = getFirestore();
export const auth = getAuth();
export const database = getDatabase();
export const messaging = getMessaging();

export { getApps, initializeApp, cert };

