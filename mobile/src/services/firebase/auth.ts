import { auth, firestore } from '../../config/firebase';
import { signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Firebase Authentication Service
 * 
 * This handles authenticating users with Firebase using email/password
 * to enable Firestore security rules and real-time features.
 */

export const signInFirebase = async (email: string, userId: string) => {
  try {
    // Use userId as password for simplicity (in production, use a proper auth flow)
    // This is a simple mapping to enable Firebase Auth for Firestore rules
    const password = `zawaj_${userId}`;
    
    // Try to sign in with retries (backend might still be creating the user)
    let signInSuccess = false;
    let lastError: any = null;
    
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        signInSuccess = true;
        break;
      } catch (error: any) {
        lastError = error;
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          // User might not be created yet on backend, wait and retry
          console.log(`Firebase auth attempt ${attempt + 1}/5 - user not found, waiting...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        } else {
          // Other error, don't retry
          throw error;
        }
      }
    }
    
    if (!signInSuccess) {
      console.error('Firebase sign in failed after retries:', lastError);
      throw lastError;
    }
    
    // Update user presence in Firestore
    const userRef = doc(firestore, 'users', userId);
    await setDoc(
      userRef,
      {
        id: userId,
        email,
        lastSeen: serverTimestamp(),
        online: true,
      },
      { merge: true }
    );
    
    console.log(`✅ Firebase signed in successfully for ${userId}`);
    return auth.currentUser;
  } catch (error) {
    console.error('Firebase sign in error:', error);
    throw error;
  }
};

export const signOutFirebase = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Firebase sign out error:', error);
    throw error;
  }
};

export const getCurrentFirebaseUser = () => {
  return auth.currentUser;
};

