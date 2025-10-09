import { Timestamp } from 'firebase/firestore';

/**
 * Firestore Data Models
 */

export interface FirestoreUser {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  lastSeen: Timestamp;
  online: boolean;
  fcmToken?: string;
  createdAt: Timestamp;
}

export interface FirestoreConversation {
  id: string; // matches matchId from backend
  participantIds: string[]; // [user_a_id, user_b_id]
  participants: {
    [userId: string]: {
      displayName: string;
      photoURL?: string;
      role?: string; // 'mother' | 'individual'
    };
  };
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: Timestamp;
  };
  unreadCount: {
    [userId: string]: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  metadata?: {
    isGuardianChat?: boolean;
  };
}

export interface FirestoreMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: Timestamp;
  readBy: {
    [userId: string]: Timestamp | null;
  };
  status: 'sent' | 'delivered' | 'read';
  metadata?: {
    edited?: boolean;
    editedAt?: Timestamp;
  };
}

export interface UserPresence {
  userId: string;
  online: boolean;
  lastSeen: number; // timestamp
  connections: {
    [connectionId: string]: {
      timestamp: number;
    };
  };
}

