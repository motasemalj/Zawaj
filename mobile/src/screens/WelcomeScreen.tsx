import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import GradientBackground from '../components/ui/GradientBackground';
import Button from '../components/ui/Button';
import { colors, spacing } from '../theme';

export default function WelcomeScreen({ navigation }: any) {
  return (
    <GradientBackground>
      <View style={styles.container}>
        <Text style={styles.brand}>زواج</Text>
        <Text style={styles.tagline}>ابحث عن شريك حياتك بطريقة حلال ومحترمة</Text>
        <View style={{ height: spacing(3) }} />
        <Button title="إنشاء حساب" onPress={() => navigation.navigate('SignupMethod')} />
        <View style={{ height: spacing(1) }} />
        <Button title="تسجيل الدخول" variant="outline" onPress={() => navigation.navigate('Login')} />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing(2), alignItems: 'center', justifyContent: 'center' },
  brand: { color: colors.accent, fontSize: 48, fontWeight: '900', writingDirection: 'rtl' },
  tagline: { color: colors.text, textAlign: 'center', marginTop: spacing(1), writingDirection: 'rtl' },
});



