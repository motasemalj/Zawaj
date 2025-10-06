import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radii } from '../../theme';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import GradientBackground from '../../components/ui/GradientBackground';

type Step8Props = {
  onComplete: (data: { age_min: number; age_max: number; distance_km: number; accept_terms: boolean }) => void;
  onBack: () => void;
};

export default function Step8Preferences({ onComplete, onBack }: Step8Props) {
  const insets = useSafeAreaInsets();
  const [ageMin, setAgeMin] = useState(22);
  const [ageMax, setAgeMax] = useState(35);
  const [distance, setDistance] = useState(50);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedGuidelines, setAcceptedGuidelines] = useState(false);
  
  const allAccepted = acceptedTerms && acceptedPrivacy && acceptedGuidelines;

  const handleContinue = () => {
    if (!allAccepted) return;
    onComplete({
      age_min: ageMin,
      age_max: ageMax,
      distance_km: distance,
      accept_terms: true,
    });
  };

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing(2), paddingBottom: insets.bottom + spacing(2) }]}>
        <View style={styles.header}>
          <ProgressBar current={8} total={8} />
          <Text style={styles.step}>الخطوة الأخيرة</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="arrow-forward" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>التفضيلات والشروط</Text>
          </View>
          <Text style={styles.subtitle}>
            من تود مقابلته وقبول الشروط
          </Text>

          {/* Age Range */}
          <View style={styles.section}>
            <Text style={styles.label}>نطاق العمر</Text>
            
            <View style={styles.ageRangeRow}>
              {/* Min Age */}
              <View style={styles.ageControl}>
                <Text style={styles.ageControlLabel}>من</Text>
                <View style={styles.ageValueRow}>
                  <TouchableOpacity 
                    style={styles.ageButtonCompact} 
                    onPress={() => setAgeMin(Math.min(ageMax - 1, ageMin + 1))}
                  >
                    <Ionicons name="add" size={20} color={colors.accent} />
                  </TouchableOpacity>
                  <View style={styles.ageValueBox}>
                    <Text style={styles.ageValueText}>{ageMin}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.ageButtonCompact} 
                    onPress={() => setAgeMin(Math.max(18, ageMin - 1))}
                  >
                    <Ionicons name="remove" size={20} color={colors.accent} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.ageSeparator}>
                <Ionicons name="remove-outline" size={24} color={colors.muted} />
              </View>

              {/* Max Age */}
              <View style={styles.ageControl}>
                <Text style={styles.ageControlLabel}>إلى</Text>
                <View style={styles.ageValueRow}>
                  <TouchableOpacity 
                    style={styles.ageButtonCompact} 
                    onPress={() => setAgeMax(Math.min(100, ageMax + 1))}
                  >
                    <Ionicons name="add" size={20} color={colors.accent} />
                  </TouchableOpacity>
                  <View style={styles.ageValueBox}>
                    <Text style={styles.ageValueText}>{ageMax}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.ageButtonCompact} 
                    onPress={() => setAgeMax(Math.max(ageMin + 1, ageMax - 1))}
                  >
                    <Ionicons name="remove" size={20} color={colors.accent} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Distance */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>المسافة القصوى</Text>
              <Text style={styles.value}>{distance} كم</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={5}
              maximumValue={500}
              step={5}
              value={distance}
              onValueChange={setDistance}
              minimumTrackTintColor={colors.accent}
              maximumTrackTintColor={colors.chip}
              thumbTintColor={colors.accent}
            />
            <View style={styles.distanceLabels}>
              <Text style={styles.distanceLabelText}>قريب</Text>
              <Text style={styles.distanceLabelText}>بعيد</Text>
            </View>
          </View>

          <View style={styles.hint}>
            <Text style={styles.hintText}>
              💡 تساعدنا هذه التفضيلات في عرض أكثر التطابقات توافقاً في منطقتك
            </Text>
          </View>

          {/* Terms & Conditions */}
          <View style={styles.termsSection}>
            <View style={styles.termsHeader}>
              <Ionicons name="shield-checkmark" size={32} color={colors.accent} />
              <Text style={styles.termsTitle}>الشروط والأحكام</Text>
            </View>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAcceptedTerms(!acceptedTerms)}
            >
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                {acceptedTerms && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
              <Text style={styles.checkboxText}>
                أوافق على <Text style={styles.link}>شروط الخدمة</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAcceptedPrivacy(!acceptedPrivacy)}
            >
              <View style={[styles.checkbox, acceptedPrivacy && styles.checkboxChecked]}>
                {acceptedPrivacy && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
              <Text style={styles.checkboxText}>
                أوافق على <Text style={styles.link}>سياسة الخصوصية</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAcceptedGuidelines(!acceptedGuidelines)}
            >
              <View style={[styles.checkbox, acceptedGuidelines && styles.checkboxChecked]}>
                {acceptedGuidelines && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
              <Text style={styles.checkboxText}>
                أوافق على اتباع <Text style={styles.link}>إرشادات المجتمع</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            title="إكمال التسجيل 🎉"
            onPress={handleContinue}
            disabled={!allAccepted}
            variant="gradient"
          />
        </View>
      </ScrollView>
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
    lineHeight: 24,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing(2.5),
    marginBottom: spacing(2),
  },
  labelRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing(2),
  },
  label: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: spacing(2),
  },
  value: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '700',
  },
  ageRangeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing(2),
  },
  ageControl: {
    flex: 1,
    alignItems: 'center',
  },
  ageControlLabel: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: spacing(1),
    textAlign: 'center',
    fontWeight: '500',
  },
  ageValueRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing(1),
  },
  ageButtonCompact: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  ageValueBox: {
    minWidth: 50,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  ageValueText: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  ageSeparator: {
    paddingHorizontal: spacing(1),
  },
  slider: {
    width: '100%',
    height: 40,
  },
  distanceLabels: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginTop: spacing(0.5),
  },
  distanceLabelText: {
    color: colors.muted,
    fontSize: 12,
  },
  hint: {
    backgroundColor: colors.card,
    padding: spacing(2),
    borderRadius: radii.lg,
    marginTop: spacing(2),
  },
  hintText: {
    color: colors.subtext,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  termsSection: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing(2.5),
    marginTop: spacing(3),
  },
  termsHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: spacing(2),
    justifyContent: 'center',
  },
  termsTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginRight: spacing(1.5),
    textAlign: 'right',
  },
  checkboxRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: spacing(2),
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing(1.5),
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkboxText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    textAlign: 'right',
  },
  link: {
    color: colors.accent,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footer: {
    marginTop: spacing(3),
    paddingTop: spacing(2),
  },
});

