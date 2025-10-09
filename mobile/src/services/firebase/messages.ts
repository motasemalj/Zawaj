import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  updateDoc,
  QueryDocumentSnapshot,
  DocumentData,
  Unsubscribe,
  where,
  writeBatch,
} from 'firebase/firestore';
import { firestore } from '../../config/firebase';
import { FirestoreMessage } from './types';
import { updateConversationLastMessage } from './conversations';

/**
 * Firestore Messages Service
 */

const MESSAGES_PAGE_SIZE = 30;

/**
 * Send a message in a conversation
 */
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  text: string,
  recipientId: string
): Promise<FirestoreMessage> => {
  const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
  
  const messageData: Omit<FirestoreMessage, 'id'> = {
    conversationId,
    senderId,
    text,
    createdAt: serverTimestamp() as Timestamp,
    readBy: {
      [senderId]: serverTimestamp() as Timestamp,
      [recipientId]: null,
    },
    status: 'sent',
  };
  
  const docRef = await addDoc(messagesRef, messageData);
  
  // Update conversation's last message
  await updateConversationLastMessage(conversationId, { text, senderId }, recipientId);
  
  return {
    id: docRef.id,
    ...messageData,
  };
};

/**
 * Get messages with pagination
 */
export const getMessages = async (
  conversationId: string,
  pageSize: number = MESSAGES_PAGE_SIZE,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{
  messages: FirestoreMessage[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}> => {
  const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
  
  let q = query(
    messagesRef,
    orderBy('createdAt', 'desc'),
    limit(pageSize + 1) // Fetch one extra to check if there are more
  );
  
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }
  
  const querySnapshot = await getDocs(q);
  const messages: FirestoreMessage[] = [];
  const docs: QueryDocumentSnapshot<DocumentData>[] = [];
  
  querySnapshot.forEach((doc) => {
    docs.push(doc);
    messages.push({ id: doc.id, ...doc.data() } as FirestoreMessage);
  });
  
  const hasMore = messages.length > pageSize;
  
  if (hasMore) {
    messages.pop(); // Remove the extra message
    docs.pop();
  }
  
  return {
    messages: messages.reverse(), // Reverse to show oldest first
    lastDoc: docs.length > 0 ? docs[docs.length - 1] : null,
    hasMore,
  };
};

/**
 * Subscribe to real-time message updates
 */
export const subscribeToMessages = (
  conversationId: string,
  callback: (messages: FirestoreMessage[]) => void,
  onError?: (error: Error) => void,
  limitCount: number = 50
): Unsubscribe => {
  const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
  const q = query(
    messagesRef,
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  return onSnapshot(
    q,
    (querySnapshot) => {
      const messages: FirestoreMessage[] = [];
      querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as FirestoreMessage);
      });
      callback(messages.reverse()); // Reverse to show oldest first
    },
    (error) => {
      console.error('Error subscribing to messages:', error);
      onError?.(error);
    }
  );
};

/**
 * Mark message as read
 */
export const markMessageAsRead = async (
  conversationId: string,
  messageId: string,
  userId: string
): Promise<void> => {
  const messageRef = doc(firestore, 'conversations', conversationId, 'messages', messageId);
  
  await updateDoc(messageRef, {
    [`readBy.${userId}`]: serverTimestamp(),
    status: 'read',
  });
};

/**
 * Mark all messages in a conversation as read for a user
 */
export const markAllMessagesAsRead = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
  const q = query(
    messagesRef,
    where(`readBy.${userId}`, '==', null)
  );
  
  const querySnapshot = await getDocs(q);
  const batch = writeBatch(firestore);
  
  querySnapshot.forEach((doc) => {
    batch.update(doc.ref, {
      [`readBy.${userId}`]: serverTimestamp(),
      status: 'read',
    });
  });
  
  await batch.commit();
};

/**
 * Get unread message count for a conversation
 */
export const getUnreadMessageCount = async (
  conversationId: string,
  userId: string
): Promise<number> => {
  const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
  const q = query(
    messagesRef,
    where(`readBy.${userId}`, '==', null)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.size;
};

