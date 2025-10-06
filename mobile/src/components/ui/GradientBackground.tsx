import React, { ReactNode } from 'react';
import { ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '../../theme';

type Props = {
  children?: ReactNode;
  style?: ViewStyle;
  colors?: string[];
};

export default function GradientBackground({ children, style, colors }: Props) {
  return (
    <LinearGradient colors={(colors || gradients.screen) as [string, string, ...string[]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[{ flex: 1 }, style]}>
      {children}
    </LinearGradient>
  );
}


