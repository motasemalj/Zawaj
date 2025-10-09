import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../config/firebase';

/**
 * Push Notifications Service using Expo Notifications + FCM
 */

/**
 * Configure notification handler
 */
export const configureNotifications = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
};

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Notification permissions not granted');
    return false;
  }
  
  return true;
};

/**
 * Get Expo push token
 */
export const getExpoPushToken = async (): Promise<string | null> => {
  try {
    // Skip token retrieval in Expo Go where remote notifications aren't fully supported
    const inExpoGo = Constants.appOwnership === 'expo';
    if (inExpoGo) {
      console.log('expo-notifications: Skipping push token in Expo Go');
      return null;
    }
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;
    
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: (Constants as any).expoConfig?.extra?.eas?.projectId || (Constants as any).easConfig?.projectId || undefined,
    });
    
    return token.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
};

/**
 * Save FCM token to Firestore
 */
export const saveFCMToken = async (userId: string, token: string): Promise<void> => {
  const userRef = doc(firestore, 'users', userId);
  await updateDoc(userRef, {
    fcmToken: token,
  });
};

/**
 * Register device for push notifications
 */
export const registerForPushNotifications = async (userId: string): Promise<void> => {
  try {
    configureNotifications();
    
    const token = await getExpoPushToken();
    if (token) {
      await saveFCMToken(userId, token);
      console.log('✅ Push notification token registered:', token);
    }
  } catch (error) {
    console.error('Error registering for push notifications:', error);
  }
};

/**
 * Listen for notification responses (when user taps on notification)
 */
export const addNotificationResponseListener = (
  handler: (response: Notifications.NotificationResponse) => void
) => {
  return Notifications.addNotificationResponseReceivedListener(handler);
};

/**
 * Listen for notifications received while app is in foreground
 */
export const addNotificationReceivedListener = (
  handler: (notification: Notifications.Notification) => void
) => {
  return Notifications.addNotificationReceivedListener(handler);
};

/**
 * Schedule a local notification (for testing)
 */
export const scheduleLocalNotification = async (
  title: string,
  body: string,
  data?: any
): Promise<void> => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: null, // Show immediately
  });
};

/**
 * Clear all notifications
 */
export const clearAllNotifications = async (): Promise<void> => {
  await Notifications.dismissAllNotificationsAsync();
};

/**
 * Get badge count
 */
export const getBadgeCount = async (): Promise<number> => {
  return await Notifications.getBadgeCountAsync();
};

/**
 * Set badge count
 */
export const setBadgeCount = async (count: number): Promise<void> => {
  await Notifications.setBadgeCountAsync(count);
};

