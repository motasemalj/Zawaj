import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from '../components/ui/Button';
import { colors, spacing } from '../theme';

export default function SignupMethodScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>اختَر طريقة التسجيل</Text>
      <View style={{ height: spacing(1) }} />
      <Button title="الهاتف (OTP)" onPress={() => navigation.navigate('PhoneOTP')} />
      <View style={{ height: spacing(1) }} />
      <Button title="البريد الإلكتروني (OTP)" variant="outline" onPress={() => navigation.navigate('EmailOTP')} />
      <View style={{ height: spacing(1) }} />
      <Button title="Google / Apple" variant="ghost" onPress={() => navigation.navigate('Login')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing(2), justifyContent: 'center' },
  title: { color: colors.text, textAlign: 'center', fontSize: 20, marginBottom: spacing(2) },
});



