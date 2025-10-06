import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import MultiSelect from '../../components/ui/MultiSelect';
import GradientBackground from '../../components/ui/GradientBackground';
import { getClient } from '../../api/client';

type Step6Props = {
  onComplete: (data: { interests: string[]; personality_traits: string[] }) => void;
  onBack: () => void;
};

export default function Step6InterestsTraits({ onComplete, onBack }: Step6Props) {
  const insets = useSafeAreaInsets();
  const [interests, setInterests] = useState<string[]>([]);
  const [traits, setTraits] = useState<string[]>([]);
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

  const canContinue = true; // Always allow continue (optional)

  const handleContinue = () => {
    onComplete({
      interests,
      personality_traits: traits,
    });
  };

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing(2), paddingBottom: insets.bottom + spacing(2) }]}>
        <View style={styles.header}>
          <ProgressBar current={6} total={8} />
          <Text style={styles.step}>الخطوة 6 من 8</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="arrow-forward" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>اهتماماتك وشخصيتك</Text>
          </View>
          <Text style={styles.subtitle}>
            ساعدنا في مطابقتك مع أشخاص متوافقين (اختياري)
          </Text>

          <View style={styles.section}>
            <MultiSelect
              label="الاهتمامات (0-10)"
              options={options.arabic_interests || []}
              selected={interests}
              onSelectionChange={setInterests}
              minSelections={0}
              maxSelections={10}
            />
          </View>

          <View style={styles.section}>
            <MultiSelect
              label="السمات الشخصية (0-5)"
              options={options.arabic_personality_traits || []}
              selected={traits}
              onSelectionChange={setTraits}
              minSelections={0}
              maxSelections={5}
            />
          </View>

          <View style={styles.hint}>
            <Text style={styles.hintText}>
              💡 يمكنك تخطي هذه الخطوة أو اختيار ما يصفك. هذا يساعد في إنشاء تطابقات أفضل!
            </Text>
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
  hint: {
    backgroundColor: colors.card,
    padding: spacing(2),
    borderRadius: 12,
    marginTop: spacing(2),
  },
  hintText: {
    color: colors.subtext,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  footer: {
    marginTop: spacing(3),
    paddingTop: spacing(2),
  },
});

