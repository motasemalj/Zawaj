import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, shadows } from '../../theme';

type ErrorMessageProps = {
  message: string | null;
  type?: 'error' | 'warning' | 'success';
};

export default function ErrorMessage({ message, type = 'error' }: ErrorMessageProps) {
  if (!message) return null;

  const config = {
    error: { icon: 'alert-circle' as const, color: '#ef4444', bg: '#7f1d1d' },
    warning: { icon: 'warning' as const, color: '#f59e0b', bg: '#78350f' },
    success: { icon: 'checkmark-circle' as const, color: '#10b981', bg: '#064e3b' },
  };

  const { icon, color, bg } = config[type];

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.text, { color }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing(1),
    padding: spacing(1.5),
    borderRadius: radii.md,
    marginVertical: spacing(1),
    ...shadows.soft,
  },
  text: {
    flex: 1,
    fontSize: 14,
    textAlign: 'right',
    fontWeight: '500',
  },
});

