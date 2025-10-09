import {
  ref,
  set,
  onValue,
  onDisconnect,
  serverTimestamp,
  get,
  DatabaseReference,
  Unsubscribe,
} from 'firebase/database';
import { database } from '../../config/firebase';
import { UserPresence } from './types';

/**
 * Firebase Realtime Database Presence Service
 * 
 * Tracks online/offline status of users
 */

/**
 * Set user online status
 */
export const setUserOnline = async (userId: string): Promise<void> => {
  const userStatusRef = ref(database, `presence/${userId}`);
  
  // Create a unique connection ID
  const connectionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const connectionRef = ref(database, `presence/${userId}/connections/${connectionId}`);
  
  // Set user as online
  const onlineStatus: Partial<UserPresence> = {
    userId,
    online: true,
    lastSeen: serverTimestamp() as number,
  };
  
  await set(userStatusRef, onlineStatus);
  
  // Set connection
  await set(connectionRef, {
    timestamp: serverTimestamp(),
  });
  
  // Set up disconnect handler - when user disconnects, set offline
  const offlineStatus: Partial<UserPresence> = {
    userId,
    online: false,
    lastSeen: serverTimestamp() as number,
  };
  
  onDisconnect(userStatusRef).set(offlineStatus);
  onDisconnect(connectionRef).remove();
};

/**
 * Set user offline status explicitly
 */
export const setUserOffline = async (userId: string): Promise<void> => {
  try {
    const userStatusRef = ref(database, `presence/${userId}`);
    
    const offlineStatus: Partial<UserPresence> = {
      userId,
      online: false,
      lastSeen: Date.now(), // Use client timestamp instead of server for offline
    };
    
    await set(userStatusRef, offlineStatus);
  } catch (error: any) {
    // Ignore permission errors on logout - user might already be signed out
    if (error.code !== 'PERMISSION_DENIED') {
      throw error;
    }
    console.log('Presence offline write skipped (not authenticated)');
  }
};

/**
 * Get user online status
 */
export const getUserOnlineStatus = async (userId: string): Promise<boolean> => {
  const userStatusRef = ref(database, `presence/${userId}`);
  const snapshot = await get(userStatusRef);
  
  if (snapshot.exists()) {
    const data = snapshot.val() as UserPresence;
    return data.online || false;
  }
  
  return false;
};

/**
 * Subscribe to user online status changes
 */
export const subscribeToUserPresence = (
  userId: string,
  callback: (online: boolean, lastSeen?: number) => void
): Unsubscribe => {
  const userStatusRef = ref(database, `presence/${userId}`);
  
  const unsubscribe = onValue(userStatusRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val() as UserPresence;
      callback(data.online || false, data.lastSeen);
    } else {
      callback(false);
    }
  });
  
  return unsubscribe;
};

/**
 * Subscribe to multiple users' presence
 */
export const subscribeToMultipleUsersPresence = (
  userIds: string[],
  callback: (presenceMap: Map<string, { online: boolean; lastSeen?: number }>) => void
): Unsubscribe[] => {
  const unsubscribes: Unsubscribe[] = [];
  const presenceMap = new Map<string, { online: boolean; lastSeen?: number }>();
  
  userIds.forEach((userId) => {
    const unsubscribe = subscribeToUserPresence(userId, (online, lastSeen) => {
      presenceMap.set(userId, { online, lastSeen });
      callback(new Map(presenceMap));
    });
    
    unsubscribes.push(unsubscribe);
  });
  
  return unsubscribes;
};

