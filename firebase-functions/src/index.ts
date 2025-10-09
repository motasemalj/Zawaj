import { onDocumentCreated, onDocumentDeleted } from 'firebase-functions/v2/firestore';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

initializeApp();

/**
 * Cloud Function: Send push notification when a new message is sent
 * 
 * Triggers when a new message document is created in Firestore
 */
export const sendMessageNotification = onDocumentCreated(
  'conversations/{conversationId}/messages/{messageId}',
  async (event) => {
    const snapshot = event.data;
    const { conversationId, messageId } = event.params;
    
    if (!snapshot) return;
    
    const message = snapshot.data();
    if (!message) return;
    
    const { senderId, text } = message;
    
    try {
      const db = getFirestore();
      const messaging = getMessaging();
      
      // Get conversation to find recipient
      const conversationRef = db.collection('conversations').doc(conversationId);
      const conversationSnap = await conversationRef.get();
      
      if (!conversationSnap.exists) {
        console.log('Conversation not found');
        return;
      }
      
      const conversation = conversationSnap.data();
      if (!conversation) return;
      
      const recipientId = conversation.participantIds.find((id: string) => id !== senderId);
      
      if (!recipientId) {
        console.log('Recipient not found');
        return;
      }
      
      // Get recipient's FCM token
      const recipientRef = db.collection('users').doc(recipientId);
      const recipientSnap = await recipientRef.get();
      
      if (!recipientSnap.exists) {
        console.log('Recipient user not found');
        return;
      }
      
      const recipient = recipientSnap.data();
      if (!recipient?.fcmToken) {
        console.log('Recipient has no FCM token');
        return;
      }
      
      // Get sender info
      const senderName = conversation.participants[senderId]?.displayName || 'Someone';
      
      // Send notification
      const payload = {
        notification: {
          title: senderName,
          body: text.length > 100 ? text.substring(0, 100) + '...' : text,
        },
        data: {
          type: 'new_message',
          conversationId,
          senderId,
          messageId: messageId,
        },
        token: recipient.fcmToken,
      };
      
      await messaging.send(payload);
      
      console.log(`✅ Notification sent to ${recipientId} for message from ${senderId}`);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
);

/**
 * Cloud Function: Update conversation's lastMessage when a message is created
 * 
 * This is a backup in case the client-side update fails
 */
export const updateConversationOnMessage = onDocumentCreated(
  'conversations/{conversationId}/messages/{messageId}',
  async (event) => {
    const snapshot = event.data;
    const { conversationId } = event.params;
    
    if (!snapshot) return;
    
    const message = snapshot.data();
    if (!message) return;
    
    const { senderId, text, createdAt } = message;
    
    try {
      const db = getFirestore();
      const conversationRef = db.collection('conversations').doc(conversationId);
      const conversationSnap = await conversationRef.get();
      
      if (!conversationSnap.exists) return;
      
      const conversation = conversationSnap.data();
      if (!conversation) return;
      
      const recipientId = conversation.participantIds.find((id: string) => id !== senderId);
      
      await conversationRef.update({
        lastMessage: {
          text,
          senderId,
          timestamp: createdAt,
        },
        updatedAt: FieldValue.serverTimestamp(),
        [`unreadCount.${recipientId}`]: FieldValue.increment(1),
      });
      
      console.log(`✅ Conversation ${conversationId} updated`);
    } catch (error) {
      console.error('Error updating conversation:', error);
    }
  }
);

/**
 * Cloud Function: Clean up messages when a conversation is deleted
 */
export const cleanupMessagesOnConversationDelete = onDocumentDeleted(
  'conversations/{conversationId}',
  async (event) => {
    const { conversationId } = event.params;
    
    try {
      const db = getFirestore();
      const messagesRef = db
        .collection('conversations')
        .doc(conversationId)
        .collection('messages');
      
      const messagesSnap = await messagesRef.get();
      
      if (messagesSnap.empty) {
        console.log('No messages to delete');
        return;
      }
      
      const batch = db.batch();
      
      messagesSnap.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      console.log(`✅ Deleted ${messagesSnap.size} messages from conversation ${conversationId}`);
    } catch (error) {
      console.error('Error deleting messages:', error);
    }
  }
);

/**
 * Cloud Function: Send notification for new match
 */
export const sendMatchNotification = onDocumentCreated(
  'conversations/{conversationId}',
  async (event) => {
    const snapshot = event.data;
    const { conversationId } = event.params;
    
    if (!snapshot) return;
    
    const conversation = snapshot.data();
    if (!conversation) return;
    
    const { participantIds, participants } = conversation;
    
    try {
      const db = getFirestore();
      const messaging = getMessaging();
      
      // Send notifications to both users
      const notifications = participantIds.map(async (userId: string) => {
        const otherUserId = participantIds.find((id: string) => id !== userId);
        const otherUserName = participants[otherUserId]?.displayName || 'Someone';
        
        const userRef = db.collection('users').doc(userId);
        const userSnap = await userRef.get();
        
        if (!userSnap.exists || !userSnap.data()?.fcmToken) {
          console.log(`User ${userId} has no FCM token`);
          return;
        }
        
        const fcmToken = userSnap.data()?.fcmToken;
        
        const payload = {
          notification: {
            title: '🎉 توافق جديد!',
            body: `لديك توافق جديد مع ${otherUserName}`,
          },
          data: {
            type: 'new_match',
            conversationId: conversationId,
            userId: otherUserId,
          },
          token: fcmToken,
        };
        
        return messaging.send(payload);
      });
      
      await Promise.all(notifications);
      
      console.log(`✅ Match notifications sent for conversation ${conversationId}`);
    } catch (error) {
      console.error('Error sending match notification:', error);
    }
  }
);

