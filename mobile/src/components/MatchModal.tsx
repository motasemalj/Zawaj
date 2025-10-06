import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, shadows } from '../theme';
import Avatar from './ui/Avatar';
import { User, getClient } from '../api/client';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MatchModalProps {
  visible: boolean;
  currentUser: User | null;
  matchedUser: User | null;
  onClose: () => void;
  onSendMessage: () => void;
}

export default function MatchModal({
  visible,
  currentUser,
  matchedUser,
  onClose,
  onSendMessage,
}: MatchModalProps) {
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const heartAnim1 = useRef(new Animated.Value(0)).current;
  const heartAnim2 = useRef(new Animated.Value(0)).current;
  const heartAnim3 = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      console.log('🎉 Match modal now visible - staying open until user action');
      // Start animations - FAST for instant feel!
      Animated.parallel([
        // Fade in background - faster!
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        // Scale in content - snappier spring!
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 60,
          useNativeDriver: true,
        }),
        // Slide up buttons - faster and less delay
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          delay: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Animated hearts - start immediately with tighter stagger
      Animated.stagger(100, [
        createHeartAnimation(heartAnim1),
        createHeartAnimation(heartAnim2),
        createHeartAnimation(heartAnim3),
      ]).start();

      // Sparkle animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.3);
      slideAnim.setValue(50);
      heartAnim1.setValue(0);
      heartAnim2.setValue(0);
      heartAnim3.setValue(0);
      sparkleAnim.setValue(0);
    }
  }, [visible]);

  const createHeartAnimation = (anim: Animated.Value) => {
    return Animated.sequence([
      Animated.timing(anim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(anim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]);
  };

  if (!currentUser || !matchedUser) {
    if (visible) {
      console.warn('⚠️ Match modal is visible but currentUser or matchedUser is null!', {
        currentUser: !!currentUser,
        matchedUser: !!matchedUser,
      });
    }
    return null;
  }

  const api = getClient();
  const baseUrl = api.defaults.baseURL || '';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => {
        // Prevent accidental dismissal - require explicit button press
        console.log('Match modal back button pressed - ignoring to keep modal open');
      }}
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Background gradient */}
        <LinearGradient
          colors={['rgba(254, 60, 114, 0.95)', 'rgba(124, 92, 255, 0.95)']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Floating hearts */}
        <Animated.View
          style={[
            styles.heart,
            { left: '20%', top: '20%' },
            {
              opacity: heartAnim1,
              transform: [
                {
                  translateY: heartAnim1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -50],
                  }),
                },
                {
                  scale: heartAnim1.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 1.2, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons name="heart" size={40} color="#fff" />
        </Animated.View>

        <Animated.View
          style={[
            styles.heart,
            { right: '20%', top: '30%' },
            {
              opacity: heartAnim2,
              transform: [
                {
                  translateY: heartAnim2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -60],
                  }),
                },
                {
                  scale: heartAnim2.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 1.3, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons name="heart" size={50} color="#fff" />
        </Animated.View>

        <Animated.View
          style={[
            styles.heart,
            { left: '50%', top: '15%' },
            {
              opacity: heartAnim3,
              transform: [
                {
                  translateY: heartAnim3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -70],
                  }),
                },
                {
                  scale: heartAnim3.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 1.5, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons name="heart" size={35} color="#fff" />
        </Animated.View>

        {/* Content */}
        <Animated.View
          style={[
            styles.content,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Title */}
          <View style={styles.titleContainer}>
            <Animated.View
              style={{
                opacity: sparkleAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.7, 1, 0.7],
                }),
              }}
            >
              <Text style={styles.title}>🎉 توافق! 🎉</Text>
            </Animated.View>
            <Text style={styles.subtitle}>
              لقد اعجبتما ببعضكما البعض
            </Text>
          </View>

          {/* Profile pictures */}
          <View style={styles.profilesContainer}>
            <View style={styles.profileWrapper}>
              <View style={styles.profileImageContainer}>
                {currentUser.photos?.[0]?.url ? (
                  <ImageBackground
                    source={{ uri: `${baseUrl}${currentUser.photos[0].url}` }}
                    style={styles.profileImage}
                    imageStyle={{ borderRadius: 80 }}
                  />
                ) : (
                  <Avatar
                    uri={undefined}
                    label={currentUser.display_name}
                    size={160}
                  />
                )}
              </View>
              <Text style={styles.profileName}>{currentUser.display_name}</Text>
            </View>

            {/* Heart icon in middle */}
            <Animated.View
              style={[
                styles.middleHeart,
                {
                  transform: [
                    {
                      scale: sparkleAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [1, 1.2, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={['#fe3c72', '#ff5864']}
                style={styles.middleHeartGradient}
              >
                <Ionicons name="heart" size={32} color="#fff" />
              </LinearGradient>
            </Animated.View>

            <View style={styles.profileWrapper}>
              <View style={styles.profileImageContainer}>
                {matchedUser.photos?.[0]?.url ? (
                  <ImageBackground
                    source={{ uri: `${baseUrl}${matchedUser.photos[0].url}` }}
                    style={styles.profileImage}
                    imageStyle={{ borderRadius: 80 }}
                  />
                ) : (
                  <Avatar
                    uri={undefined}
                    label={matchedUser.display_name}
                    size={160}
                  />
                )}
              </View>
              <Text style={styles.profileName}>{matchedUser.display_name}</Text>
            </View>
          </View>

          {/* Action buttons */}
          <Animated.View
            style={[
              styles.actionsContainer,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onSendMessage}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#22c55e', '#34d399']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="chatbubble" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>ارسل رسالة</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>متابعة الاستكشاف</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heart: {
    position: 'absolute',
  },
  content: {
    width: SCREEN_WIDTH - 40,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing(3),
    alignItems: 'center',
    ...shadows.card,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: spacing(3),
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing(1),
  },
  subtitle: {
    fontSize: 16,
    color: colors.subtext,
    textAlign: 'center',
  },
  profilesContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing(3),
    paddingHorizontal: spacing(1),
  },
  profileWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
    overflow: 'hidden',
    ...shadows.card,
  },
  profileImage: {
    width: 120,
    height: 120,
  },
  profileName: {
    marginTop: spacing(1),
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  middleHeart: {
    marginHorizontal: spacing(1),
  },
  middleHeartGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  actionsContainer: {
    width: '100%',
    gap: spacing(1.5),
  },
  primaryButton: {
    width: '100%',
    borderRadius: radii.pill,
    overflow: 'hidden',
    ...shadows.soft,
  },
  buttonGradient: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(1),
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3),
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3),
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

