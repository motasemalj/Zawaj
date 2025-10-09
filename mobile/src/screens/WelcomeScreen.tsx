import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/ui/Button';
import { colors, spacing, radii, gradients } from '../theme';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }: any) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={gradients.screen as [string, string, ...string[]]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.container}>
          {/* Hero Section */}
          <Animated.View 
            style={[
              styles.heroSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
              }
            ]}
          >
            {/* Icon/Logo */}
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={gradients.cta as [string, string, ...string[]]}
                style={styles.iconGradient}
              >
                <Ionicons name="heart" size={56} color="#fff" />
              </LinearGradient>
            </View>

            {/* Brand */}
            <Text style={styles.brand}>زواج</Text>
            
            {/* Tagline */}
            <Text style={styles.tagline}>
              ابحث عن شريك حياتك بطريقة حلال ومحترمة
            </Text>

            {/* Feature Pills */}
            <View style={styles.featureContainer}>
              <View style={styles.featurePill}>
                <Ionicons name="shield-checkmark" size={16} color={colors.success} />
                <Text style={styles.featureText}>آمن ومحترم</Text>
              </View>
              <View style={styles.featurePill}>
                <Ionicons name="people" size={16} color={colors.accent} />
                <Text style={styles.featureText}>مجتمع موثوق</Text>
              </View>
              <View style={styles.featurePill}>
                <Ionicons name="lock-closed" size={16} color={colors.info} />
                <Text style={styles.featureText}>خصوصية تامة</Text>
              </View>
            </View>
          </Animated.View>

          {/* CTA Section */}
          <Animated.View 
            style={[
              styles.ctaSection,
              { opacity: fadeAnim }
            ]}
          >
            <Button 
              title="إنشاء حساب جديد" 
              onPress={() => navigation.navigate('SignupMethod')}
              style={styles.primaryButton}
            />
            
            <Button 
              title="لديّ حساب بالفعل" 
              variant="outline" 
              onPress={() => navigation.navigate('Login')}
              style={styles.secondaryButton}
            />

            {/* Terms & Privacy */}
            <Text style={styles.termsText}>
              بالمتابعة، أنت توافق على{' '}
              <Text style={styles.termsLink}>شروط الخدمة</Text>
              {' '}و{' '}
              <Text style={styles.termsLink}>سياسة الخصوصية</Text>
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing(3),
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? height * 0.08 : height * 0.12,
    paddingBottom: Platform.OS === 'ios' ? spacing(2) : spacing(4),
  },
  heroSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: spacing(3),
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  brand: {
    color: colors.text,
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: spacing(2),
    textShadowColor: 'rgba(254, 60, 114, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  tagline: {
    color: colors.subtext,
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: spacing(2),
    marginBottom: spacing(3),
  },
  featureContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing(1.5),
    marginTop: spacing(2),
  },
  featurePill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: radii.pill,
    gap: spacing(0.75),
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  ctaSection: {
    width: '100%',
    paddingBottom: spacing(2),
  },
  primaryButton: {
    marginBottom: spacing(2),
    shadowColor: colors.accent,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  secondaryButton: {
    marginBottom: spacing(2),
  },
  termsText: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing(2),
    marginTop: spacing(1),
  },
  termsLink: {
    color: colors.accent,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
