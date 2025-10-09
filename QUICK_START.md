# 🚀 Firebase Chat Quick Start

## Prerequisites

- Firebase account
- Firebase CLI installed: `npm install -g firebase-tools`
- Expo account (for push notifications)

## Step 1: Firebase Project Setup (5 minutes)

```bash
# 1. Create Firebase project
# Go to https://console.firebase.google.com/
# Click "Add project" → Name it "zawaj-app" → Create

# 2. Enable services:
# - Authentication → Email/Password
# - Firestore Database → Production mode → us-central1
# - Realtime Database → Locked mode
# - Cloud Messaging → Enable
```

## Step 2: Get Firebase Credentials (3 minutes)

### For Mobile App:
```bash
# Firebase Console → Project Settings → General → Your apps → Web
# Copy the firebaseConfig object
```

Update `/mobile/src/config/firebase.ts`:
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

### For Backend:
```bash
# Firebase Console → Project Settings → Service Accounts
# Click "Generate new private key" → Save JSON file
```

Create `/backend/.env`:
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Key-Here\n-----END PRIVATE KEY-----\n"
```

## Step 3: Deploy Firebase Rules & Functions (5 minutes)

```bash
# Login to Firebase
firebase login

# Initialize Firebase in project
cd /path/to/Zawaj
firebase init

# Select:
# ☑ Firestore
# ☑ Realtime Database  
# ☑ Functions

# Choose existing project → select your project

# Deploy everything
firebase deploy
```

## Step 4: Update App Code (2 minutes)

### Update Navigation:
Edit `/mobile/src/navigation/index.tsx`:

```typescript
// Replace these lines:
import ChatScreen from '../screens/ChatScreen';
import MatchesScreen from '../screens/MatchesScreen';

// With these:
import ChatScreen from '../screens/FirebaseChatScreen';
import MatchesScreen from '../screens/FirebaseMatchesScreen';
```

### Initialize Firebase on Login:
Edit your login handler (e.g., in `LoginScreen` or auth store):

```typescript
import { initializeFirebaseForUser } from '../services/firebase/init';

// After successful login:
const userId = user.id;
const email = user.email;
await initializeFirebaseForUser(userId, email);
```

### Cleanup on Logout:
Edit your logout handler:

```typescript
import { cleanupFirebaseForUser } from '../services/firebase/init';

// Before logout:
const userId = currentUserId;
await cleanupFirebaseForUser(userId);
```

### Add Presence Tracking:
Edit `App.tsx`:

```typescript
import { useAppStatePresence } from './src/services/firebase/init';

function AppContent() {
  const currentUserId = useApiState((state) => state.currentUserId);
  
  // Add this hook
  useAppStatePresence(currentUserId);
  
  // ... rest of your app
  return <Navigation />;
}
```

## Step 5: Test! (5 minutes)

```bash
# Start your app
cd mobile
npm start

# Test with two accounts:
# 1. Create two test users
# 2. Make them match (swipe right on each other)
# 3. Open chat and send messages
# 4. Verify real-time updates work
```

## ✅ Verification Checklist

- [ ] Firebase project created
- [ ] All services enabled (Auth, Firestore, Realtime DB, FCM)
- [ ] Mobile config updated with Firebase credentials
- [ ] Backend .env file created with service account
- [ ] Firebase rules and functions deployed
- [ ] Navigation updated to use Firebase screens
- [ ] Firebase initialization added to login
- [ ] Firebase cleanup added to logout
- [ ] Presence tracking added to App.tsx
- [ ] Tested with two accounts successfully

## 🎯 Expected Results

After setup:
- ✅ Messages appear instantly (no refresh needed)
- ✅ Online/offline status shows in chat header
- ✅ Read receipts (checkmarks) update in real-time
- ✅ Unread count badges show on matches screen
- ✅ Push notifications work when app is backgrounded
- ✅ Messages persist across app restarts

## 🐛 Quick Troubleshooting

**Messages not appearing?**
- Check internet connection
- Verify Firebase config is correct
- Check browser/app console for errors

**"Permission denied" errors?**
- Run `firebase deploy --only firestore:rules`
- Verify user is logged into Firebase Auth

**No push notifications?**
- Check FCM is enabled in Firebase Console
- Verify Cloud Functions deployed: `firebase deploy --only functions`
- Check device notification permissions

**Presence not updating?**
- Run `firebase deploy --only database`
- Verify Realtime Database is enabled

## 📚 Full Documentation

For detailed information:
- `FIREBASE_SETUP.md` - Complete setup guide
- `FIREBASE_IMPLEMENTATION_SUMMARY.md` - Technical details
- Firebase Console - Monitor usage and logs

## 🆘 Need Help?

1. Check Firebase Console → Functions → Logs
2. Check Firebase Console → Firestore → Usage
3. Review app console for errors
4. Verify all environment variables are set

---

**Total Setup Time: ~20 minutes**

**You're ready to chat! 🎉**

