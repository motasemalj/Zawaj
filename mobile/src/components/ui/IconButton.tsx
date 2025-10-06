import React from 'react';
import { TouchableOpacity, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, radii, shadows, spacing } from '../../theme';

type IconButtonProps = {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'solid' | 'gradient' | 'ghost' | 'danger' | 'success';
};

export default function IconButton({ name, size = 24, color = '#fff', onPress, style, variant = 'solid' }: IconButtonProps) {
  if (variant === 'gradient') {
    return (
      <TouchableOpacity onPress={onPress} style={[{ borderRadius: radii.pill }, style]}>
        <LinearGradient colors={gradients.super as [string, string, ...string[]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[{ width: 56, height: 56, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' }, shadows.card]}>
          <Ionicons name={name} size={size} color={color} />
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const bg = variant === 'danger' ? colors.danger : variant === 'success' ? colors.success : colors.surface;
  return (
    <TouchableOpacity onPress={onPress} style={[{ width: 56, height: 56, borderRadius: radii.pill, backgroundColor: variant === 'ghost' ? 'transparent' : bg, alignItems: 'center', justifyContent: 'center', borderWidth: variant === 'ghost' ? 1 : 0, borderColor: colors.border }, shadows.soft, style]}>
      <Ionicons name={name} size={size} color={variant === 'ghost' ? colors.text : color} />
    </TouchableOpacity>
  );
}


