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
import MatchesScreen from '../screens/FirebaseMatchesScreen';
import LikedMeScreen from '../screens/LikedMeScreen';
import ChatScreen from '../screens/FirebaseChatScreen';
import SettingsScreen from '../screens/UltraEnhancedSettingsScreen';
import PhotosScreen from '../screens/PhotosScreen';
// import PermissionsScreen from '../screens/PermissionsScreen'; // Removed from flow
import DetailsScreen from '../screens/DetailsScreen';
import ProfileScreen from '../screens/EnhancedProfileScreen';
import { useApiState, getClient } from '../api/client';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../theme';
import { View, Platform, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function TabsNav() {
  const api = React.useMemo(() => getClient(), []);
  const [likedMeCount, setLikedMeCount] = React.useState<number>(0);
  const insets = useSafeAreaInsets();

  // Fetch liked-me count periodically
  React.useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await api.get('/swipes/liked-me');
        setLikedMeCount(res.data.users?.length || 0);
      } catch (error) {
        console.error('Error fetching liked-me count:', error);
      }
    };
    
    fetchCount();
    const interval = setInterval(fetchCount, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [api]);

  // Calculate tab bar height based on safe area - increased to cover elevated Discovery icon
  const tabBarHeight = 80 + Math.max(insets.bottom, 10);

  return (
    <Tabs.Navigator
      initialRouteName="Discovery"
      screenOptions={({ route }) => ({
        headerTitleAlign: 'center',
        headerTitleStyle: { textAlign: 'right' },
        tabBarShowLabel: false,
        tabBarStyle: { 
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          flexDirection: 'row-reverse',
          height: tabBarHeight,
          paddingTop: 24,
          paddingBottom: Math.max(insets.bottom - 5, 5),
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarIcon: ({ color, size, focused }) => {
          const icons: any = {
            Discovery: 'flame',
            LikedMe: 'heart',
            Matches: 'chatbubbles',
            Profile: 'person',
            Settings: 'settings',
          };
          
          // Special styling for Discovery (center) tab
          if (route.name === 'Discovery') {
            return (
              <View style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: focused ? colors.accent : colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: focused ? colors.accent : '#000',
                shadowOpacity: focused ? 0.5 : 0.2,
                shadowRadius: focused ? 16 : 8,
                shadowOffset: { width: 0, height: focused ? 8 : 4 },
                elevation: focused ? 12 : 6,
              }}>
                <Ionicons 
                  name={icons[route.name] || 'ellipse'} 
                  size={30} 
                  color={focused ? '#000' : color} 
                />
              </View>
            );
          }
          
          return <Ionicons name={icons[route.name] || 'ellipse'} size={26} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="Settings" component={SettingsScreen} options={{ title: 'الإعدادات', headerShown: false }} />
      <Tabs.Screen name="Matches" component={MatchesScreen} options={{ title: 'التوافقات', headerTitleStyle: { textAlign: 'right' } }} />
      <Tabs.Screen name="Discovery" component={DiscoveryScreen} options={{ title: 'استكشاف', headerShown: false }} />
      <Tabs.Screen 
        name="LikedMe" 
        component={LikedMeScreen} 
        options={{ 
          title: 'أعجبتهم', 
          headerShown: false,
          tabBarBadge: likedMeCount > 0 ? likedMeCount : undefined,
          tabBarBadgeStyle: { 
            backgroundColor: colors.accent,
            color: '#000',
            fontSize: 10,
            fontWeight: '700',
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            lineHeight: 18,
          },
        }} 
      />
      <Tabs.Screen name="Profile" component={ProfileScreen} options={{ title: 'الملف الشخصي', headerShown: false }} />
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
            <Stack.Screen 
              name="Chat" 
              component={ChatScreen} 
              options={{ 
                title: 'محادثة',
                headerBackTitle: '',
                headerBackButtonMenuEnabled: false,
                headerStyle: {
                  backgroundColor: colors.bg,
                },
                headerTintColor: colors.text,
                headerTitleStyle: {
                  color: colors.text,
                  fontSize: 18,
                  fontWeight: '700',
                },
              }} 
            />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ title: 'الانضمام', headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

import { useEffect, useState } from 'react';
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

