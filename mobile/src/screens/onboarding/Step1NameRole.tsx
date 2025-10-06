import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../../theme';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import GradientBackground from '../../components/ui/GradientBackground';

type Step1Props = {
  onComplete: (data: { first_name: string; role: string; mother_for?: string }) => void;
  onBack?: () => void;
  showBackButton?: boolean;
};

export default function Step1NameRole({ onComplete, onBack, showBackButton = true }: Step1Props) {
  const [firstName, setFirstName] = useState('');
  const [role, setRole] = useState<'male' | 'female' | 'mother' | null>(null);
  const [motherFor, setMotherFor] = useState<'son' | 'daughter' | null>(null);
  const insets = useSafeAreaInsets();

  const canContinue = firstName.length >= 2 && role && (role !== 'mother' || motherFor);

  const handleContinue = () => {
    if (!canContinue) return;
    
    const data: any = {
      first_name: firstName,
      role: role!
    };
    
    if (role === 'mother' && motherFor) {
      data.mother_for = motherFor;
    }
    
    onComplete(data);
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing(3), paddingBottom: insets.bottom + spacing(2) }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <ProgressBar current={1} total={8} />
            <Text style={styles.step}>الخطوة 1 من 8</Text>
          </View>

          <View style={styles.content}>
            <View style={styles.titleRow}>
              {showBackButton && (
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                  <Ionicons name="arrow-forward" size={28} color={colors.text} />
                </TouchableOpacity>
              )}
              <Text style={styles.title}>لنتعرف عليك</Text>
            </View>
            <Text style={styles.subtitle}>أنا</Text>

            <View style={styles.section}>
              <Text style={styles.label}>أنا</Text>
              <View style={styles.roleContainer}>
                <TouchableOpacity
                  style={[styles.roleButton, role === 'male' && styles.roleButtonActive]}
                  onPress={() => setRole('male')}
                >
                  <Text style={[styles.roleText, role === 'male' && styles.roleTextActive]}>
                    ذكر
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleButton, role === 'female' && styles.roleButtonActive]}
                  onPress={() => setRole('female')}
                >
                  <Text style={[styles.roleText, role === 'female' && styles.roleTextActive]}>
                    أنثى
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleButton, role === 'mother' && styles.roleButtonActive]}
                  onPress={() => setRole('mother')}
                >
                  <Text style={[styles.roleText, role === 'mother' && styles.roleTextActive]}>
                    أم
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {role === 'mother' && (
              <View style={styles.section}>
                <Text style={styles.label}>أبحث لـ</Text>
                <View style={styles.roleContainer}>
                  <TouchableOpacity
                    style={[styles.roleButton, motherFor === 'son' && styles.roleButtonActive]}
                    onPress={() => setMotherFor('son')}
                  >
                    <Text style={[styles.roleText, motherFor === 'son' && styles.roleTextActive]}>
                      ابني
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.roleButton, motherFor === 'daughter' && styles.roleButtonActive]}
                    onPress={() => setMotherFor('daughter')}
                  >
                    <Text style={[styles.roleText, motherFor === 'daughter' && styles.roleTextActive]}>
                      ابنتي
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Name field moved to the end as requested */}
            <View style={styles.section}>
              <Text style={styles.label}>الاسم الأول</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="أدخل اسمك الأول"
                placeholderTextColor={colors.muted}
                returnKeyType="done"
              />
            </View>
          </View>

          <View style={styles.footer}>
            <Button
              title="متابعة"
              onPress={handleContinue}
              disabled={!canContinue}
              variant="gradient"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing(3),
  },
  header: {
    marginBottom: spacing(3),
  },
  step: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing(1),
    textAlign: 'center',
  },
  content: {
    // Removed flex: 1 to let content flow naturally
  },
  titleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing(1.5),
    marginBottom: spacing(1),
  },
  backButton: {
    padding: spacing(0.5),
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    color: colors.subtext,
    fontSize: 16,
    marginBottom: spacing(3),
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  section: {
    marginBottom: spacing(3),
  },
  label: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing(1),
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing(2),
    color: colors.text,
    fontSize: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  roleContainer: {
    flexDirection: 'row-reverse',
    gap: spacing(1.5),
  },
  roleButton: {
    flex: 1,
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(2),
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  roleButtonActive: {
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  roleText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  roleTextActive: {
    color: colors.accent,
  },
  footer: {
    marginTop: spacing(3),
    paddingTop: spacing(2),
  },
});

