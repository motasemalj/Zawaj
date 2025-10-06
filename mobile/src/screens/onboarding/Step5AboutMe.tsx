import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../../theme';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import GradientBackground from '../../components/ui/GradientBackground';
import { getClient } from '../../api/client';

type Step5Props = {
  onComplete: (data: {
    bio: string;
    ethnicity: string[];
    marriage_timeline: string;
    sect: string;
    children_preference: string;
    want_children: string;
    relocate: boolean;
    religiousness?: number;
    prayer_freq?: string;
  }) => void;
  onBack: () => void;
  initialData?: any;
};

export default function Step5AboutMe({ onComplete, onBack, initialData }: Step5Props) {
  const [bio, setBio] = useState(initialData?.bio || '');
  const [selectedOrigins, setSelectedOrigins] = useState<string[]>(
    Array.isArray(initialData?.ethnicity) ? initialData.ethnicity : (initialData?.ethnicity ? [initialData.ethnicity] : [])
  );
  const [marriageTimeline, setMarriageTimeline] = useState(initialData?.marriage_timeline || '');
  const [sect, setSect] = useState(initialData?.sect || '');
  const [hasChildren, setHasChildren] = useState(initialData?.children_preference || '');
  const [wantChildren, setWantChildren] = useState(initialData?.want_children || '');
  const [relocate, setRelocate] = useState<boolean | null>(initialData?.relocate !== undefined ? initialData.relocate : null);
  const [religiousness, setReligiousness] = useState<number>(initialData?.religiousness || 3);
  const [prayerFreq, setPrayerFreq] = useState<string>(initialData?.prayer_freq || '');
  const [options, setOptions] = useState<any>({});
  const insets = useSafeAreaInsets();

  const MAX_ORIGINS = 2;

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

  const toggleOrigin = (countryName: string) => {
    if (selectedOrigins.includes(countryName)) {
      setSelectedOrigins(selectedOrigins.filter(o => o !== countryName));
    } else if (selectedOrigins.length < MAX_ORIGINS) {
      setSelectedOrigins([...selectedOrigins, countryName]);
    }
  };

  const canContinue = 
    selectedOrigins.length > 0 &&
    marriageTimeline &&
    sect &&
    hasChildren &&
    wantChildren &&
    relocate !== null;

  const handleContinue = () => {
    if (!canContinue) return;
    onComplete({
      bio,
      ethnicity: selectedOrigins,
      marriage_timeline: marriageTimeline,
      sect,
      children_preference: hasChildren,
      want_children: wantChildren,
      relocate: relocate!,
      religiousness,
      prayer_freq: prayerFreq,
    });
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
            <ScrollView 
              contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + spacing(4), paddingTop: insets.top + spacing(2) + spacing(1) }]} 
              keyboardShouldPersistTaps="handled"
              scrollEventThrottle={16}
              bounces={true}
              keyboardDismissMode="on-drag"
            >
          <View style={styles.header}>
            <ProgressBar current={5} total={8} />
            <Text style={styles.step}>الخطوة 5 من 8</Text>
          </View>

          <View style={styles.content}>
            <View style={styles.titleRow}>
              <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <Ionicons name="arrow-forward" size={28} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.title}>عنك وقيمك</Text>
            </View>
            <Text style={styles.subtitle}>شارك قيمك وتطلعاتك للمستقبل</Text>

            {/* Bio */}
            <View style={styles.section}>
              <Text style={styles.label}>عني (اختياري)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="اكتب نبذة مختصرة عن نفسك..."
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={4}
                returnKeyType="done"
                blurOnSubmit={true}
              />
            </View>

            {/* Arabic Origin */}
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>الأصل</Text>
                <Text style={styles.originCounter}>
                  {selectedOrigins.length} / {MAX_ORIGINS}
                </Text>
              </View>
              <Text style={styles.hint}>اختر دولة واحدة أو دولتين</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.originScroll}
                contentContainerStyle={styles.originScrollContent}
                nestedScrollEnabled={true}
                scrollEventThrottle={16}
                inverted
              >
                {(options.arabic_origins || []).map((country: any) => {
                  const isSelected = selectedOrigins.includes(country.name);
                  return (
                    <TouchableOpacity
                      key={country.code}
                      style={[styles.originChip, isSelected && styles.originChipActive]}
                      onPress={() => toggleOrigin(country.name)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.originName, isSelected && styles.originNameActive]}>
                        {country.name} {country.flag}
                      </Text>
                      {isSelected && (
                        <View style={styles.originCheckmark}>
                          <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Prayer Frequency */}
            <View style={styles.section}>
              <Text style={styles.label}>التزام الصلاة</Text>
              <View style={styles.chipRow}>
                {(options.arabic_prayer_frequencies || ['دائماً','غالباً','أحياناً','نادراً']).map((pf: string) => (
                  <TouchableOpacity
                    key={pf}
                    style={[styles.chip, prayerFreq === pf && styles.chipActive]}
                    onPress={() => setPrayerFreq(pf)}
                  >
                    <Text style={[styles.chipText, prayerFreq === pf && styles.chipTextActive]}>
                      {pf}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Religiousness (Word Scale) */}
            <View style={styles.section}>
              <Text style={styles.label}>الالتزام الديني</Text>
              <View style={styles.religiousnessRow}>
                {[
                  { v: 1, t: 'منخفض' },
                  { v: 2, t: 'متوسط' },
                  { v: 3, t: 'جيّد' },
                  { v: 4, t: 'عالي' },
                ].map(({ v, t }) => (
                  <TouchableOpacity
                    key={v}
                    onPress={() => setReligiousness(v)}
                    style={[styles.wordPill, religiousness === v && styles.wordPillActive]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.wordPillText, religiousness === v && styles.wordPillTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Marriage Timeline */}
            <View style={styles.section}>
              <Text style={styles.label}>أتطلع للزواج</Text>
              <View style={styles.chipColumn}>
                {(options.marriage_timelines || []).map((timeline: string) => (
                  <TouchableOpacity
                    key={timeline}
                    style={[styles.optionButton, marriageTimeline === timeline && styles.optionButtonActive]}
                    onPress={() => setMarriageTimeline(timeline)}
                  >
                    <Text style={[styles.optionText, marriageTimeline === timeline && styles.optionTextActive]}>
                      {timeline}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sect */}
            <View style={styles.section}>
              <Text style={styles.label}>المذهب الديني</Text>
              <View style={styles.chipRow}>
                {(options.sects || []).map((sectOption: string) => (
                  <TouchableOpacity
                    key={sectOption}
                    style={[styles.chip, sect === sectOption && styles.chipActive]}
                    onPress={() => setSect(sectOption)}
                  >
                    <Text style={[styles.chipText, sect === sectOption && styles.chipTextActive]}>
                      {sectOption}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Has Children */}
            <View style={styles.section}>
              <Text style={styles.label}>هل لديك أطفال؟</Text>
              <View style={styles.chipRow}>
                {(options.have_children_options || []).map((option: string) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.chip, hasChildren === option && styles.chipActive]}
                    onPress={() => setHasChildren(option)}
                  >
                    <Text style={[styles.chipText, hasChildren === option && styles.chipTextActive]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Want Children */}
            <View style={styles.section}>
              <Text style={styles.label}>هل تريد أطفالاً في المستقبل؟</Text>
              <View style={styles.chipRow}>
                {(options.children_preferences || ['نعم', 'لا', 'ربما']).map((opt: string) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.chip, wantChildren === opt && styles.chipActive]}
                    onPress={() => setWantChildren(opt)}
                  >
                    <Text style={[styles.chipText, wantChildren === opt && styles.chipTextActive]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Relocation */}
            <View style={styles.section}>
              <Text style={styles.label}>هل ستنتقل للخارج من أجل الزواج؟</Text>
              <View style={styles.chipRow}>
                <TouchableOpacity
                  style={[styles.chip, relocate === true && styles.chipActive]}
                  onPress={() => setRelocate(true)}
                >
                  <Text style={[styles.chipText, relocate === true && styles.chipTextActive]}>
                    نعم
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.chip, relocate === false && styles.chipActive]}
                  onPress={() => setRelocate(false)}
                >
                  <Text style={[styles.chipText, relocate === false && styles.chipTextActive]}>
                    لا
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            {!canContinue && (
              <View style={styles.validationHint}>
                <Ionicons name="information-circle" size={18} color={colors.muted} />
                <Text style={styles.validationText}>
                  {selectedOrigins.length === 0 && 'اختر الأصل • '}
                  {!marriageTimeline && 'اختر موعد الزواج • '}
                  {!sect && 'اختر المذهب • '}
                  {!hasChildren && 'هل لديك أطفال؟ • '}
                  {!wantChildren && 'هل تريد أطفالاً؟ • '}
                  {relocate === null && 'هل ستنتقل للخارج؟'}
                </Text>
              </View>
            )}
            <Button
              title="متابعة"
              onPress={handleContinue}
              disabled={!canContinue}
              variant="gradient"
            />
          </View>
          {/* Add extra padding at bottom for iOS safety */}
          {Platform.OS === 'ios' && <View style={{ height: spacing(4) }} />}
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'right',
    marginTop: spacing(0.5),
  },
  scrollView: {
    marginHorizontal: -spacing(3),
    paddingHorizontal: spacing(3),
  },
  chipRow: {
    flexDirection: 'row-reverse',
    gap: spacing(1.5),
    paddingRight: spacing(1),
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
  religiousnessRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing(1),
  },
  levelDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelDotActive: {
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  levelLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  levelLabelActive: {
    color: colors.accent,
  },
  wordPill: {
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: radii.pill,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
  },
  wordPillActive: {
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  wordPillText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  wordPillTextActive: {
    color: colors.accent,
  },
  labelRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing(0.5),
  },
  originCounter: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.5),
    borderRadius: radii.md,
  },
  hint: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: spacing(2),
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  originScroll: {
    marginHorizontal: -spacing(3),
  },
  originScrollContent: {
    paddingHorizontal: spacing(3),
    gap: spacing(1.5),
  },
  originChip: {
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.5),
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.border,
    minWidth: 90,
    position: 'relative',
  },
  originChipActive: {
    backgroundColor: colors.accent + '20',
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  originFlag: {
    fontSize: 32,
    marginBottom: spacing(0.5),
  },
  originName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  originNameActive: {
    color: colors.text,
    fontWeight: '700',
  },
  originCheckmark: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.card,
    borderRadius: radii.full,
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
  },
  optionTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  footer: {
    marginTop: spacing(3),
    paddingTop: spacing(2),
  },
  validationHint: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    padding: spacing(2),
    borderRadius: radii.md,
    marginBottom: spacing(2),
    gap: spacing(1),
  },
  validationText: {
    flex: 1,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});

