import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import { colors, gradients, radii, spacing } from '../theme';
import GradientBackground from '../components/ui/GradientBackground';
import Button from '../components/ui/Button';
import ErrorMessage from '../components/ui/ErrorMessage';
import { getClient, useApiState } from '../api/client';

export default function LoginScreen({ navigation }: any) {
  const api = getClient();
  const { setCurrentUserId } = useApiState();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [requested, setRequested] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick dev login - use a real user ID from the database
  async function quickDevLogin() {
    try {
      setError(null);
      // Use the first male user from our seeded data
      setCurrentUserId('cmgayry8d0000m7ygso92wqra'); // أحمد محمد
    } catch (e: any) {
      setError('فشل تسجيل الدخول السريع');
    }
  }

  async function request() {
    try {
      setError(null);
      const normalized = phone.replace(/\D/g, '');
      const res = await api.post('/auth/otp/request', { phone: normalized });
      setCode(res.data.dev_code || '');
      setRequested(true);
    } catch (e: any) {
      setError('تعذر إرسال الرمز');
    }
  }

  async function verifyNow() {
    try {
      setError(null);
      const normalized = phone.replace(/\D/g, '');
      const res = await api.post('/auth/otp/verify', { phone: normalized, code: code || '000000' });
      setCurrentUserId(res.data.userId);
      // Navigation will automatically switch to logged-in stack
    } catch (e: any) {
      setError('الرمز غير صحيح أو منتهي. جرّب 000000');
    }
  }

  const content = (
    <View style={styles.container}>
      <Text style={styles.brand}>زواج</Text>
      <Text style={styles.title}>تسجيل الدخول</Text>
      <TextInput style={styles.input} placeholder="رقم الهاتف" keyboardType="phone-pad" value={phone} onChangeText={setPhone} placeholderTextColor={colors.muted} returnKeyType="done" />
      {!requested ? (
        <Button title="إرسال رمز" onPress={request} />
      ) : (
        <>
          <TextInput style={styles.input} placeholder="أدخل الرمز (يمكن 000000)" keyboardType="number-pad" value={code} onChangeText={setCode} placeholderTextColor={colors.muted} returnKeyType="done" />
          <Button title="تأكيد" onPress={verifyNow} />
        </>
      )}
      <ErrorMessage message={error} type="error" />
      <Text style={styles.hint}>للتجربة السريعة يمكنك استخدام 000000</Text>
      
      {/* Development quick login */}
      <TouchableOpacity onPress={quickDevLogin} style={styles.devButton}>
        <Text style={styles.devButtonText}>تسجيل دخول سريع (تطوير)</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <GradientBackground colors={gradients.screen}>
      {Platform.OS === 'web' ? content : (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          {content}
        </TouchableWithoutFeedback>
      )}
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing(2), justifyContent: 'center' },
  brand: { color: colors.accent, fontSize: 42, fontWeight: '800', textAlign: 'center', marginBottom: spacing(1) },
  title: { color: colors.text, fontSize: 22, textAlign: 'center', marginBottom: spacing(2) },
  input: { backgroundColor: colors.surface, color: colors.text, borderRadius: radii.lg, height: 48, paddingHorizontal: spacing(2), marginBottom: spacing(2), textAlign: 'right' },
  hint: { color: colors.subtext, textAlign: 'center', marginTop: spacing(1) },
  devButton: {
    backgroundColor: colors.surface,
    padding: spacing(2),
    borderRadius: radii.md,
    marginTop: spacing(3),
    borderWidth: 1,
    borderColor: colors.border,
  },
  devButtonText: {
    color: colors.text,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
});

