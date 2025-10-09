import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions, TouchableOpacity, ImageBackground, Easing, AppState, Alert, Linking, Platform, ActivityIndicator, Image } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { getClient, User, useApiState } from '../api/client';
import { useCurrentUser } from '../api/hooks';
import { colors, radii, shadows, spacing } from '../theme';
import GradientBackground from '../components/ui/GradientBackground';
import Avatar from '../components/ui/Avatar';
import MatchModal from '../components/MatchModal';
import ProfileDetailModal from '../components/ProfileDetailModal';
import SearchFiltersModal from '../components/SearchFiltersModal';
import { feedback } from '../utils/haptics';
import { useDiscoveryProfiles, useSwipe, useUndoSwipe, useMarkDiscoverySeen } from '../api/hooks';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;

export default function EnhancedDiscoveryScreen() {
  const api = getClient();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const currentUserId = useApiState((state) => state.currentUserId);
  const queryClient = useQueryClient();
  
  // React Query for discovery data
  const {
    data: discoveryProfiles,
    isLoading: discoveryLoading,
    error: discoveryError,
    refetch: refetchDiscovery,
    markAsShown,
    clearSessionExcludes,
    setPage,
  } = useDiscoveryProfiles({ enabled: !!currentUserId });
  
  const swipeMutation = useSwipe();
  const undoSwipeMutation = useUndoSwipe();
  const markSeenMutation = useMarkDiscoverySeen();
  
  // Local state for UI and animations (decoupled from data fetching)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [needsLocation, setNeedsLocation] = useState(false);
  const [locBusy, setLocBusy] = useState(false);
  const [needsNotifications, setNeedsNotifications] = useState(false);
  const [notifBusy, setNotifBusy] = useState(false);
  const [accountHidden, setAccountHidden] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [appState, setAppState] = useState(AppState.currentState);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showProfileDetail, setShowProfileDetail] = useState(false);
  const [isCurrentImageLoading, setIsCurrentImageLoading] = useState(false);
  const [isNextImageLoading, setIsNextImageLoading] = useState(false);
  const [lastSwipedProfile, setLastSwipedProfile] = useState<(User & { is_super_liker?: boolean }) | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const filtersResetInProgressRef = useRef(false);
  
  // Local append-only deck to prevent flicker when query refetches
  type DiscoveryUser = User & { is_super_liker?: boolean };
  const [deck, setDeck] = useState<DiscoveryUser[]>([]);
  
  // Merge new discovery results into deck (append missing, dedupe by id, cap size)
  useEffect(() => {
    const incoming = discoveryProfiles || [];
    if (!incoming || incoming.length === 0) return;
    setDeck((prev) => {
      const existingIds = new Set(prev.map((p: DiscoveryUser) => p.id));
      const additions = (incoming as DiscoveryUser[]).filter((p: DiscoveryUser) => !existingIds.has(p.id));
      if (additions.length === 0) return prev; // no changes
      const merged = prev.concat(additions);
      // Cap deck to last 100 profiles to avoid unbounded growth
      return merged.slice(-100);
    });
  }, [discoveryProfiles]);
  
  // Loading only blocks when deck is empty
  const loading = discoveryLoading && deck.length === 0;
  
  // Current profile (no marking on view; marking happens on swipe only)
  const currentProfile = deck[currentIndex] || null;
  
  // Handle discovery errors
  React.useEffect(() => {
    if (discoveryError) {
      const err = discoveryError as any;
      if (err?.response?.status === 403 && err?.response?.data?.message?.includes('Location required')) {
        setNeedsLocation(true);
      } else if (err?.response?.status === 401 || err?.response?.status === 403) {
        setError('خطأ في المصادقة - يرجى تسجيل الدخول مرة أخرى');
      } else {
        setError(err?.response?.data?.message || 'فشل تحميل الملفات الشخصية');
      }
    }
  }, [discoveryError]);
  
  // Animation refs
  const position = useRef(new Animated.ValueXY()).current;
  const isSwipingRef = useRef(false);
  const cardOpacity = useRef(new Animated.Value(1)).current;

  // Refetch discovery when running low on profiles (based on deck)
  React.useEffect(() => {
    if (deck.length > 0 && currentIndex >= deck.length - 3) {
      console.log('Running low on profiles, refetching...');
      // Move to next page fetch
      setPage((p: number) => p + 1);
    }
  }, [currentIndex, deck.length, setPage]);

  useEffect(() => {
    (async () => {
      try {
        // Abort if logged out
        if (!useApiState.getState().currentUserId) return;
        // Load current user info
        try {
          const userRes = await api.get('/users/me');
          setCurrentUser(userRes.data);
          
          // Check if account is hidden (discoverable = false)
          if (userRes.data.discoverable === false) {
            setAccountHidden(true);
            return; // Don't load discovery if account is hidden
          } else {
            setAccountHidden(false);
          }
        } catch (e) {
          console.error('Failed to load current user:', e);
        }

        // Check location permission FIRST - location is mandatory for discovery
        try {
          if (!useApiState.getState().currentUserId) return;
          const locPerm = await Location.getForegroundPermissionsAsync();
          if (!locPerm.granted) {
            console.log('Location permission not granted, showing location required screen');
            setNeedsLocation(true);
            return; // Don't load profiles without location
          } else {
            setNeedsLocation(false);
          }
        } catch (e) {
          console.error('Error checking location permission:', e);
          setNeedsLocation(true);
          return;
        }

        // Always refresh device location before discovery
        try {
          if (!useApiState.getState().currentUserId) return;
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const lat = pos.coords.latitude; 
          const lng = pos.coords.longitude;
          await api.put('/users/me/device', { location: { lat, lng } }).catch(()=>{});
          // Reset discovery to ensure distance filter is applied to the current deck
          setCurrentIndex(0);
          setDeck([]);
          setPage(0);
          clearSessionExcludes();
          refetchDiscovery();
          try {
            const rg = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
            const first = rg?.[0];
            if (first) {
              const city = (first.city || first.subregion || first.region) as any;
              const country = (first.country) as any;
              await api.put('/users/me', { city, country }).catch(()=>{});
            }
          } catch {}
        } catch (e) {
          console.warn('Could not refresh device location (continuing):', e);
        }

        // Check notification permission (don't block discovery, just show prompt)
        try {
          const notifPerm = await Notifications.getPermissionsAsync();
          if (!notifPerm.granted && notifPerm.canAskAgain !== false) {
            setNeedsNotifications(true);
          }
        } catch {}
        
      } catch {}
    })();
    // Only run once - React Query handles data fetching automatically
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When filters change, the mutation in SearchFiltersModal automatically
  // invalidates the discovery query, so React Query will refetch automatically

  // Track app state changes
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: any) => {
      const prevAppState = appState;
      setAppState(nextAppState);
      
      // If app became active, check permissions again
      if (prevAppState !== 'active' && nextAppState === 'active') {
        if (!useApiState.getState().currentUserId) return; // if logged out, ignore
        
        // Re-check if account is hidden
        try {
          const userRes = await api.get('/users/me');
          if (userRes.data.discoverable === false) {
            setAccountHidden(true);
            return; // Don't proceed if account is hidden
          } else {
            setAccountHidden(false);
          }
        } catch {}
        
        // Always refresh device location on resume; if enabled, reload profiles
        try {
          const locPerm = await Location.getForegroundPermissionsAsync();
          if (locPerm.granted) {
            try {
              const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
              const lat = pos.coords.latitude; 
              const lng = pos.coords.longitude;
              await api.put('/users/me/device', { location: { lat, lng } }).catch(()=>{});
              // Reset discovery after location refresh on resume as well
              setCurrentIndex(0);
              setDeck([]);
              setPage(0);
              clearSessionExcludes();
              refetchDiscovery();
              try {
                const rg = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
                const first = rg?.[0];
                if (first) {
                  const city = (first.city || first.subregion || first.region) as any;
                  const country = (first.country) as any;
                  await api.put('/users/me', { city, country }).catch(()=>{});
                }
              } catch {}
            } catch {}
            if (needsLocation) {
              console.log('Location permission enabled, refetching profiles...');
              setNeedsLocation(false);
              refetchDiscovery();
              return;
            }
          } else {
            // Location still not enabled
            setNeedsLocation(true);
          }
        } catch {}

        // Re-check notification permission in case user enabled it in settings
        try {
          const notifPerm = await Notifications.getPermissionsAsync();
          if (notifPerm.granted) {
            setNeedsNotifications(false);
          } else if (!notifPerm.granted && notifPerm.canAskAgain !== false) {
            setNeedsNotifications(true);
          }
        } catch {}
        
        // If we have no profiles and location is enabled, refresh immediately
        if (deck.length === 0 && !needsLocation && useApiState.getState().currentUserId) {
          console.log('App became active with no profiles, refreshing...');
          refetchDiscovery();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [appState, deck.length, needsLocation, refetchDiscovery]);

  async function requestAndSaveLocation() {
    try {
      setLocBusy(true);
      console.log('Checking current location permission status...');
      
      // First check current permission status
      const currentStatus = await Location.getForegroundPermissionsAsync();
      console.log('Current permission status:', currentStatus);
      
      // If already granted, just get location
      if (currentStatus.granted) {
        console.log('Permission already granted, getting location...');
      } else {
        // Request permission - this will show the iOS system popup on first request
        console.log('Requesting location permission (will show system popup)...');
        const permReq = await Location.requestForegroundPermissionsAsync();
        console.log('Location permission result:', {
          status: permReq.status,
          canAskAgain: permReq.canAskAgain,
          granted: permReq.granted
        });
        
        if (permReq.status !== 'granted') {
          setLocBusy(false);
          
          // If user permanently denied (can't ask again), direct to settings
          if (permReq.canAskAgain === false) {
            console.log('Permission permanently denied, showing settings alert');
            Alert.alert(
              'تفعيل خدمات الموقع',
              'لقد تم رفض إذن الموقع سابقاً. يرجى تفعيله من إعدادات النظام للمتابعة.',
              [
                { text: 'إلغاء', style: 'cancel' },
                {
                  text: 'فتح الإعدادات',
                  onPress: () => {
                    if (Platform.OS === 'ios') {
                      Linking.openURL('app-settings:');
                    } else {
                      Linking.openSettings();
                    }
                  }
                }
              ]
            );
          } else {
            // User just denied in the popup (first time or can ask again)
            console.log('Permission denied, but can ask again');
            Alert.alert(
              'يتطلب إذن الموقع',
              'ميزة الاستكشاف تحتاج إلى موقعك لعرض الأشخاص القريبين منك. يرجى الموافقة عند المحاولة مرة أخرى.',
              [{ text: 'حسناً' }]
            );
          }
          return;
        }
      }
      
      // Permission is now granted, get location
      console.log('Permission granted! Getting current position...');
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      const lat = pos.coords.latitude; 
      const lng = pos.coords.longitude;
      console.log('Got location:', lat, lng);
      
      await api.put('/users/me/device', { location: { lat, lng } });
      console.log('Saved location to server');
      
      try {
        const rg = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        const first = rg?.[0];
        if (first) {
          const city = (first.city || first.subregion || first.region) as any;
          const country = (first.country) as any;
          await api.put('/users/me', { city, country });
          console.log('Updated city/country:', city, country);
        }
      } catch (e) {
        console.error('Reverse geocoding failed:', e);
      }
      
      setNeedsLocation(false);
      setError(null);
      refetchDiscovery();
    } catch (e) {
      console.error('Error requesting location:', e);
      setError('فشل الحصول على الموقع');
    } finally {
      setLocBusy(false);
    }
  }

  // Reset photo index when profile changes
  useEffect(() => {
    setCurrentPhotoIndex(0);
    // Start loader for new current card image
    if (currentProfile?.photos && currentProfile.photos.length > 0) {
      setIsCurrentImageLoading(true);
    } else {
      setIsCurrentImageLoading(false);
    }
  }, [currentIndex]);

  // Prefetch next profile's first image to avoid blank state after swipe
  useEffect(() => {
    const np = deck[currentIndex + 1];
    if (np?.photos && np.photos[0]?.url) {
      const uri = `${api.defaults.baseURL}${np.photos[0].url}`;
      setIsNextImageLoading(true);
      Image.prefetch(uri).finally(() => {
        // prefetch resolves regardless; actual onLoadEnd will flip the flag when rendered
      });
    } else {
      setIsNextImageLoading(false);
    }
  }, [deck, currentIndex]);

  const nextPhoto = () => {
    if (!currentProfile?.photos || currentProfile.photos.length <= 1) return;
    setCurrentPhotoIndex((prev) => (prev + 1) % currentProfile.photos.length);
  };

  const prevPhoto = () => {
    if (!currentProfile?.photos || currentProfile.photos.length <= 1) return;
    setCurrentPhotoIndex((prev) => (prev - 1 + currentProfile.photos.length) % currentProfile.photos.length);
  };

  async function requestNotifications() {
    try {
      setNotifBusy(true);
      const notifReq = await Notifications.requestPermissionsAsync();
      if (notifReq.granted) {
        try {
          const token = (await Notifications.getExpoPushTokenAsync()).data;
          await api.put('/users/me/device', { expo_push_token: token });
          console.log('✅ Notification token saved:', token);
        } catch (e) {
          console.error('❌ Failed to save notification token:', e);
        }
        setNeedsNotifications(false);
      } else {
        console.log('⚠️ Notification permission not granted');
        // If user denied and can't ask again, hide the prompt
        if (notifReq.canAskAgain === false) {
          setNeedsNotifications(false);
        }
      }
    } catch (e) {
      console.error('❌ Notification request failed:', e);
    } finally {
      setNotifBusy(false);
    }
  }

  function dismissNotificationPrompt() {
    setNeedsNotifications(false);
  }

  // Periodic refresh for new profiles using background refetching
  useEffect(() => {
    const getRefreshInterval = () => {
      if (deck.length === 0) return 45000; // 45s
      if (deck.length <= 3) return 30000; // 30s
      if (deck.length <= 10) return 90000; // 90s
      return 180000; // 3m
    };

    const interval = setInterval(() => {
      if (appState !== 'active') return;
      console.log('Periodic refresh - refetching profiles...');
      refetchDiscovery();
    }, getRefreshInterval());

    return () => clearInterval(interval);
  }, [deck.length, appState, refetchDiscovery]);

  // Apply filters change: reset deck and refetch cleanly
  const handleFiltersChanged = React.useCallback(() => {
    filtersResetInProgressRef.current = true;
    // Reset local deck immediately for snappy UX
    setCurrentIndex(0);
    setDeck([]);
    setPage(0);
    // Clear session excludes and trigger a single refetch via the hook's internal versioning
    clearSessionExcludes();
    // Force immediate refetch to get filtered results
    refetchDiscovery();
    // Release suppression shortly after to allow future auto-resets
    setTimeout(() => { filtersResetInProgressRef.current = false; }, 500);
  }, [clearSessionExcludes, setPage, refetchDiscovery]);

  // Listen to preferences changes (from Settings screens) and reset discovery accordingly
  const { data: meQueryData } = useCurrentUser({ staleTime: 0 });
  const lastPrefsHashRef = useRef<string | null>(null);
  useEffect(() => {
    const prefs = meQueryData?.preferences || null;
    const nextHash = prefs ? JSON.stringify(prefs) : 'none';
    if (lastPrefsHashRef.current === null) {
      lastPrefsHashRef.current = nextHash;
      return;
    }
    if (nextHash !== lastPrefsHashRef.current) {
      lastPrefsHashRef.current = nextHash;
      if (!showFiltersModal && !filtersResetInProgressRef.current) {
        // Only auto-reset when changes originate outside the modal
        handleFiltersChanged();
      }
    }
  }, [meQueryData?.preferences, showFiltersModal, handleFiltersChanged]);

  // Reset discovery cleanly on login (when currentUserId becomes available)
  useEffect(() => {
    if (currentUserId) {
      handleFiltersChanged();
    }
  }, [currentUserId, handleFiltersChanged]);

  // Handle swipe action
  const handleSwipe = useCallback((direction: 'left' | 'right' | 'up', isSuperLike = false) => {
    // Guard against invalid state
    if (isSwipingRef.current) {
      console.log('Already swiping, ignoring');
      return;
    }
    
    if (currentIndex >= deck.length) {
      console.log('No more profiles');
      return;
    }

    const profile = deck[currentIndex];
    console.log(`=== SWIPE START ===`);
    console.log('Direction:', direction);
    console.log('Profile:', profile.id, profile.display_name);
    console.log('Current Index:', currentIndex);
    console.log('Super Like:', isSuperLike);
    
    // Lock swiping
    isSwipingRef.current = true;

    // Add haptic feedback for swipe
    feedback.swipe();

    // Save current profile for undo functionality
    setLastSwipedProfile(profile);
    setCanUndo(true);

    // Send to backend using React Query mutation
    const actualDirection = direction === 'up' ? 'right' : direction;
    swipeMutation.mutate({
      to_user_id: profile.id,
      direction: actualDirection,
      is_super_like: isSuperLike,
    }, {
      onSuccess: (data) => {
        console.log('✅ Backend updated');
        // Check if it's a match!
        if (data.match) {
          console.log('🎉 IT\'S A MATCH!', data.match);
          
          // Invalidate matches query immediately to update the list
          queryClient.invalidateQueries({ queryKey: ['matches'] });
          console.log('✅ Matches cache invalidated');
          
          setMatchedUser(profile);
          setMatchId(data.match.id);
          
          // Add match celebration feedback
          feedback.match();
          
          // Show modal almost instantly for maximum excitement!
          setTimeout(() => {
            setShowMatchModal(true);
          }, 100);
        }
      },
      onError: (err: any) => {
        const status = err?.response?.status;
        const data = err?.response?.data;
        
        // Handle different error types gracefully
        if (status === 401 || status === 403) {
          // Authentication error - log user out
          console.error('❌ Authentication error during swipe - logging out');
          Alert.alert(
            'انتهت الجلسة',
            'يرجى تسجيل الدخول مرة أخرى',
            [
              {
                text: 'حسناً',
                onPress: () => {
                  useApiState.getState().setCurrentUserId(null);
                }
              }
            ]
          );
          return; // Don't continue animation
        } else if (status === 422 && data?.error?.includes('Not eligible')) {
          // User not eligible - this shouldn't happen if backend filters correctly
          // Silently skip to next profile without showing error
          console.warn('⚠️ User not eligible (backend should have filtered this):', profile.id);
          // Don't show error to user, just continue to next profile
        } else {
          // Other errors - log but don't show to user unless critical
          console.error('❌ Swipe failed:', data?.error || err.message);
          // Most swipe errors are recoverable, so don't block the UI
        }
      }
    });

    // Calculate animation target
    let toX = 0;
    let toY = 0;
    
    if (direction === 'up') {
      // Super like: glide upwards (use screen height for crisp motion)
      toX = 0;
      toY = -SCREEN_HEIGHT;
    } else if (direction === 'right') {
      toX = SCREEN_WIDTH + 100;
      toY = 0;
    } else {
      toX = -SCREEN_WIDTH - 100;
      toY = 0;
    }

    // Animate card off screen + fade out in parallel
    let settled = false;
    const complete = () => {
      if (settled) return;
      settled = true;
      // Reset card for next render
      position.setValue({ x: 0, y: 0 });
      cardOpacity.setValue(1);
      isSwipingRef.current = false;
      // Mark profile as seen and session-excluded on swipe completion only
      try {
        if (profile?.id) {
          markAsShown(profile.id);
          markSeenMutation.mutate(profile.id);
        }
      } catch {}
      setCurrentIndex(prev => prev + 1);
      console.log('=== SWIPE END ===\n');
    };

    const safety = setTimeout(() => {
      if (isSwipingRef.current) {
        console.warn('Swipe animation timeout - forcing completion');
        complete();
      }
    }, 1500);

    Animated.parallel([
      Animated.timing(position, {
        toValue: { x: toX, y: toY },
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    ]).start(() => {
      clearTimeout(safety);
      console.log('Animation complete (ensuring completion)');
      complete();
    });
  }, [position, cardOpacity, currentIndex, deck, swipeMutation]);

  // Handle undo last swipe (limited to 1 undo - user must swipe again to enable another undo)
  const handleUndo = useCallback(async () => {
    if (!canUndo || !lastSwipedProfile || isSwipingRef.current) {
      console.log('Cannot undo - no last swipe or currently swiping');
      return;
    }

    console.log('🔙 UNDOING SWIPE for profile:', lastSwipedProfile.id);
    
    // Add haptic feedback for undo
    feedback.buttonPress();
    
    // Call backend to undo using React Query mutation
    undoSwipeMutation.mutate(undefined, {
      onSuccess: (data) => {
        if (data.undone) {
          console.log('✅ Swipe undone on backend');
          
          // Go back one index
          setCurrentIndex(prev => Math.max(0, prev - 1));
          
          // IMPORTANT: Disable undo until next swipe (limit: 1 undo per swipe)
          setCanUndo(false);
          setLastSwipedProfile(null);
          
          console.log('✅ Undo complete - previous card restored (undo now disabled until next swipe)');
        }
      },
      onError: (err: any) => {
        console.error('❌ Undo failed:', err.response?.data || err.message);
        Alert.alert('خطأ', 'لم نتمكن من التراجع عن الإجراء');
      }
    });
  }, [canUndo, lastSwipedProfile, undoSwipeMutation]);

  // Store handleSwipe in ref to avoid closure issues
  const handleSwipeRef = useRef(handleSwipe);
  handleSwipeRef.current = handleSwipe;

  // Pan responder for gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => {
        // Only handle if not swiping and moving horizontally
        return !isSwipingRef.current && Math.abs(gesture.dx) > 5;
      },
      onPanResponderGrant: () => {
        if (!isSwipingRef.current) {
          position.stopAnimation();
          // Reduce opacity slightly during drag for perceived smoothness
          cardOpacity.setValue(0.98);
        }
      },
      onPanResponderMove: (_, gesture) => {
        if (!isSwipingRef.current) {
          // Allow both horizontal and vertical dragging
          position.setValue({ x: gesture.dx, y: gesture.dy });
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (isSwipingRef.current) {
          return;
        }

        const swipeDistanceX = gesture.dx;
        const swipeDistanceY = gesture.dy;
        const swipeVelocityX = gesture.vx;
        const swipeVelocityY = gesture.vy;

        console.log('Gesture released - dx:', swipeDistanceX, 'dy:', swipeDistanceY, 'vx:', swipeVelocityX, 'vy:', swipeVelocityY);

        // Check for vertical super like swipe first (upward)
        const isUpSwipe = swipeDistanceY < -SWIPE_THRESHOLD || (swipeDistanceY < -50 && Math.abs(swipeVelocityY) > 0.5);
        
        // Then check horizontal swipes
        const isRightSwipe = swipeDistanceX > SWIPE_THRESHOLD || (swipeDistanceX > 50 && swipeVelocityX > 0.5);
        const isLeftSwipe = swipeDistanceX < -SWIPE_THRESHOLD || (swipeDistanceX < -50 && Math.abs(swipeVelocityX) > 0.5);

        if (isUpSwipe) {
          console.log('⭐ SUPER LIKE (UP SWIPE)');
          handleSwipeRef.current('up', true);
        } else if (isRightSwipe) {
          console.log('👉 RIGHT SWIPE');
          handleSwipeRef.current('right', false);
        } else if (isLeftSwipe) {
          console.log('👈 LEFT SWIPE');
          handleSwipeRef.current('left', false);
        } else {
          console.log('↩️ SNAP BACK');
          // Snap back to center with smooth spring and restore opacity
          Animated.parallel([
            Animated.spring(position, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: true,
              friction: 6,
              tension: 50,
            }),
            Animated.timing(cardOpacity, {
              toValue: 1,
              duration: 180,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            })
          ]).start();
        }
      },
    })
  ).current;

  // Get next profile (currentProfile already defined above)
  const nextProfile = deck[currentIndex + 1];

  // Rotation interpolation
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  // Like/Nope/Super opacity
  const likeOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const superOpacity = position.y.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Loading state
  if (loading) {
    return (
      <GradientBackground>
      <SafeAreaView style={styles.wrapper} edges={['top', 'left', 'right']}>
          <View style={styles.container}>
            <Text style={styles.loadingText}>جاري تحميل الملفات الشخصية...</Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  // Location required state
  // Show account hidden message if user disabled discovery
  if (accountHidden) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.wrapper} edges={['top', 'left', 'right']}>
          <View style={styles.container}>
            <View style={styles.locationRequiredContainer}>
              {/* Icon */}
              <View style={styles.locationRequiredIconWrapper}>
                <View style={styles.locationRequiredIconCircle}>
                  <Ionicons name="eye-off" size={64} color={colors.accent} />
                </View>
              </View>

              {/* Content */}
              <View style={styles.locationRequiredContent}>
                <Text style={styles.locationRequiredTitle} allowFontScaling={false}>
                  حسابك مخفي
                </Text>
                <Text style={styles.locationRequiredDescription} allowFontScaling={false}>
                  قمت بإخفاء حسابك من الظهور. يرجى تفعيل الظهور من الإعدادات لاستخدام الاستكشاف
                </Text>
              </View>

              {/* Button to go to settings */}
              <TouchableOpacity 
                onPress={() => navigation.navigate('Settings')} 
                style={styles.enableLocationBtn}
                activeOpacity={0.8}
              >
                <Ionicons name="settings" size={22} color="#fff" />
                <Text style={styles.enableLocationBtnText} allowFontScaling={false}>الذهاب إلى الإعدادات</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  if (needsLocation) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.wrapper} edges={['top', 'left', 'right']}>
          <View style={styles.container}>
            <View style={styles.locationRequiredContainer}>
              {/* Icon */}
              <View style={styles.locationRequiredIconWrapper}>
                <View style={styles.locationRequiredIconCircle}>
                  <Ionicons name="location" size={64} color={colors.accent} />
                </View>
              </View>

              {/* Content */}
              <View style={styles.locationRequiredContent}>
                <Text style={styles.locationRequiredTitle} allowFontScaling={false}>
                  نحتاج الى موقعك
                </Text>
                <Text style={styles.locationRequiredDescription} allowFontScaling={false}>
                  للعثور على اشخاص قريبين منك وعرض ملفات في منطقتك
                </Text>
              </View>

              {/* Button */}
              <TouchableOpacity 
                onPress={requestAndSaveLocation} 
                style={[styles.enableLocationBtn, locBusy && styles.enableLocationBtnDisabled]} 
                disabled={locBusy}
                activeOpacity={0.8}
              >
                {locBusy ? (
                  <>
                    <Ionicons name="hourglass-outline" size={22} color="#fff" />
                    <Text style={styles.enableLocationBtnText} allowFontScaling={false}>جاري التفعيل...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="location" size={22} color="#fff" />
                    <Text style={styles.enableLocationBtnText} allowFontScaling={false}>تفعيل خدمات الموقع</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  // Empty state (but don't show if match modal is visible - let the modal display first!)
  if (!currentProfile && !showMatchModal) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.wrapper} edges={['top', 'left', 'right']}>
          <View style={styles.container}>
            {/* Keep header with Filters button even when no profiles */}
            <View style={styles.headerRow}>
              <Text style={styles.header}>استكشاف</Text>
              <TouchableOpacity 
                style={styles.filterButton}
                onPress={() => { feedback.buttonPress(); setShowFiltersModal(true); }}
                activeOpacity={0.85}
              >
                <Ionicons name="funnel" size={22} color={colors.accent} />
              </TouchableOpacity>
            </View>
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons 
                  name={error ? "alert-circle" : "checkmark-circle"} 
                  size={64} 
                  color={error ? "#ef4444" : colors.accent} 
                />
              </View>
              <Text style={styles.emptyTitle}>
                {error ? "حدث خطأ" : "رائع! 🎉"}
              </Text>
              <Text style={styles.emptyText}>
                {error 
                  ? "تعذر تحميل الملفات الشخصية. يرجى المحاولة لاحقاً" 
                  : "لقد شاهدت جميع الملفات الشخصية المتاحة"}
              </Text>
              <TouchableOpacity onPress={() => {
                feedback.buttonPress();
                refetchDiscovery();
              }} style={styles.refreshBtn}>
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.refreshBtnText}>تحديث</Text>
              </TouchableOpacity>
              {!error && (
                <>
                  <Text style={styles.emptyHint}>
                    💡 تحقق لاحقاً لمشاهدة ملفات شخصية جديدة
                  </Text>
                  <Text style={styles.refreshStatus}>
                    {lastRefreshTime ? 
                      `آخر تحديث: منذ ${Math.floor((new Date().getTime() - lastRefreshTime.getTime()) / 1000)} ثانية` :
                      "جاري البحث عن ملفات شخصية جديدة..."
                    }
                  </Text>
                </>
              )}
            </View>
          </View>
          {/* Filters Modal rendered even in empty state */}
          <SearchFiltersModal 
            visible={showFiltersModal} 
            onFiltersChanged={handleFiltersChanged}
            onClose={() => {
              setShowFiltersModal(false);
            }} 
          />
        </SafeAreaView>
      </GradientBackground>
    );
  }

  // Main render
  return (
    <GradientBackground>
      <SafeAreaView style={styles.wrapper} edges={['top', 'left', 'right']}>
          <View style={styles.container}>
           <View style={styles.headerRow}>
             <Text style={styles.header}>استكشاف</Text>
             <TouchableOpacity 
               style={styles.filterButton}
               onPress={() => { feedback.buttonPress(); setShowFiltersModal(true); }}
               activeOpacity={0.85}
             >
               <Ionicons name="funnel" size={22} color={colors.accent} />
             </TouchableOpacity>
           </View>

          {/* Notification Permission Prompt (non-blocking) */}
          {needsNotifications && (
            <View style={styles.notificationBanner}>
              <View style={styles.notificationContent}>
                <Ionicons name="notifications-outline" size={24} color={colors.accent} />
                <View style={{ flex: 1, marginHorizontal: spacing(1) }}>
                  <Text style={styles.notificationTitle}>تفعيل الإشعارات</Text>
                  <Text style={styles.notificationText}>لتلقي إشعارات التوافقات والرسائل</Text>
                </View>
              </View>
              <View style={styles.notificationActions}>
                <TouchableOpacity onPress={() => {
                  feedback.buttonPress();
                  requestNotifications();
                }} style={styles.notificationEnableBtn} disabled={notifBusy}>
                  <Text style={styles.notificationEnableText}>{notifBusy ? 'جارٍ...' : 'تفعيل'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  feedback.buttonPress();
                  dismissNotificationPrompt();
                }} style={styles.notificationDismissBtn}>
                  <Text style={styles.notificationDismissText}>لاحقاً</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Card Stack */}
          <View style={styles.cardContainer}>
            {/* Next Card (background) */}
            {nextProfile ? (
              <View style={[styles.card, styles.nextCard]}>
                {nextProfile.photos?.[0]?.url ? (
                  <View>
                    <ImageBackground
                      source={{ uri: `${api.defaults.baseURL}${nextProfile.photos[0].url}` }}
                      style={styles.cardImage}
                      imageStyle={{ borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl }}
                      blurRadius={(nextProfile.privacy_blur_mode || nextProfile.photos?.[0]?.blurred) ? 25 : 0}
                      onLoadStart={() => setIsNextImageLoading(true)}
                      onLoadEnd={() => setIsNextImageLoading(false)}
                      onError={() => setIsNextImageLoading(false)}
                    />
                  </View>
                ) : (
                  <View style={styles.cardImage}>
                    <Avatar 
                      uri={undefined}
                      size={100} 
                      label={nextProfile.display_name}
                      style={{ alignSelf: 'center', marginTop: spacing(10) }} 
                    />
                  </View>
                )}
              </View>
            ) : (
              // When there's no next profile and current exists, don't render a stale preview
              currentProfile ? null : null
            )}

            {/* Current Card */}
            {currentProfile ? (
              <Animated.View
                {...panResponder.panHandlers}
                style={[
                  styles.card,
                  {
                    opacity: cardOpacity,
                    transform: [
                      { translateX: position.x },
                      { translateY: position.y },
                      { rotate },
                    ],
                  },
                ]}
              >
                {/* Super Liker Border and Glow */}
                {currentProfile.is_super_liker && (
                <>
                  <View style={styles.superLikerGlow} />
                  <View style={styles.superLikerBorder} />
                </>
              )}

              {/* Card Image with Photo Navigation */}
              {currentProfile.photos && currentProfile.photos.length > 0 ? (
                <View>
                  <TouchableOpacity activeOpacity={0.9} onPress={() => {
                    feedback.buttonPress();
                    setShowProfileDetail(true);
                  }}>
                    <ImageBackground
                      source={{ uri: `${api.defaults.baseURL}${currentProfile.photos[currentPhotoIndex]?.url}` }}
                      style={styles.cardImage}
                      imageStyle={{ borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl }}
                      blurRadius={(currentProfile.privacy_blur_mode || currentProfile.photos[currentPhotoIndex]?.blurred) ? 25 : 0}
                      onLoadStart={() => setIsCurrentImageLoading(true)}
                      onLoadEnd={() => setIsCurrentImageLoading(false)}
                      onError={() => setIsCurrentImageLoading(false)}
                    >
                    {/* Photo Navigation Arrows */}
                    {currentProfile.photos.length > 1 && (
                      <>
                        <TouchableOpacity
                          style={[styles.navArrow, styles.navArrowLeft]}
                          onPress={() => setCurrentPhotoIndex((prev) => Math.max(0, prev - 1))}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="chevron-back" size={26} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.navArrow, styles.navArrowRight]}
                          onPress={() => setCurrentPhotoIndex((prev) => Math.min(currentProfile.photos.length - 1, prev + 1))}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="chevron-forward" size={26} color="#fff" />
                        </TouchableOpacity>

                        {/* Photo indicators */}
                        <View style={styles.photoIndicators}>
                          {currentProfile.photos.map((_: any, idx: number) => (
                            <View
                              key={idx}
                              style={[styles.photoDot, idx === currentPhotoIndex && styles.photoDotActive]}
                            />
                          ))}
                        </View>
                      </>
                    )}
                    </ImageBackground>
                  </TouchableOpacity>
                  {/* Image loading indicator moved below the card */}
                </View>
              ) : (
                <View style={styles.cardImage}>
                  <Avatar 
                    uri={undefined}
                    size={120} 
                    label={currentProfile.display_name}
                    style={{ alignSelf: 'center', marginTop: spacing(12) }} 
                  />
                </View>
              )}

              {/* Swipe Labels */}
              <Animated.View style={[styles.likeLabel, { opacity: likeOpacity }]}>
                <Text style={styles.labelText}>أعجبني</Text>
              </Animated.View>
              <Animated.View style={[styles.nopeLabel, { opacity: nopeOpacity }]}>
                <Text style={styles.labelText}>لا</Text>
              </Animated.View>
              <Animated.View style={[styles.superLabel, { opacity: superOpacity }]}>
                <Ionicons name="star" size={40} color="#fff" />
                <Text style={styles.labelText}>إعجاب خاص</Text>
              </Animated.View>

              {/* Super Like Badge */}
              {currentProfile.is_super_liker && (
                <View style={styles.superLikeBadge}>
                  <Ionicons name="star" size={16} color="#fff" />
                  <Text style={styles.superLikeText}>أعجب بك!</Text>
                </View>
              )}

              {/* Mother Role Badge */}
              {currentProfile.role === 'mother' && (
                <View style={styles.motherBadge}>
                  <Ionicons name="heart" size={14} color="#fff" />
                  <Text style={styles.motherBadgeText}>
                    أم {currentProfile.mother_for === 'son' ? 'لابن' : currentProfile.mother_for === 'daughter' ? 'لابنة' : ''}
                  </Text>
                </View>
              )}

              {/* Traits Overlay */}
              {(() => {
                try {
                  const traitsStr = (currentProfile as any).personality_traits;
                  const traits = (traitsStr && typeof traitsStr === 'string') ? JSON.parse(traitsStr) : [];
                  return traits.length > 0 ? (
                    <View style={styles.traitsOverlay}>
                      {traits.slice(0, 3).map((trait: string, idx: number) => (
                        <View key={idx} style={styles.traitChip}>
                          <Text style={styles.traitText}>{trait}</Text>
                        </View>
                      ))}
                      {traits.length > 3 && (
                        <View style={styles.traitChip}>
                          <Text style={styles.traitText}>+{traits.length - 3}</Text>
                        </View>
                      )}
                    </View>
                  ) : null;
                } catch (err) {
                  console.error('Error parsing traits:', err);
                  return null;
                }
              })()}

              {/* Profile Info */}
              <TouchableOpacity 
                style={styles.info}
                onPress={() => setShowProfileDetail(true)}
                activeOpacity={0.9}
              >
                <View style={styles.infoHeader}>
                  <Ionicons name="information-circle" size={20} color={colors.accent} />
                  <Text style={styles.name}>
                    {/* RTL: name first then age */}
                    {currentProfile.display_name}، {calculateAge(currentProfile.dob)}
                  </Text>
                </View>
                {(currentProfile.city || currentProfile.country) && (
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={16} color={colors.accent} />
                    <Text style={styles.location}>
                      {[currentProfile.city, currentProfile.country].filter(Boolean).join(', ')}
                    </Text>
                  </View>
                )}
                {(currentProfile as any).ethnicity && (
                  <View style={styles.locationRow}>
                    <Ionicons name="globe" size={16} color={colors.accent} />
                    <Text style={styles.location}>
                      {/* Origin with flag after text; attempt flag mapping if missing */}
                      {(() => {
                        const origin = (currentProfile as any).ethnicity as string;
                        const hasEmoji = /\p{Extended_Pictographic}/u.test(origin);
                        if (hasEmoji) return origin;
                        const map: any = { 'السعودية':'🇸🇦','الإمارات':'🇦🇪','الكويت':'🇰🇼','قطر':'🇶🇦','البحرين':'🇧🇭','عُمان':'🇴🇲','اليمن':'🇾🇪','العراق':'🇮🇶','الأردن':'🇯🇴','سوريا':'🇸🇾','لبنان':'🇱🇧','فلسطين':'🇵🇸','مصر':'🇪🇬','السودان':'🇸🇩','ليبيا':'🇱🇾','تونس':'🇹🇳','الجزائر':'🇩🇿','المغرب':'🇲🇦','موريتانيا':'🇲🇷','الصومال':'🇸🇴','جيبوتي':'🇩🇯','جزر القمر':'🇰🇲' };
                        return map[origin] ? `${origin} ${map[origin]}` : origin;
                      })()}
                    </Text>
                  </View>
                )}
                {currentProfile.profession && (
                  <Text style={styles.detail}>💼 {currentProfile.profession}</Text>
                )}
                <View style={styles.tapHint}>
                  <Ionicons name="chevron-up" size={18} color={colors.muted} />
                  <Text style={styles.tapHintText}>اضغط للمزيد</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
            ) : null}
          </View>

          {/* Loading indicator below the card */}
          {isCurrentImageLoading && (
            <View style={{ alignItems: 'center', marginTop: spacing(1) }}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          )}

          {/* Action Buttons */}
          {currentProfile && (
            <View style={styles.controlRing}>
            {/* Like Button - Rightmost */}
            <TouchableOpacity 
              onPress={() => handleSwipe('right', false)}
              style={[styles.actionBtn, styles.likeBtn]}
              disabled={isSwipingRef.current}
            >
              <Ionicons name="heart" size={32} color="#fff" />
            </TouchableOpacity>
            
            {/* Super Like Button - Middle */}
            <TouchableOpacity 
              onPress={() => handleSwipe('up', true)}
              style={[styles.actionBtn, styles.superLikeBtn]}
              disabled={isSwipingRef.current}
            >
              <Ionicons name="star" size={28} color="#fff" />
            </TouchableOpacity>
            
            {/* Reject Button - Left */}
            <TouchableOpacity 
              onPress={() => handleSwipe('left', false)}
              style={[styles.actionBtn, styles.nopeBtn]}
              disabled={isSwipingRef.current}
            >
              <Ionicons name="close" size={32} color="#fff" />
            </TouchableOpacity>
            
            {/* Undo Button - Leftmost */}
            <TouchableOpacity 
              onPress={handleUndo}
              style={[styles.actionBtn, styles.undoBtn, !canUndo && styles.undoBtnDisabled]}
              disabled={!canUndo || isSwipingRef.current}
            >
              <Ionicons name="arrow-undo" size={28} color={canUndo ? '#000' : '#666'} />
            </TouchableOpacity>
          </View>
          )}
        </View>

        {/* Match Modal */}
        <MatchModal
          visible={showMatchModal}
          currentUser={currentUser}
          matchedUser={matchedUser}
          onClose={() => {
            console.log('Match modal closed - Continue Discovering pressed');
            setShowMatchModal(false);
            setMatchedUser(null);
            setMatchId(null);
          // If that was the last profile, auto-reload for better UX
          if (currentIndex >= deck.length) {
              console.log('Last profile was a match, refetching profiles for smooth experience...');
              setTimeout(() => {
                refetchDiscovery();
              }, 300); // Small delay for smooth transition
            }
          }}
          onSendMessage={() => {
            console.log('Match modal closed - Send Message pressed, navigating to chat');
            setShowMatchModal(false);
            if (matchId) {
              navigation.navigate('Chat', { matchId });
            }
          }}
        />

        {/* Profile Detail Modal */}
        <ProfileDetailModal
          visible={showProfileDetail}
          user={currentProfile}
          onClose={() => setShowProfileDetail(false)}
          onLike={() => {
            setShowProfileDetail(false);
            setTimeout(() => handleSwipe('right', false), 100);
          }}
          onPass={() => {
            setShowProfileDetail(false);
            setTimeout(() => handleSwipe('left', false), 100);
          }}
          onSuperLike={() => {
            setShowProfileDetail(false);
            setTimeout(() => handleSwipe('up', true), 100);
          }}
        />
        <SearchFiltersModal 
          visible={showFiltersModal} 
          onFiltersChanged={handleFiltersChanged}
          onClose={() => {
            setShowFiltersModal(false);
          }} 
        />
      </SafeAreaView>
    </GradientBackground>
  );
}

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

