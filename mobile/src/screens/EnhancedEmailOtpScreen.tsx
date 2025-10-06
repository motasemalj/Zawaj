import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/ui/Button';
import ErrorMessage from '../components/ui/ErrorMessage';
import GradientBackground from '../components/ui/GradientBackground';
import { colors, spacing, radii, gradients } from '../theme';
import { getClient, useApiState } from '../api/client';

export default function EnhancedEmailOtpScreen({ navigation }: any) {
  const api = getClient();
  const { setCurrentUserId } = useApiState();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'request'|'verify'>('request');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
    };
  }, []);

  function startCooldown(seconds: number) {
    setCooldownSeconds(seconds);
    cooldownTimerRef.current = setInterval(() => {
      setCooldownSeconds(prev => {
        if (prev <= 1) {
          if (cooldownTimerRef.current) {
            clearInterval(cooldownTimerRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function request() {
    try {
      setError(null);
      setLoading(true);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { 
        setError('البريد الإلكتروني غير صالح'); 
        setLoading(false);
        return; 
      }
      const res = await api.post('/auth/email/request', { email });
      setCode(res.data.dev_code || '');
      setStage('verify');
      setSuccess('تم إرسال الرمز بنجاح! تحقق من بريدك');
      setTimeout(() => setSuccess(null), 3000);
      startCooldown(60); // Start 60 second cooldown
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError('يرجى الانتظار دقيقة واحدة قبل إعادة المحاولة');
        startCooldown(60);
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || 'تعذر إرسال الرمز. يرجى المحاولة لاحقاً');
      }
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    try {
      setError(null);
      setLoading(true);
      if (!code || code.length < 4) {
        setError('يرجى إدخال رمز التحقق كاملاً');
        setLoading(false);
        return;
      }
      const res = await api.post('/auth/email/verify', { email, code: code || '000000' });
      setCurrentUserId(res.data.userId);
      setSuccess('تم التحقق بنجاح! 🎉');
    } catch (err: any) {
      setError(err.response?.data?.message || 'الرمز غير صحيح أو منتهي الصلاحية');
    } finally {
      setLoading(false);
    }
  }

  const content = (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="mail" size={48} color={colors.accent} />
        </View>
        <Text style={styles.title}>تسجيل الدخول بالبريد</Text>
        <Text style={styles.subtitle}>
          {stage === 'request' 
            ? 'أدخل بريدك الإلكتروني وسنرسل لك رمز التحقق'
            : 'أدخل الرمز المرسل إلى بريدك الإلكتروني'}
        </Text>
      </View>

      <View style={styles.form}>
        {stage === 'request' ? (
          <>
            <View style={styles.inputContainer}>
              <Ionicons name="at" size={20} color={colors.subtext} style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="example@email.com" 
                keyboardType="email-address" 
                autoCapitalize="none"
                value={email} 
                onChangeText={setEmail} 
                returnKeyType="done"
                placeholderTextColor={colors.muted}
                editable={!loading}
              />
            </View>
            <Text style={styles.hint}>💡 للتجربة: أي بريد صالح + رمز 123456</Text>
            <Button 
              title={
                cooldownSeconds > 0 
                  ? `انتظر ${cooldownSeconds} ثانية` 
                  : loading 
                    ? 'جاري الإرسال...' 
                    : 'إرسال رمز التحقق'
              } 
              onPress={request} 
              disabled={loading || cooldownSeconds > 0} 
            />
          </>
        ) : (
          <>
            <View style={styles.emailDisplay}>
              <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
              <Text style={styles.emailText}>{email}</Text>
              <TouchableWithoutFeedback onPress={() => setStage('request')}>
                <Ionicons name="pencil" size={18} color={colors.subtext} />
              </TouchableWithoutFeedback>
            </View>
            
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={20} color={colors.subtext} style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="رمز التحقق (6 أرقام)" 
                keyboardType="number-pad" 
                value={code} 
                onChangeText={setCode} 
                returnKeyType="done"
                placeholderTextColor={colors.muted}
                maxLength={6}
                editable={!loading}
                autoFocus
              />
            </View>
            
            <Text style={styles.hint}>🔐 رمز التجربة: 123456</Text>
            
            <Button title={loading ? 'جاري التحقق...' : 'تأكيد وتسجيل الدخول'} onPress={verify} disabled={loading} />
            
            <TouchableWithoutFeedback onPress={cooldownSeconds > 0 ? undefined : request}>
              <Text style={styles.resendText}>
                لم تستلم الرمز؟ {' '}
                <Text style={[styles.resendLink, cooldownSeconds > 0 && styles.resendDisabled]}>
                  {cooldownSeconds > 0 ? `إعادة إرسال (${cooldownSeconds}ث)` : 'إعادة إرسال'}
                </Text>
              </Text>
            </TouchableWithoutFeedback>
          </>
        )}
      </View>

      <ErrorMessage message={error} type="error" />
      <ErrorMessage message={success} type="success" />
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
  container: { flex: 1, padding: spacing(3), justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: spacing(4) },
  iconContainer: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: colors.card, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: spacing(2)
  },
  title: { color: colors.text, textAlign: 'center', fontSize: 26, fontWeight: '700', marginBottom: spacing(1) },
  subtitle: { color: colors.subtext, textAlign: 'center', fontSize: 14, paddingHorizontal: spacing(2) },
  form: { marginBottom: spacing(2) },
  inputContainer: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    backgroundColor: colors.surface, 
    borderRadius: radii.lg, 
    height: 56, 
    paddingHorizontal: spacing(2), 
    marginBottom: spacing(2),
    borderWidth: 1,
    borderColor: colors.border
  },
  inputIcon: { marginLeft: spacing(1) },
  input: { 
    flex: 1, 
    color: colors.text, 
    fontSize: 16, 
    textAlign: 'right',
    paddingRight: spacing(1)
  },
  hint: { color: colors.subtext, fontSize: 13, textAlign: 'center', marginBottom: spacing(2) },
  emailDisplay: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    padding: spacing(1.5),
    borderRadius: radii.md,
    marginBottom: spacing(2),
    gap: spacing(1)
  },
  emailText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  resendText: { color: colors.subtext, textAlign: 'center', marginTop: spacing(2), fontSize: 14 },
  resendLink: { color: colors.accent, fontWeight: '600' },
  resendDisabled: { color: colors.muted },
});
