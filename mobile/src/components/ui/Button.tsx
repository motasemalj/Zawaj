import React from 'react';
import { Text, TouchableOpacity, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radii, spacing } from '../../theme';

type ButtonProps = {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'solid' | 'outline' | 'ghost' | 'gradient';
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export default function Button({ title, onPress, loading, disabled, variant = 'gradient', style, textStyle }: ButtonProps) {
  const isDisabled = disabled || loading;
  if (variant === 'gradient') {
    return (
      <TouchableOpacity
        disabled={isDisabled}
        onPress={onPress}
        style={[{ borderRadius: radii.lg, overflow: 'hidden', opacity: isDisabled ? 0.6 : 1 }, style]}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={gradients.cta as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingVertical: spacing(1.5), paddingHorizontal: spacing(3), alignItems: 'center' }}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={[{ color: '#fff', fontWeight: '700' }, textStyle]}>{title}</Text>}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'outline') {
    return (
      <TouchableOpacity disabled={isDisabled} onPress={onPress} style={[{ paddingVertical: spacing(1.25), paddingHorizontal: spacing(3), alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg }, style]}>
        {loading ? <ActivityIndicator color={colors.text} /> : <Text style={[{ color: colors.text, fontWeight: '700' }, textStyle]}>{title}</Text>}
      </TouchableOpacity>
    );
  }

  if (variant === 'ghost') {
    return (
      <TouchableOpacity disabled={isDisabled} onPress={onPress} style={[{ paddingVertical: spacing(1), paddingHorizontal: spacing(2), alignItems: 'center' }, style]}>
        {loading ? <ActivityIndicator color={colors.text} /> : <Text style={[{ color: colors.text }, textStyle]}>{title}</Text>}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity disabled={isDisabled} onPress={onPress} style={[{ paddingVertical: spacing(1.5), paddingHorizontal: spacing(3), alignItems: 'center', backgroundColor: colors.accent, borderRadius: radii.lg }, style]}>
      {loading ? <ActivityIndicator color="#000" /> : <Text style={[{ color: '#000', fontWeight: '700' }, textStyle]}>{title}</Text>}
    </TouchableOpacity>
  );
}