const styles = StyleSheet.create({
  wrapper: { 
    flex: 1 
  },
  container: { 
    flex: 1, 
    padding: spacing(2) 
  },
  header: { 
    color: colors.text, 
    fontSize: 28, 
    fontWeight: '700', 
    textAlign: 'right', 
    marginBottom: spacing(0.5), 
    paddingHorizontal: spacing(2) 
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(2),
    marginBottom: spacing(1),
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  loadingText: { 
    color: colors.text, 
    textAlign: 'center', 
    marginTop: spacing(10),
    fontSize: 16,
  },
  emptyState: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: spacing(4) 
  },
  emptyIcon: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    backgroundColor: colors.card, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: spacing(3),
    ...shadows.card
  },
  emptyTitle: { 
    color: colors.text, 
    fontSize: 24, 
    fontWeight: '700', 
    textAlign: 'center', 
    marginBottom: spacing(1) 
  },
  emptyText: { 
    color: colors.subtext, 
    fontSize: 16, 
    textAlign: 'center', 
    marginBottom: spacing(3), 
    lineHeight: 24 
  },
  emptyHint: { 
    color: colors.muted, 
    fontSize: 14, 
    textAlign: 'center', 
    marginTop: spacing(2) 
  },
  refreshStatus: {
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing(1),
    fontSize: 12,
    opacity: 0.8,
  },
  refreshBtn: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    gap: spacing(1), 
    backgroundColor: colors.accent, 
    paddingHorizontal: spacing(4), 
    paddingVertical: spacing(1.5), 
    borderRadius: radii.pill,
    ...shadows.soft
  },
  refreshBtnText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '700' 
  },
  cardContainer: { 
    flex: 1, 
    position: 'relative', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: spacing(2) 
  },
  card: { 
    width: SCREEN_WIDTH - 40, 
    maxHeight: 520, 
    borderRadius: radii.xl, 
    backgroundColor: colors.card, 
    ...shadows.card, 
    position: 'absolute' 
  },
  nextCard: { 
    opacity: 0.5, 
    transform: [{ scale: 0.95 }] 
  },
  superLikerGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: radii.xl + 4,
    backgroundColor: '#3b82f6',
    opacity: 0.3,
    zIndex: 0,
  },
  superLikerBorder: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    borderRadius: radii.xl, 
    borderWidth: 5, 
    borderColor: '#3b82f6', 
    zIndex: 1,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  cardImage: { 
    width: '100%', 
    height: 320, 
    borderTopLeftRadius: radii.xl, 
    borderTopRightRadius: radii.xl, 
    backgroundColor: colors.surface, 
    justifyContent: 'flex-end' 
  },
  imageLoaderOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)'
  },
  likeLabel: { 
    position: 'absolute', 
    top: 50, 
    right: 30, 
    backgroundColor: '#10b981', 
    padding: spacing(2), 
    borderRadius: radii.md, 
    transform: [{ rotate: '20deg' }] 
  },
  nopeLabel: { 
    position: 'absolute', 
    top: 50, 
    left: 30, 
    backgroundColor: '#ef4444', 
    padding: spacing(2), 
    borderRadius: radii.md, 
    transform: [{ rotate: '-20deg' }] 
  },
  labelText: { 
    color: '#fff', 
    fontSize: 32, 
    fontWeight: '900' 
  },
  superLabel: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    backgroundColor: '#3b82f6',
    padding: spacing(2),
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  superLikeBadge: { 
    position: 'absolute', 
    top: 10, 
    alignSelf: 'center', 
    backgroundColor: '#3b82f6', 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    gap: spacing(0.5), 
    paddingHorizontal: spacing(2), 
    paddingVertical: spacing(0.5), 
    borderRadius: radii.pill 
  },
  superLikeText: { 
    color: '#fff', 
    fontSize: 12, 
    fontWeight: '700' 
  },
  motherBadge: {
    position: 'absolute',
    top: spacing(2),
    right: spacing(2),
    backgroundColor: 'rgba(236, 72, 153, 0.9)', // Pink color for mother
    borderRadius: radii.pill,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing(0.5),
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(0.75),
    ...shadows.soft,
  },
  motherBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  traitsOverlay: {
    position: 'absolute',
    top: spacing(2),
    left: spacing(2),
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(1),
    maxWidth: '50%',
  },
  traitChip: {
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.5),
    borderRadius: radii.pill,
    ...shadows.soft,
  },
  traitText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  info: { 
    padding: spacing(2) 
  },
  infoHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing(1),
    marginBottom: spacing(0.5),
  },
  name: { 
    color: colors.text, 
    fontSize: 24, 
    fontWeight: '700', 
    marginBottom: spacing(0.5),
    textAlign: 'right',
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing(0.5),
    marginTop: 4,
  },
  location: { 
    color: colors.subtext, 
    fontSize: 14, 
    marginBottom: spacing(0.5),
    textAlign: 'right',
    flex: 1,
  },
  detail: { 
    color: colors.subtext, 
    fontSize: 14, 
    marginBottom: spacing(0.5),
    textAlign: 'right'
  },
  bio: { 
    color: colors.text, 
    fontSize: 14, 
    marginTop: spacing(1),
    textAlign: 'right'
  },
  tapHint: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(0.5),
    marginTop: spacing(1),
    paddingVertical: spacing(0.5),
  },
  tapHintText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  controlRing: { 
    flexDirection: 'row-reverse', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: spacing(2), 
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(2),
    paddingBottom: spacing(3)
  },
  actionBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card
  },
  nopeBtn: {
    backgroundColor: '#ef4444',
  },
  likeBtn: {
    backgroundColor: '#10b981',
  },
  superLikeBtn: { 
    backgroundColor: '#3b82f6',
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  undoBtn: {
    backgroundColor: '#fbbf24', // Yellow
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  undoBtnDisabled: {
    backgroundColor: '#6b7280', // Gray when disabled
    opacity: 0.5,
  },
  photoNavLeft: {
    position: 'absolute',
    left: 12,
    top: '50%',
    marginTop: -24,
    zIndex: 10,
  },
  photoNavRight: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -24,
    zIndex: 10,
  },
  photoNavBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  photoIndicators: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    zIndex: 5,
  },
  photoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  photoDotActive: {
    backgroundColor: '#fff',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  navArrow: {
    position: 'absolute',
    top: '50%',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 10,
  },
  navArrowLeft: {
    left: 12,
    marginTop: -24,
  },
  navArrowRight: {
    right: 12,
    marginTop: -24,
  },
  notificationBanner: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing(2),
    marginHorizontal: spacing(2),
    marginBottom: spacing(2),
    ...shadows.soft,
  },
  notificationContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: spacing(1.5),
  },
  notificationTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right',
  },
  notificationText: {
    color: colors.subtext,
    fontSize: 13,
    textAlign: 'right',
    marginTop: 2,
  },
  notificationActions: {
    flexDirection: 'row-reverse',
    gap: spacing(1),
  },
  notificationEnableBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1),
    borderRadius: radii.md,
  },
  notificationEnableText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  notificationDismissBtn: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1),
    borderRadius: radii.md,
  },
  notificationDismissText: {
    color: colors.subtext,
    fontSize: 14,
    fontWeight: '600',
  },
  // Location Required Screen Styles
  locationRequiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(4),
  },
  locationRequiredIconWrapper: {
    marginBottom: spacing(4),
  },
  locationRequiredIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
    borderWidth: 3,
    borderColor: colors.accent + '20', // 20% opacity
  },
  locationRequiredContent: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing(4),
  },
  locationRequiredTitle: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing(2),
    writingDirection: 'rtl',
  },
  locationRequiredDescription: {
    color: colors.subtext,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing(2),
    writingDirection: 'rtl',
  },
  enableLocationBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(1.5),
    backgroundColor: colors.accent,
    paddingHorizontal: spacing(5),
    paddingVertical: spacing(2.5),
    borderRadius: radii.pill,
    width: '100%',
    maxWidth: 320,
    ...shadows.card,
  },
  enableLocationBtnDisabled: {
    opacity: 0.7,
  },
  enableLocationBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  locationPrivacyNote: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing(1),
    marginTop: spacing(3),
    paddingHorizontal: spacing(3),
  },
  locationPrivacyText: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    flex: 1,
    writingDirection: 'rtl',
  },
});
