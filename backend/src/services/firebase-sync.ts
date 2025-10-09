import { firestore, auth } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Firebase Sync Service
 * 
 * Handles syncing data between backend PostgreSQL/SQLite and Firebase Firestore
 */

interface User {
  id: string;
  email: string;
  display_name: string;
  role?: string;
  photos?: Array<{ url: string }>;
}

/**
 * Create or update a user in Firebase Auth and Firestore
 */
export async function syncUserToFirebase(user: User): Promise<void> {
  try {
    const userId = user.id;
    const rawEmail = (user.email || '').toLowerCase().trim();
    const isValidEmail = /[^@\s]+@[^@\s]+\.[^@\s]+/.test(rawEmail);
    const email = isValidEmail ? rawEmail : `${userId}@zawaj.app`;
    const password = `zawaj_${userId}`; // Simple password for auth
    
    // Create or update user in Firebase Auth
    try {
      await auth.getUser(userId);
      // User exists, update
      await auth.updateUser(userId, {
        email,
        displayName: user.display_name || userId,
      });
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // User doesn't exist, create
        await auth.createUser({
          uid: userId,
          email,
          password,
          displayName: user.display_name || userId,
        });
      } else {
        throw error;
      }
    }
    
    // Create or update user in Firestore
    const userRef = firestore.collection('users').doc(userId);
    await userRef.set({
      id: userId,
      email,
      displayName: user.display_name || userId,
      photoURL: user.photos?.[0]?.url || null,
      createdAt: FieldValue.serverTimestamp(),
      lastSeen: FieldValue.serverTimestamp(),
      online: false,
    }, { merge: true });
    
    console.log(`✅ User ${userId} synced to Firebase`);
  } catch (error) {
    console.error('Error syncing user to Firebase:', error);
    throw error;
  }
}

/**
 * Create a conversation in Firestore when a match occurs
 */
export async function createFirestoreConversation(
  matchId: string,
  userA: User,
  userB: User
): Promise<void> {
  try {
    const conversationRef = firestore.collection('conversations').doc(matchId);
    
    // Check if conversation already exists
    const conversationSnap = await conversationRef.get();
    if (conversationSnap.exists) {
      console.log(`Conversation ${matchId} already exists`);
      return;
    }
    
    // Create conversation
    await conversationRef.set({
      id: matchId,
      participantIds: [userA.id, userB.id],
      participants: {
        [userA.id]: {
          displayName: userA.display_name,
          photoURL: userA.photos?.[0]?.url || null,
          role: userA.role || null,
        },
        [userB.id]: {
          displayName: userB.display_name,
          photoURL: userB.photos?.[0]?.url || null,
          role: userB.role || null,
        },
      },
      unreadCount: {
        [userA.id]: 0,
        [userB.id]: 0,
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      metadata: {
        isGuardianChat: userA.role === 'mother' || userB.role === 'mother',
      },
    });
    
    console.log(`✅ Firestore conversation ${matchId} created`);
  } catch (error) {
    console.error('Error creating Firestore conversation:', error);
    throw error;
  }
}

/**
 * Delete a conversation from Firestore when unmatch occurs
 */
export async function deleteFirestoreConversation(matchId: string): Promise<void> {
  try {
    const conversationRef = firestore.collection('conversations').doc(matchId);
    
    // Delete all messages in the conversation
    const messagesRef = conversationRef.collection('messages');
    const messagesSnap = await messagesRef.get();
    
    const batch = firestore.batch();
    
    messagesSnap.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Delete the conversation
    batch.delete(conversationRef);
    
    await batch.commit();
    
    console.log(`✅ Firestore conversation ${matchId} deleted`);
  } catch (error) {
    console.error('Error deleting Firestore conversation:', error);
    throw error;
  }
}

/**
 * Send a push notification to a user
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: any
): Promise<void> {
  try {
    const userRef = firestore.collection('users').doc(userId);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
      console.log(`User ${userId} not found in Firestore`);
      return;
    }
    
    const userData = userSnap.data();
    const fcmToken = userData?.fcmToken;
    
    if (!fcmToken) {
      console.log(`User ${userId} has no FCM token`);
      return;
    }
    
    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      token: fcmToken,
    };
    
    const messaging = (await import('./firebase-admin')).messaging;
    await messaging.send(message);
    
    console.log(`✅ Push notification sent to user ${userId}`);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

