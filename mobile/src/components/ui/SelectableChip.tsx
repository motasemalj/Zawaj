import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii, spacing } from '../../theme';
import { LinearGradient } from 'expo-linear-gradient';

type SelectableChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
};

export default function SelectableChip({ label, selected, onPress, style }: SelectableChipProps) {
  if (selected) {
    return (
      <TouchableOpacity onPress={onPress} style={[{ borderRadius: radii.pill, overflow: 'hidden' }, style]}>
        <LinearGradient
          colors={['#fe3c72', '#ff5864']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientChip}
        >
          <Text style={styles.selectedText}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} style={[styles.chip, style]}>
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: radii.pill,
    backgroundColor: colors.chip,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gradientChip: {
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
  },
  text: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  selectedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

