# Firebase/Firestore Chat Setup Guide

This guide will walk you through setting up Firebase for the Zawaj app's real-time chat functionality.

## Features Implemented

✅ **Firebase Authentication** - Email-based auth for Firestore security  
✅ **Firestore** - Conversations and messages with real-time sync  
✅ **Realtime Database** - Online/offline presence tracking  
✅ **Cloud Functions** - Push notifications and automated tasks  
✅ **Push Notifications** - FCM via Expo Notifications  
✅ **Security Rules** - Secure access to chat data  
✅ **Pagination** - Load older messages on demand  
✅ **Read Receipts** - Track message read status  
✅ **Unread Counts** - Per-conversation and total counts  
✅ **Typing Indicators** - Real-time presence  

## Setup Steps

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name it (e.g., "zawaj-app")
4. Enable Google Analytics (optional)
5. Create project

### 2. Enable Firebase Services

#### Enable Authentication
1. In Firebase Console → Authentication → Get Started
2. Enable **Email/Password** sign-in method

#### Enable Firestore Database
1. Go to Firestore Database → Create Database
2. Start in **Production mode** (we'll add rules next)
3. Choose your region (e.g., `us-central1`)

#### Enable Realtime Database
1. Go to Realtime Database → Create Database
2. Start in **Locked mode**
3. We'll update rules next

#### Enable Cloud Messaging (FCM)
1. Go to Project Settings → Cloud Messaging
2. Note your **Server Key** (for backend)
3. For iOS: Upload APNs certificate

### 3. Configure Firebase in Mobile App

1. **Get Firebase Config:**
   - Go to Project Settings → General
   - Scroll to "Your apps" → Add app → Web
   - Register app and copy the `firebaseConfig` object

2. **Update Mobile Config:**
   Edit `/mobile/src/config/firebase.ts`:
   ```typescript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID",
   };
   ```

3. **Update Expo Push Token:**
   Edit `/mobile/src/services/firebase/notifications.ts`:
   ```typescript
   const token = await Notifications.getExpoPushTokenAsync({
     projectId: 'YOUR_EXPO_PROJECT_ID', // Get from app.json
   });
   ```

### 4. Configure Firebase in Backend

1. **Create Service Account:**
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save the JSON file securely

2. **Set Environment Variables:**
   Create `/backend/.env`:
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

   Or place the service account JSON file in `/backend/` and update the path in `firebase-admin.ts`

### 5. Deploy Firestore Security Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
cd /path/to/Zawaj
firebase init

# Select:
# - Firestore (rules and indexes)
# - Realtime Database (rules)
# - Functions

# Deploy rules
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only database
```

#### Firestore Rules (already in `firestore.rules`)
These rules ensure:
- Users can only read/write their own conversations
- Messages can only be read by conversation participants
- Users can only send messages as themselves

#### Realtime Database Rules
Update in Firebase Console → Realtime Database → Rules:
```json
{
  "rules": {
    "presence": {
      "$userId": {
        ".read": true,
        ".write": "$userId === auth.uid"
      }
    }
  }
}
```

### 6. Deploy Cloud Functions

```bash
cd firebase-functions
npm install
npm run deploy
```

This deploys:
- `sendMessageNotification` - Push notifications for new messages
- `sendMatchNotification` - Push notifications for new matches
- `updateConversationOnMessage` - Backup conversation updater
- `cleanupMessagesOnConversationDelete` - Cleanup on unmatch

### 7. Update Navigation to Use Firebase Screens

Edit `/mobile/src/navigation/index.tsx`:

```typescript
// Replace these imports:
import ChatScreen from '../screens/ChatScreen';
import MatchesScreen from '../screens/MatchesScreen';

// With:
import FirebaseChatScreen from '../screens/FirebaseChatScreen';
import FirebaseMatchesScreen from '../screens/FirebaseMatchesScreen';

// Then update the screens:
<Tab.Screen 
  name="Matches" 
  component={FirebaseMatchesScreen} 
  options={/* ... */} 
/>

<Stack.Screen 
  name="Chat" 
  component={FirebaseChatScreen} 
  options={/* ... */} 
/>
```

### 8. Initialize Firebase on Login

Update your login/auth flow to initialize Firebase:

```typescript
import { initializeFirebaseForUser, cleanupFirebaseForUser } from '../services/firebase/init';

// After successful login:
await initializeFirebaseForUser(userId, email);

// On logout:
await cleanupFirebaseForUser(userId);
```

### 9. Handle App State for Presence

Add to your `App.tsx`:

```typescript
import { useAppStatePresence } from './src/services/firebase/init';

function AppContent() {
  const currentUserId = useApiState((state) => state.currentUserId);
  useAppStatePresence(currentUserId);
  
  // ... rest of your app
}
```

## Testing

### Test Chat Functionality

1. **Create two test accounts** in your app
2. **Make them match** by swiping right on each other
3. **Open chat** and send messages
4. Verify:
   - ✅ Messages appear in real-time
   - ✅ Read receipts update
   - ✅ Unread counts show correctly
   - ✅ Online/offline status updates

### Test Push Notifications

1. **Send a message** from User A to User B
2. **Put User B's app in background**
3. **Verify push notification** appears

### Test Pagination

1. **Send 50+ messages** in a conversation
2. **Scroll to top** in chat
3. **Verify older messages load**

## Firestore Data Structure

### Collections

```
/users/{userId}
  - id: string
  - email: string
  - displayName: string
  - photoURL: string
  - lastSeen: timestamp
  - online: boolean
  - fcmToken: string

/conversations/{matchId}
  - id: string (matches matchId from backend)
  - participantIds: string[]
  - participants: { [userId]: { displayName, photoURL, role } }
  - lastMessage: { text, senderId, timestamp }
  - unreadCount: { [userId]: number }
  - createdAt: timestamp
  - updatedAt: timestamp
  
/conversations/{matchId}/messages/{messageId}
  - id: string
  - conversationId: string
  - senderId: string
  - text: string
  - createdAt: timestamp
  - readBy: { [userId]: timestamp | null }
  - status: 'sent' | 'delivered' | 'read'
```

### Realtime Database Structure

```
/presence/{userId}
  - userId: string
  - online: boolean
  - lastSeen: number (timestamp)
  - connections: { [connectionId]: { timestamp } }
```

## Indexes

The required indexes are defined in `firestore.indexes.json`. They are automatically created when you run:

```bash
firebase deploy --only firestore:indexes
```

## Cost Optimization

### Firestore
- Use pagination (already implemented)
- Limit real-time listeners to active conversations
- Clean up old data periodically

### Realtime Database
- Presence data is minimal
- Automatically cleaned on disconnect

### Cloud Functions
- Only trigger on necessary events
- Keep functions lightweight

### Storage
- Use Firestore (not Storage) for messages (text-only)
- Images are stored on your backend

## Troubleshooting

### "Permission denied" errors
- Check Firestore rules are deployed
- Verify user is authenticated in Firebase Auth
- Ensure userId matches auth.uid

### Messages not appearing in real-time
- Check internet connection
- Verify Firestore listeners are active
- Check browser/app console for errors

### Push notifications not working
- Verify FCM token is saved in Firestore
- Check Cloud Function logs
- Ensure device has notification permissions

### Presence not updating
- Check Realtime Database rules
- Verify `setUserOnline/Offline` is called
- Check app state change handlers

## Security Best Practices

✅ **Firestore Rules** - Restrict access to conversation participants  
✅ **Server-side validation** - Backend validates match eligibility  
✅ **Content filtering** - Backend filters inappropriate messages  
✅ **Rate limiting** - Implement if needed for production  
✅ **User blocking** - Prevent blocked users from messaging  

## Monitoring

### Firebase Console
- Monitor Firestore usage
- Check Cloud Function logs
- Review authentication logs
- Track FCM delivery

### Analytics
- Track message send/receive rates
- Monitor conversation activity
- Analyze push notification open rates

## Next Steps

1. **Test thoroughly** with multiple users
2. **Monitor costs** in Firebase Console
3. **Set up alerts** for quota limits
4. **Implement rate limiting** if needed
5. **Add analytics** for user engagement
6. **Consider scaling** strategy for growth

## Support

For issues:
- Check Firebase Console logs
- Review Cloud Function logs
- Check app console errors
- Verify environment variables
- Test with Firebase emulators first

---

**🎉 Your Firebase chat is now ready!**

The implementation includes all the features requested:
- ✅ Email authentication
- ✅ Real-time conversations
- ✅ Pagination
- ✅ Read receipts
- ✅ Unread counts
- ✅ Online presence
- ✅ Push notifications
- ✅ Security rules
- ✅ Recommended indexes

