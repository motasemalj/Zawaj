import { useState, useEffect, useCallback, useRef } from 'react';
import { Unsubscribe } from 'firebase/firestore';
import {
  FirestoreConversation,
  FirestoreMessage,
  subscribeToUserConversations,
  subscribeToConversation,
  subscribeToMessages,
  sendMessage,
  markConversationAsRead,
  markAllMessagesAsRead,
  getMessages,
  subscribeToUserPresence,
  subscribeToMultipleUsersPresence,
} from '../services/firebase';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

/**
 * Hook to subscribe to all conversations for a user
 */
export const useConversations = (userId: string | null) => {
  const [conversations, setConversations] = useState<FirestoreConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [authReady, setAuthReady] = useState(false);
  
  // Wait for Firebase Auth to be ready
  useEffect(() => {
    if (!userId) {
      setAuthReady(false);
      return;
    }
    
    // Check if Firebase Auth is ready
    const checkAuth = () => {
      const { auth } = require('../config/firebase');
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.uid === userId) {
        setAuthReady(true);
      } else {
        // Wait a bit and check again
        setTimeout(checkAuth, 500);
      }
    };
    
    checkAuth();
  }, [userId]);
  
  useEffect(() => {
    if (!userId || !authReady) {
      setConversations([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    const unsubscribe = subscribeToUserConversations(
      userId,
      (convos) => {
        setConversations(convos);
        setLoading(false);
      },
      (err) => {
        console.error('Error subscribing to conversations:', err);
        setError(err);
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [userId, authReady]);
  
  return { conversations, loading, error };
};

/**
 * Hook to subscribe to a single conversation
 */
export const useConversation = (conversationId: string | null) => {
  const [conversation, setConversation] = useState<FirestoreConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if (!conversationId) {
      setConversation(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    const unsubscribe = subscribeToConversation(
      conversationId,
      (convo) => {
        setConversation(convo);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [conversationId]);
  
  return { conversation, loading, error };
};

/**
 * Hook to subscribe to messages in a conversation with real-time updates
 */
export const useMessages = (conversationId: string | null, limitCount: number = 50) => {
  const [messages, setMessages] = useState<FirestoreMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [authReady, setAuthReady] = useState(false);
  
  // Wait for Firebase Auth to be ready
  useEffect(() => {
    if (!conversationId) {
      setAuthReady(false);
      return;
    }
    
    const checkAuth = () => {
      const { auth } = require('../config/firebase');
      const currentUser = auth.currentUser;
      if (currentUser) {
        setAuthReady(true);
      } else {
        setTimeout(checkAuth, 500);
      }
    };
    
    checkAuth();
  }, [conversationId]);
  
  useEffect(() => {
    if (!conversationId || !authReady) {
      setMessages([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    const unsubscribe = subscribeToMessages(
      conversationId,
      (msgs) => {
        setMessages(msgs);
        setLoading(false);
      },
      (err) => {
        console.error('Error subscribing to messages:', err);
        setError(err);
        setLoading(false);
      },
      limitCount
    );
    
    return () => unsubscribe();
  }, [conversationId, limitCount, authReady]);
  
  return { messages, loading, error };
};

/**
 * Hook for sending messages
 */
export const useSendMessage = () => {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const send = useCallback(async (
    conversationId: string,
    senderId: string,
    text: string,
    recipientId: string
  ) => {
    setSending(true);
    setError(null);
    
    try {
      const message = await sendMessage(conversationId, senderId, text, recipientId);
      setSending(false);
      return message;
    } catch (err) {
      setError(err as Error);
      setSending(false);
      throw err;
    }
  }, []);
  
  return { send, sending, error };
};

/**
 * Hook for marking conversation as read
 */
export const useMarkAsRead = () => {
  const [marking, setMarking] = useState(false);
  
  const markAsRead = useCallback(async (conversationId: string, userId: string) => {
    setMarking(true);
    
    try {
      await markConversationAsRead(conversationId, userId);
      await markAllMessagesAsRead(conversationId, userId);
      setMarking(false);
    } catch (err) {
      console.error('Error marking as read:', err);
      setMarking(false);
    }
  }, []);
  
  return { markAsRead, marking };
};

/**
 * Hook for loading older messages with pagination
 */
export const useLoadMoreMessages = (conversationId: string | null) => {
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  
  const loadMore = useCallback(async () => {
    if (!conversationId || loading || !hasMore) return [];
    
    setLoading(true);
    
    try {
      const result = await getMessages(conversationId, 30, lastDocRef.current || undefined);
      lastDocRef.current = result.lastDoc;
      setHasMore(result.hasMore);
      setLoading(false);
      return result.messages;
    } catch (err) {
      console.error('Error loading more messages:', err);
      setLoading(false);
      return [];
    }
  }, [conversationId, loading, hasMore]);
  
  const reset = useCallback(() => {
    lastDocRef.current = null;
    setHasMore(true);
  }, []);
  
  return { loadMore, loading, hasMore, reset };
};

/**
 * Hook to subscribe to user presence
 */
export const useUserPresence = (userId: string | null) => {
  const [online, setOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<number | undefined>(undefined);
  
  useEffect(() => {
    if (!userId) {
      setOnline(false);
      setLastSeen(undefined);
      return;
    }
    
    const unsubscribe = subscribeToUserPresence(userId, (isOnline, lastSeenTime) => {
      setOnline(isOnline);
      setLastSeen(lastSeenTime);
    });
    
    return () => unsubscribe();
  }, [userId]);
  
  return { online, lastSeen };
};

/**
 * Hook to subscribe to multiple users' presence
 */
export const useMultipleUsersPresence = (userIds: string[]) => {
  const [presenceMap, setPresenceMap] = useState<Map<string, { online: boolean; lastSeen?: number }>>(new Map());
  
  useEffect(() => {
    if (userIds.length === 0) {
      setPresenceMap(new Map());
      return;
    }
    
    const unsubscribes = subscribeToMultipleUsersPresence(userIds, (map) => {
      setPresenceMap(map);
    });
    
    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [JSON.stringify(userIds)]); // Use JSON.stringify to properly compare arrays
  
  return presenceMap;
};

/**
 * Get total unread count across all conversations
 */
export const useTotalUnreadCount = (conversations: FirestoreConversation[], userId: string | null) => {
  const [totalUnread, setTotalUnread] = useState(0);
  
  useEffect(() => {
    if (!userId) {
      setTotalUnread(0);
      return;
    }
    
    const total = conversations.reduce((sum, conv) => {
      return sum + (conv.unreadCount[userId] || 0);
    }, 0);
    
    setTotalUnread(total);
  }, [conversations, userId]);
  
  return totalUnread;
};

