import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../../theme';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import GradientBackground from '../../components/ui/GradientBackground';

type Step2Props = {
  onComplete: (data: { dob: string; height_cm: number }) => void;
  onBack: () => void;
};

export default function Step2DateOfBirth({ onComplete, onBack }: Step2Props) {
  const insets = useSafeAreaInsets();
  const defaultDate = new Date();
  defaultDate.setFullYear(defaultDate.getFullYear() - 25); // Default to 25 years old
  
  const [date, setDate] = useState(defaultDate);
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');
  const [heightCm, setHeightCm] = useState(170); // Default height

  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(date);
  const isValidAge = age >= 18 && age <= 100;

  const handleContinue = () => {
    if (!isValidAge) return;
    onComplete({ 
      dob: date.toISOString().split('T')[0],
      height_cm: heightCm
    });
  };
  
  const heightFeet = Math.floor(heightCm / 30.48);
  const heightInches = Math.round((heightCm / 2.54) % 12);

  const onChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing(2), paddingBottom: insets.bottom + spacing(2) }]}> 
        <View style={styles.header}>
          <ProgressBar current={2} total={8} />
          <Text style={styles.step}>الخطوة 2 من 8</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="arrow-forward" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>معلومات أساسية</Text>
          </View>
          <Text style={styles.subtitle}>أخبرنا عن عمرك وطولك</Text>

          {/* Date of Birth - Ultra Compact */}
          <View style={styles.section}>
            <View style={styles.rowHeader}>
              <View style={styles.ageChip}>
                <Text style={styles.ageChipLabel}>العمر:</Text>
                <Text style={styles.ageChipValue}>{age}</Text>
              </View>
              <View style={styles.headerWithIcon}>
                <Ionicons name="calendar" size={20} color={colors.accent} />
                <Text style={styles.sectionTitle}>تاريخ الميلاد</Text>
              </View>
            </View>
            
            {/* Date Selection */}
            {Platform.OS === 'ios' ? (
              <View style={styles.datePickerWrapper}>
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="spinner"
                  onChange={onChange}
                  maximumDate={new Date()}
                  minimumDate={new Date(1924, 0, 1)}
                  textColor="#FFFFFF"
                  locale="ar"
                  style={styles.iosPicker}
                />
              </View>
            ) : (
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowPicker(true)}>
                <Ionicons name="calendar-outline" size={20} color={colors.accent} />
                <Text style={styles.dateValue}>
                  {date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
                </Text>
              </TouchableOpacity>
            )}
            
            {Platform.OS === 'android' && showPicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="spinner"
                onChange={onChange}
                maximumDate={new Date()}
                minimumDate={new Date(1924, 0, 1)}
              />
            )}
            
            {!isValidAge && (
              <View style={styles.errorBox}>
                <Ionicons name="warning" size={16} color={colors.danger} />
                <Text style={styles.errorText}>عمرك يجب أن يكون 18+</Text>
              </View>
            )}
          </View>

          {/* Height - Compact */}
          <View style={styles.section}>
            <View style={styles.rowHeader}>
              <View style={styles.heightChip}>
                <Text style={styles.heightChipValue}>{heightCm} سم</Text>
                <Text style={styles.heightChipSubtext}>({heightFeet}'{heightInches}")</Text>
              </View>
              <Text style={styles.sectionTitle}>الطول</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={140}
              maximumValue={220}
              step={1}
              value={heightCm}
              onValueChange={setHeightCm}
              minimumTrackTintColor={colors.accent}
              maximumTrackTintColor={colors.chip}
              thumbTintColor={colors.accent}
            />
            <View style={styles.rangeLabels}>
              <Text style={styles.rangeLabel}>140</Text>
              <Text style={styles.rangeLabel}>220</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            title="متابعة"
            onPress={handleContinue}
            disabled={!isValidAge}
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
    lineHeight: 22,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing(2),
    marginBottom: spacing(1.5),
  },
  rowHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing(1.5),
  },
  headerWithIcon: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing(1),
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  ageChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.75),
    borderRadius: radii.md,
    gap: spacing(0.75),
  },
  ageChipLabel: {
    color: colors.muted,
    fontSize: 13,
  },
  ageChipValue: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: '700',
  },
  datePickerWrapper: {
    alignItems: 'center',
  },
  iosPicker: {
    width: '100%',
    height: 140,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
  },
  dateButton: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing(1.5),
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(1.5),
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing(1),
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: spacing(1),
    borderRadius: radii.md,
    marginTop: spacing(1),
  },
  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: 12,
    textAlign: 'right',
  },
  heightChip: {
    flexDirection: 'row-reverse',
    alignItems: 'baseline',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.75),
    borderRadius: radii.md,
    gap: spacing(0.75),
  },
  heightChipValue: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '700',
  },
  heightChipSubtext: {
    color: colors.muted,
    fontSize: 12,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  rangeLabels: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginTop: spacing(0.5),
  },
  rangeLabel: {
    color: colors.muted,
    fontSize: 11,
  },
  footer: {
    marginTop: spacing(3),
    paddingTop: spacing(2),
  },
});

