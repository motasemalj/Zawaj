import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { setUserOnline, setUserOffline } from './presence';
import { signInFirebase, signOutFirebase } from './auth';
import { registerForPushNotifications } from './notifications';

/**
 * Initialize Firebase services for a logged-in user
 */
export const initializeFirebaseForUser = async (userId: string, email: string) => {
  try {
    // 1. Sign in to Firebase Auth
    await signInFirebase(email, userId);
    
    // 2. Set user presence as online
    await setUserOnline(userId);
    
    // 3. Register for push notifications
    await registerForPushNotifications(userId);
    
    console.log('✅ Firebase initialized for user:', userId);
  } catch (error) {
    console.error('Error initializing Firebase for user:', error);
  }
};

/**
 * Cleanup Firebase services when user logs out
 */
export const cleanupFirebaseForUser = async (userId: string) => {
  try {
    // 1. Set user presence as offline
    await setUserOffline(userId);
    
    // 2. Sign out from Firebase Auth
    await signOutFirebase();
    
    console.log('✅ Firebase cleaned up for user:', userId);
  } catch (error) {
    console.error('Error cleaning up Firebase for user:', error);
  }
};

/**
 * Hook to handle app state changes for presence management
 */
export const useAppStatePresence = (userId: string | null) => {
  useEffect(() => {
    if (!userId) return;
    
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App came to foreground
        await setUserOnline(userId);
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App went to background
        await setUserOffline(userId);
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [userId]);
};

