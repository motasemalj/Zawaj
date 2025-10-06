import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radii } from '../../theme';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import GradientBackground from '../../components/ui/GradientBackground';
import { getClient } from '../../api/client';

type Step4Props = {
  onComplete: (data: {
    profession: string;
    education: string;
    hometown: string;
    smoker: string;
    marital_status: string;
  }) => void;
  onBack: () => void;
};

export default function Step4Demographics({ onComplete, onBack }: Step4Props) {
  const insets = useSafeAreaInsets();
  const [profession, setProfession] = useState('');
  const [education, setEducation] = useState('');
  const [hometown, setHometown] = useState('');
  const [smoker, setSmoker] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [options, setOptions] = useState<any>({});

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const api = getClient();
      const res = await api.get('/onboarding/options');
      setOptions(res.data);
    } catch (e) {
      console.error('Failed to load options', e);
    }
  };

  const canContinue = 
    profession.length >= 2 &&
    education &&
    hometown.length >= 2 &&
    smoker &&
    maritalStatus;

  const handleContinue = () => {
    if (!canContinue) return;
    onComplete({
      profession,
      education,
      hometown,
      smoker,
      marital_status: maritalStatus,
    });
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing(2), paddingBottom: insets.bottom + spacing(2) }]} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <ProgressBar current={4} total={8} />
            <Text style={styles.step}>الخطوة 4 من 8</Text>
          </View>

          <View style={styles.content}>
            <View style={styles.titleRow}>
              <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <Ionicons name="arrow-forward" size={28} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.title}>معلومات إضافية</Text>
            </View>
            <Text style={styles.subtitle}>ساعدنا في التعرف عليك أكثر</Text>

            {/* Profession */}
            <View style={styles.section}>
              <Text style={styles.label}>ما هي مهنتك؟</Text>
              <TextInput
                style={styles.input}
                value={profession}
                onChangeText={setProfession}
                placeholder="مثال: مهندس، طبيب، معلم..."
                placeholderTextColor={colors.muted}
                returnKeyType="next"
              />
            </View>

            {/* Education */}
            <View style={styles.section}>
              <Text style={styles.label}>ما هو مستوى تعليمك؟</Text>
              <View style={styles.chipColumn}>
                {(options.education_levels || ['ثانوي', 'بكالوريوس', 'ماجستير', 'دكتوراه', 'آخر']).map((level: string) => (
                  <TouchableOpacity
                    key={level}
                    style={[styles.optionButton, education === level && styles.optionButtonActive]}
                    onPress={() => setEducation(level)}
                  >
                    <Text style={[styles.optionText, education === level && styles.optionTextActive]}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Location */}
            <View style={styles.section}>
              <Text style={styles.label}>أين نشأت؟</Text>
              <TextInput
                style={styles.input}
                value={hometown}
                onChangeText={setHometown}
                placeholder="مثال: الرياض، السعودية"
                placeholderTextColor={colors.muted}
                returnKeyType="next"
              />
            </View>

            {/* Marital Status */}
            <View style={styles.section}>
              <Text style={styles.label}>ما هي حالتك الاجتماعية؟</Text>
              <View style={styles.chipRow}>
                {(options.marital_statuses || ['أعزب/عزباء', 'مطلق/مطلقة', 'أرمل/أرملة']).map((status: string) => (
                  <TouchableOpacity
                    key={status}
                    style={[styles.chip, maritalStatus === status && styles.chipActive]}
                    onPress={() => setMaritalStatus(status)}
                  >
                    <Text style={[styles.chipText, maritalStatus === status && styles.chipTextActive]}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Smoking */}
            <View style={styles.section}>
              <Text style={styles.label}>هل تدخن؟</Text>
              <View style={styles.chipRow}>
                {(options.smoking_options || ['لا', 'نعم', 'أحياناً', 'أحاول الإقلاع']).map((opt: string) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.chip, smoker === opt && styles.chipActive]}
                    onPress={() => setSmoker(opt)}
                  >
                    <Text style={[styles.chipText, smoker === opt && styles.chipTextActive]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
    marginBottom: spacing(1.5),
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
  chipRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing(1.5),
  },
  chipColumn: {
    gap: spacing(1.5),
  },
  chip: {
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1.5),
    borderRadius: radii.pill,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  chipText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  optionButton: {
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(2.5),
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
  },
  optionButtonActive: {
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  optionText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  optionTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  footer: {
    marginTop: spacing(3),
    paddingTop: spacing(2),
  },
});

