import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SelectableChip from './SelectableChip';
import { colors, spacing } from '../../theme';

type MultiSelectProps = {
  options: string[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  maxSelections?: number;
  minSelections?: number;
  label?: string;
};

export default function MultiSelect({ 
  options, 
  selected, 
  onSelectionChange, 
  maxSelections,
  minSelections,
  label 
}: MultiSelectProps) {
  const handlePress = (option: string) => {
    const isSelected = selected.includes(option);
    
    if (isSelected) {
      onSelectionChange(selected.filter(item => item !== option));
    } else {
      if (maxSelections && selected.length >= maxSelections) {
        return; // Don't allow more selections
      }
      onSelectionChange([...selected, option]);
    }
  };

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.counter}>
            {selected.length}{maxSelections ? `/${maxSelections}` : ''}
          </Text>
        </View>
      )}
      <View style={styles.chipsContainer}>
        {options.map((option) => (
          <SelectableChip
            key={option}
            label={option}
            selected={selected.includes(option)}
            onPress={() => handlePress(option)}
            style={styles.chip}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing(2),
  },
  labelRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing(1),
  },
  label: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  counter: {
    color: colors.muted,
    fontSize: 14,
  },
  chipsContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing(1),
  },
  chip: {
    marginBottom: spacing(1),
  },
});

