import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radii } from '../../theme';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import GradientBackground from '../../components/ui/GradientBackground';
import { getClient } from '../../api/client';

type Icebreaker = {
  prompt: string;
  answer: string;
  type: 'text' | 'voice';
};

type Step7Props = {
  onComplete: (data: { icebreakers: Icebreaker[] }) => void;
  onBack: () => void;
};

export default function Step7Icebreakers({ onComplete, onBack }: Step7Props) {
  const insets = useSafeAreaInsets();
  const [icebreakers, setIcebreakers] = useState<Icebreaker[]>([]);
  const [prompts, setPrompts] = useState<string[]>([]);

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const api = getClient();
      const res = await api.get('/onboarding/options');
      setPrompts(res.data.arabic_icebreaker_prompts || []);
    } catch (e) {
      console.error('Failed to load options', e);
    }
  };

  const addIcebreaker = (prompt: string) => {
    if (icebreakers.length >= 3) return;
    if (icebreakers.some(ib => ib.prompt === prompt)) return;
    
    setIcebreakers([...icebreakers, { prompt, answer: '', type: 'text' }]);
  };

  const removeIcebreaker = (index: number) => {
    setIcebreakers(icebreakers.filter((_, i) => i !== index));
  };

  const updateAnswer = (index: number, answer: string) => {
    const updated = [...icebreakers];
    updated[index].answer = answer;
    setIcebreakers(updated);
  };

  const availablePrompts = prompts.filter(
    prompt => !icebreakers.some(ib => ib.prompt === prompt)
  );

  const canContinue = true; // Always allow continue (optional)

  const handleContinue = () => {
    onComplete({ icebreakers });
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing(2), paddingBottom: insets.bottom + spacing(2) }]} 
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <ProgressBar current={7} total={8} />
            <Text style={styles.step}>الخطوة 7 من 8</Text>
          </View>

          <View style={styles.content}>
            <View style={styles.titleRow}>
              <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <Ionicons name="arrow-forward" size={28} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.title}>أسئلة تمهيدية</Text>
            </View>
            <Text style={styles.subtitle}>
              أجب على 0-3 أسئلة للمساعدة في بدء محادثات هادفة (اختياري)
            </Text>

            {/* Selected Icebreakers */}
            {icebreakers.map((icebreaker, index) => (
              <View key={index} style={styles.icebreakerCard}>
                <View style={styles.icebreakerHeader}>
                  <Text style={styles.promptText}>{icebreaker.prompt}</Text>
                  <TouchableOpacity onPress={() => removeIcebreaker(index)}>
                    <Ionicons name="close-circle" size={24} color={colors.danger} />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.answerInput}
                  value={icebreaker.answer}
                  onChangeText={(text) => updateAnswer(index, text)}
                  placeholder="اكتب إجابتك..."
                  placeholderTextColor={colors.muted}
                  multiline
                  maxLength={300}
                />
                <Text style={styles.charCount}>{icebreaker.answer.length} / 300</Text>
              </View>
            ))}

            {/* Available Prompts */}
            {icebreakers.length < 3 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>
                  اختر سؤال ({icebreakers.length}/3)
                </Text>
                <View style={styles.promptsList}>
                  {availablePrompts.map((prompt) => (
                    <TouchableOpacity
                      key={prompt}
                      style={styles.promptButton}
                      onPress={() => addIcebreaker(prompt)}
                    >
                      <Text style={styles.promptButtonText}>{prompt}</Text>
                      <Ionicons name="add-circle" size={20} color={colors.accent} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.hint}>
              <Text style={styles.hintText}>
                💡 يمكنك تخطي هذه الخطوة أو إضافة بعض الإجابات لمساعدة الآخرين في بدء محادثة معك
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
    lineHeight: 24,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  section: {
    marginBottom: spacing(2),
  },
  sectionLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing(1.5),
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  icebreakerCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing(2),
    marginBottom: spacing(2),
    borderWidth: 1,
    borderColor: colors.border,
  },
  icebreakerHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing(1.5),
  },
  promptText: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginRight: spacing(1),
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  answerInput: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing(1.5),
    color: colors.text,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  charCount: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'right',
    marginTop: spacing(0.5),
  },
  promptsList: {
    gap: spacing(1.5),
  },
  promptButton: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing(2),
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  promptButtonText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    marginRight: spacing(1),
    textAlign: 'right',
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
  footer: {
    marginTop: spacing(3),
    paddingTop: spacing(2),
  },
});

