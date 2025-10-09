import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  increment,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { firestore } from '../../config/firebase';
import { FirestoreConversation, FirestoreMessage } from './types';

/**
 * Firestore Conversations Service
 */

/**
 * Create or update a conversation in Firestore
 */
export const createConversation = async (
  matchId: string,
  userAId: string,
  userBId: string,
  participants: FirestoreConversation['participants'],
  metadata?: FirestoreConversation['metadata']
): Promise<void> => {
  const conversationRef = doc(firestore, 'conversations', matchId);
  
  const conversation: Partial<FirestoreConversation> = {
    id: matchId,
    participantIds: [userAId, userBId],
    participants,
    unreadCount: {
      [userAId]: 0,
      [userBId]: 0,
    },
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
    metadata,
  };
  
  await setDoc(conversationRef, conversation, { merge: true });
};

/**
 * Get a single conversation by ID
 */
export const getConversation = async (conversationId: string): Promise<FirestoreConversation | null> => {
  const conversationRef = doc(firestore, 'conversations', conversationId);
  const conversationSnap = await getDoc(conversationRef);
  
  if (conversationSnap.exists()) {
    return conversationSnap.data() as FirestoreConversation;
  }
  
  return null;
};

/**
 * Get all conversations for a user
 */
export const getUserConversations = async (userId: string): Promise<FirestoreConversation[]> => {
  const conversationsRef = collection(firestore, 'conversations');
  const q = query(
    conversationsRef,
    where('participantIds', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  const conversations: FirestoreConversation[] = [];
  
  querySnapshot.forEach((doc) => {
    conversations.push(doc.data() as FirestoreConversation);
  });
  
  return conversations;
};

/**
 * Subscribe to real-time conversation updates for a user
 */
export const subscribeToUserConversations = (
  userId: string,
  callback: (conversations: FirestoreConversation[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const conversationsRef = collection(firestore, 'conversations');
  const q = query(
    conversationsRef,
    where('participantIds', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );
  
  return onSnapshot(
    q,
    (querySnapshot) => {
      const conversations: FirestoreConversation[] = [];
      querySnapshot.forEach((doc) => {
        conversations.push(doc.data() as FirestoreConversation);
      });
      callback(conversations);
    },
    (error) => {
      console.error('Error subscribing to conversations:', error);
      onError?.(error);
    }
  );
};

/**
 * Subscribe to a single conversation
 */
export const subscribeToConversation = (
  conversationId: string,
  callback: (conversation: FirestoreConversation | null) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const conversationRef = doc(firestore, 'conversations', conversationId);
  
  return onSnapshot(
    conversationRef,
    (docSnapshot) => {
      if (docSnapshot.exists()) {
        callback(docSnapshot.data() as FirestoreConversation);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error subscribing to conversation:', error);
      onError?.(error);
    }
  );
};

/**
 * Update conversation's last message
 */
export const updateConversationLastMessage = async (
  conversationId: string,
  message: Pick<FirestoreMessage, 'text' | 'senderId'>,
  recipientId: string
): Promise<void> => {
  const conversationRef = doc(firestore, 'conversations', conversationId);
  
  await setDoc(
    conversationRef,
    {
      lastMessage: {
        text: message.text,
        senderId: message.senderId,
        timestamp: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
      [`unreadCount.${recipientId}`]: increment(1),
    },
    { merge: true }
  );
};

/**
 * Mark all messages in a conversation as read
 */
export const markConversationAsRead = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  const conversationRef = doc(firestore, 'conversations', conversationId);
  
  await setDoc(
    conversationRef,
    {
      [`unreadCount.${userId}`]: 0,
    },
    { merge: true }
  );
};

/**
 * Get unread count for a user across all conversations
 */
export const getTotalUnreadCount = async (userId: string): Promise<number> => {
  const conversations = await getUserConversations(userId);
  return conversations.reduce((total, conv) => total + (conv.unreadCount[userId] || 0), 0);
};

/**
 * Delete a conversation (for unmatch)
 */
export const deleteConversation = async (conversationId: string): Promise<void> => {
  const batch = writeBatch(firestore);
  
  // Delete conversation document
  const conversationRef = doc(firestore, 'conversations', conversationId);
  batch.delete(conversationRef);
  
  // Delete all messages in the conversation
  const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
  const messagesSnapshot = await getDocs(messagesRef);
  
  messagesSnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
};

