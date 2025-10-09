import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/ui/Button';
import GradientBackground from '../components/ui/GradientBackground';
import { colors, spacing, radii, gradients } from '../theme';

export default function SignupMethodScreen({ navigation }: any) {
  return (
    <GradientBackground colors={gradients.screen}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="person-add" size={48} color={colors.accent} />
          </View>
          <Text style={styles.title}>إنشاء حساب جديد</Text>
          <Text style={styles.subtitle}>
            اختر طريقة التسجيل المفضلة لديك
          </Text>
        </View>

        {/* Methods */}
        <View style={styles.methodsContainer}>
          {/* Phone Method */}
          <TouchableOpacity 
            style={styles.methodCard}
            onPress={() => navigation.navigate('PhoneOTP')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#1a2140', '#1f2749']}
              style={styles.methodGradient}
            >
              <View style={styles.methodIcon}>
                <Ionicons name="phone-portrait" size={32} color={colors.accent} />
              </View>
              <View style={styles.methodContent}>
                <Text style={styles.methodTitle}>التسجيل بالهاتف</Text>
                <Text style={styles.methodDescription}>
                  سنرسل لك رمز تحقق عبر رسالة نصية
                </Text>
              </View>
              <Ionicons name="chevron-back" size={24} color={colors.subtext} />
            </LinearGradient>
          </TouchableOpacity>

          {/* Email Method */}
          <TouchableOpacity 
            style={styles.methodCard}
            onPress={() => navigation.navigate('EmailOTP')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#1a2140', '#1f2749']}
              style={styles.methodGradient}
            >
              <View style={styles.methodIcon}>
                <Ionicons name="mail" size={32} color={colors.accent2} />
              </View>
              <View style={styles.methodContent}>
                <Text style={styles.methodTitle}>التسجيل بالبريد الإلكتروني</Text>
                <Text style={styles.methodDescription}>
                  سنرسل لك رمز تحقق عبر البريد الإلكتروني
                </Text>
              </View>
              <Ionicons name="chevron-back" size={24} color={colors.subtext} />
            </LinearGradient>
          </TouchableOpacity>

          {/* Social Login (Coming Soon) */}
          <View style={[styles.methodCard, styles.disabledCard]}>
            <LinearGradient
              colors={['#141a31', '#11162a']}
              style={styles.methodGradient}
            >
              <View style={styles.methodIcon}>
                <Ionicons name="logo-google" size={32} color={colors.muted} />
              </View>
              <View style={styles.methodContent}>
                <Text style={[styles.methodTitle, styles.disabledText]}>
                  Google / Apple
                </Text>
                <Text style={[styles.methodDescription, styles.disabledText]}>
                  قريباً...
                </Text>
              </View>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>قريباً</Text>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark" size={24} color={colors.success} />
            <Text style={styles.infoText}>
              جميع بياناتك محمية ومشفرة بأعلى معايير الأمان
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="lock-closed" size={24} color={colors.info} />
            <Text style={styles.infoText}>
              لن نشارك معلوماتك مع أي جهة خارجية أبداً
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerText}>
              لديك حساب بالفعل؟{' '}
              <Text style={styles.footerLink}>تسجيل الدخول</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { 
    flexGrow: 1,
    padding: spacing(3),
    paddingTop: spacing(2),
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing(4),
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(2),
    borderWidth: 2,
    borderColor: colors.border,
  },
  title: { 
    color: colors.text, 
    fontSize: 26,
    fontWeight: '700',
    marginBottom: spacing(1),
  },
  subtitle: {
    color: colors.subtext,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: spacing(2),
  },
  methodsContainer: {
    gap: spacing(2),
    marginBottom: spacing(3),
  },
  methodCard: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  methodGradient: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: spacing(2.5),
    gap: spacing(2),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
  },
  methodIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodContent: {
    flex: 1,
  },
  methodTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: spacing(0.5),
  },
  methodDescription: {
    color: colors.subtext,
    fontSize: 13,
    lineHeight: 18,
  },
  disabledCard: {
    opacity: 0.6,
  },
  disabledText: {
    color: colors.muted,
  },
  comingSoonBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.75),
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  comingSoonText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  infoSection: {
    gap: spacing(2),
    marginBottom: spacing(3),
  },
  infoCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing(2),
    borderRadius: radii.md,
    gap: spacing(2),
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: {
    flex: 1,
    color: colors.subtext,
    fontSize: 13,
    lineHeight: 19,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing(2),
    paddingTop: spacing(2),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    color: colors.subtext,
    fontSize: 14,
    textAlign: 'center',
  },
  footerLink: {
    color: colors.accent,
    fontWeight: '700',
  },
});
