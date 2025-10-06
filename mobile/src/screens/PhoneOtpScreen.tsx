import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import Button from '../components/ui/Button';
import ErrorMessage from '../components/ui/ErrorMessage';
import { colors, spacing } from '../theme';
import { getClient, useApiState } from '../api/client';

export default function PhoneOtpScreen({ navigation }: any) {
  const api = getClient();
  const { setCurrentUserId } = useApiState();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'request'|'verify'>('request');
  const [error, setError] = useState<string | null>(null);

  async function request() {
    try {
      setError(null);
      const normalized = phone.replace(/\D/g, '');
      if (!/^\d{8,15}$/.test(normalized)) { setError('رقم غير صالح (8-15 أرقام)'); return; }
      const res = await api.post('/auth/otp/request', { phone: normalized });
      setCode(res.data.dev_code || '');
      setStage('verify');
    } catch {
      setError('تعذر إرسال الرمز');
    }
  }

  async function verify() {
    try {
      setError(null);
      const normalized = phone.replace(/\D/g, '');
      const res = await api.post('/auth/otp/verify', { phone: normalized, code: code || '000000' });
      setCurrentUserId(res.data.userId);
      // Navigation will automatically switch to logged-in stack
    } catch {
      setError('الرمز غير صحيح');
    }
  }

  const content = (
    <View style={styles.container}>
      <Text style={styles.title}>الهاتف (OTP)</Text>
      <TextInput style={styles.input} placeholder="رقم الهاتف" keyboardType="phone-pad" value={phone} onChangeText={setPhone} returnKeyType="done" />
      {stage === 'request' ? (
        <Button title="إرسال رمز" onPress={request} />
      ) : (
        <>
          <TextInput style={styles.input} placeholder="أدخل الرمز (جرّب 123456)" keyboardType="number-pad" value={code} onChangeText={setCode} returnKeyType="done" />
          <Button title="تأكيد" onPress={verify} />
        </>
      )}
      <ErrorMessage message={error} type="error" />
    </View>
  );

  return Platform.OS === 'web' ? content : (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      {content}
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing(2), justifyContent: 'center' },
  title: { color: colors.text, textAlign: 'center', fontSize: 20, marginBottom: spacing(2) },
  input: { backgroundColor: colors.surface, color: colors.text, borderRadius: 12, height: 48, paddingHorizontal: spacing(2), marginVertical: spacing(1) },
});


