import * as Haptics from 'expo-haptics';
import { soundEffects as generatedSounds } from './soundGenerator';

// Haptic feedback functions
export const hapticFeedback = {
  // Light haptic for subtle interactions
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  
  // Medium haptic for button presses
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  
  // Heavy haptic for important actions
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  
  // Success haptic
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  
  // Warning haptic
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  
  // Error haptic
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  
  // Selection haptic for toggles, switches, etc.
  selection: () => Haptics.selectionAsync(),
};

// Sound effects using generated tones
export const soundEffects = generatedSounds;

// Combined feedback for common actions
export const feedback = {
  // Button press with haptic and sound
  buttonPress: async () => {
    hapticFeedback.light();
    await soundEffects.button();
  },
  
  // Match with celebration haptic and sound
  match: async () => {
    hapticFeedback.success();
    await soundEffects.match();
  },
  
  // Swipe with subtle feedback
  swipe: async () => {
    hapticFeedback.light();
    await soundEffects.swipe();
  },
  
  // Success action
  success: async () => {
    hapticFeedback.success();
    await soundEffects.success();
  },
  
  // Error action
  error: async () => {
    hapticFeedback.error();
    await soundEffects.error();
  },
  
  // Toggle/switch selection
  selection: () => {
    hapticFeedback.selection();
  },
  
  // Important action (like unmatch)
  important: () => {
    hapticFeedback.medium();
  },
};
