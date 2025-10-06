import React from 'react';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AuthPickerScreen from '../screens/AuthPickerScreen';
import LoginScreen from '../screens/LoginScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import SignupMethodScreen from '../screens/SignupMethodScreen';
import PhoneOtpScreen from '../screens/EnhancedPhoneOtpScreen';
import EmailOtpScreen from '../screens/EnhancedEmailOtpScreen';
import OnboardingScreen from '../screens/NewOnboardingScreen';
import DiscoveryScreen from '../screens/EnhancedDiscoveryScreen';
import MatchesScreen from '../screens/MatchesScreen';
import ChatScreen from '../screens/ChatScreen';
import SettingsScreen from '../screens/UltraEnhancedSettingsScreen';
import PhotosScreen from '../screens/PhotosScreen';
// import PermissionsScreen from '../screens/PermissionsScreen'; // Removed from flow
import DetailsScreen from '../screens/DetailsScreen';
import ProfileScreen from '../screens/EnhancedProfileScreen';
import { useApiState } from '../api/client';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function TabsNav() {
  return (
    <Tabs.Navigator
      initialRouteName="Discovery"
      screenOptions={({ route }) => ({
        headerTitleAlign: 'center',
        headerTitleStyle: { textAlign: 'right' },
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: 'transparent', flexDirection: 'row-reverse' },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { writingDirection: 'rtl' },
        tabBarIcon: ({ color, size }) => {
          const icons: any = {
            Discovery: 'flame',
            Matches: 'chatbubbles',
            Profile: 'person',
            Settings: 'settings',
          };
          return <Ionicons name={icons[route.name] || 'ellipse'} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="Settings" component={SettingsScreen} options={{ title: 'الإعدادات', headerShown: false }} />
      <Tabs.Screen name="Profile" component={ProfileScreen} options={{ title: 'الملف الشخصي', headerShown: false }} />
      <Tabs.Screen name="Matches" component={MatchesScreen} options={{ title: 'التوافقات', headerTitleStyle: { textAlign: 'right' } }} />
      <Tabs.Screen name="Discovery" component={DiscoveryScreen} options={{ title: 'استكشاف', headerShown: false }} />
    </Tabs.Navigator>
  );
}

export default function RootNav() {
  const { currentUserId } = useApiState();
  return (
    <NavigationContainer theme={{
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: colors.bg,
        card: colors.card,
        text: colors.text,
        border: colors.border,
        primary: colors.accent,
      },
    }}>
      <Stack.Navigator screenOptions={{ 
        headerTitleAlign: 'center',
        headerTitleStyle: { textAlign: 'right', writingDirection: 'rtl' },
      }}>
        {!currentUserId ? (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SignupMethod" component={SignupMethodScreen} options={{ title: 'إنشاء حساب' }} />
            <Stack.Screen name="PhoneOTP" component={PhoneOtpScreen} options={{ title: 'تأكيد الهاتف' }} />
            <Stack.Screen name="EmailOTP" component={EmailOtpScreen} options={{ title: 'تأكيد البريد' }} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'تسجيل الدخول (سريع)' }} />
            <Stack.Screen name="Auth" component={AuthPickerScreen} options={{ title: 'تسجيل الدخول (تجريبي)' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Gate" component={CompletenessGate} options={{ headerShown: false }} />
            <Stack.Screen name="Photos" component={PhotosScreen} options={{ title: 'الصور' }} />
            <Stack.Screen name="Details" component={DetailsScreen} options={{ title: 'تفاصيل' }} />
            {/* Permissions screen removed from flow - handled in Discovery now */}
            {/* <Stack.Screen name="Permissions" component={PermissionsScreen} options={{ title: 'الأذونات' }} /> */}
            <Stack.Screen name="Tabs" component={TabsNav} options={{ headerShown: false }} />
            <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'محادثة' }} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ title: 'الانضمام', headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

import { useEffect, useState } from 'react';
import { getClient } from '../api/client';
function CompletenessGate({ navigation }: any) {
  const api = getClient();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/users/me/completeness');
        const c = res.data.completeness || 0;
        if (c >= 50) navigation.replace('Tabs'); else navigation.replace('Onboarding');
      } catch {
        navigation.replace('Onboarding');
      } finally { setLoading(false); }
    })();
  }, []);
  return null;
}

