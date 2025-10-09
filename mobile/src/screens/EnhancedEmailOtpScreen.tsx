import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableWithoutFeedback, 
  Keyboard, 
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity
} from 'react-native';
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
      setSuccess(null);
      setLoading(true);
      
      // Client-side validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { 
        setError('⚠️ البريد الإلكتروني غير صالح. يرجى التحقق من العنوان'); 
        setLoading(false);
        return; 
      }

      // Send isSignup flag to indicate this is a signup flow
      const res = await api.post('/auth/email/request', { 
        email,
        isSignup: true 
      });
      
      // Handle response - DON'T prefill OTP in production
      setStage('verify');
      setSuccess(res.data.message || '✅ تم إرسال رمز التحقق إلى بريدك!');
      setTimeout(() => setSuccess(null), 3000);
      
      startCooldown(60);
    } catch (err: any) {
      // Handle errors from backend
      const errorData = err.response?.data;
      const status = err.response?.status;

      if (status === 409) {
        // User already exists - redirect to login
        setError(errorData?.message || '⚠️ هذا البريد مسجل مسبقاً. يرجى تسجيل الدخول');
        setTimeout(() => {
          navigation.navigate('Login');
        }, 2000);
      } else if (status === 429) {
        const retryAfter = errorData?.retry_after_seconds || 60;
        setError(errorData?.message || '⏱️ محاولات كثيرة جداً. يرجى الانتظار دقيقة');
        startCooldown(retryAfter);
      } else if (status === 400) {
        setError(errorData?.message || '⚠️ البريد الإلكتروني غير صالح');
      } else if (!navigator.onLine) {
        setError('🌐 لا يوجد اتصال بالإنترنت. يرجى التحقق من اتصالك');
      } else {
        setError(errorData?.message || '❌ تعذر إرسال الرمز. يرجى المحاولة لاحقاً');
      }
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    try {
      setError(null);
      setSuccess(null);
      setLoading(true);
      
      // Client-side validation
      if (!code || code.length < 6) {
        setError('⚠️ يرجى إدخال رمز التحقق كاملاً (6 أرقام)');
        setLoading(false);
        return;
      }

      // Send isSignup flag
      const res = await api.post('/auth/email/verify', { 
        email, 
        code: code,
        isSignup: true
      });
      
      setSuccess(res.data.message || '✅ تم التحقق بنجاح! 🎉');
      
      setTimeout(() => {
        setCurrentUserId(res.data.userId);
      }, 500);
    } catch (err: any) {
      // Handle errors from backend
      const errorData = err.response?.data;
      const status = err.response?.status;

      if (status === 409) {
        // User already exists during verification (edge case)
        setError(errorData?.message || '⚠️ هذا البريد مسجل مسبقاً. يرجى تسجيل الدخول');
        setTimeout(() => {
          navigation.navigate('Login');
        }, 2000);
      } else if (status === 400) {
        setError(errorData?.message || '❌ رمز التحقق غير صحيح أو منتهي الصلاحية');
      } else if (!navigator.onLine) {
        setError('🌐 لا يوجد اتصال بالإنترنت. يرجى التحقق من اتصالك');
      } else {
        setError(errorData?.message || '❌ حدث خطأ أثناء التحقق. يرجى المحاولة مرة أخرى');
      }
    } finally {
      setLoading(false);
    }
  }

  const content = (
    <ScrollView 
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="mail" size={48} color={colors.accent2} />
          </View>
          <Text style={styles.title}>
            {stage === 'request' ? 'التسجيل بالبريد' : 'تأكيد البريد الإلكتروني'}
          </Text>
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
                  onSubmitEditing={request}
                />
              </View>
              
              <View style={styles.hintCard}>
                <Ionicons name="information-circle" size={18} color={colors.info} />
                <Text style={styles.hint}>للتجربة: أي بريد صالح + رمز 123456</Text>
              </View>
              
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
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.emailText}>{email}</Text>
                <TouchableOpacity onPress={() => setStage('request')}>
                  <Ionicons name="pencil" size={18} color={colors.subtext} />
                </TouchableOpacity>
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
                  onSubmitEditing={verify}
                />
              </View>
              
              <View style={styles.hintCard}>
                <Ionicons name="information-circle" size={18} color={colors.info} />
                <Text style={styles.hint}>رمز التجربة: 123456</Text>
              </View>
              
              <Button 
                title={loading ? 'جاري التحقق...' : 'تأكيد وتسجيل الدخول'} 
                onPress={verify} 
                disabled={loading} 
              />
              
              <TouchableOpacity 
                onPress={cooldownSeconds > 0 ? undefined : request}
                disabled={cooldownSeconds > 0 || loading}
              >
                <Text style={styles.resendText}>
                  لم تستلم الرمز؟{' '}
                  <Text style={[
                    styles.resendLink, 
                    (cooldownSeconds > 0 || loading) && styles.resendDisabled
                  ]}>
                    {cooldownSeconds > 0 
                      ? `إعادة إرسال (${cooldownSeconds}ث)` 
                      : 'إعادة إرسال'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.messageContainer}>
          <ErrorMessage message={error} type="error" />
          <ErrorMessage message={success} type="success" />
        </View>

        {stage === 'request' && (
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerText}>
                لديك حساب بالفعل؟{' '}
                <Text style={styles.footerLink}>تسجيل الدخول</Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );

  return (
    <GradientBackground colors={gradients.screen}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
      >
        {Platform.OS === 'web' ? content : (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            {content}
          </TouchableWithoutFeedback>
        )}
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  keyboardView: { 
    flex: 1 
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing(8), // Extra bottom padding for keyboard
  },
  container: { 
    flex: 1, 
    padding: spacing(3), 
    justifyContent: 'space-between',
    paddingBottom: spacing(4),
  },
  header: { 
    alignItems: 'center', 
    marginTop: spacing(2),
    marginBottom: spacing(2),
  },
  iconContainer: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: colors.card, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: spacing(2),
    borderWidth: 2,
    borderColor: colors.border,
  },
  title: { 
    color: colors.text, 
    textAlign: 'center', 
    fontSize: 26, 
    fontWeight: '700', 
    marginBottom: spacing(1) 
  },
  subtitle: { 
    color: colors.subtext, 
    textAlign: 'center', 
    fontSize: 14, 
    paddingHorizontal: spacing(2),
    lineHeight: 20,
  },
  form: { 
    flex: 1,
  },
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
  inputIcon: { 
    marginLeft: spacing(1) 
  },
  input: { 
    flex: 1, 
    color: colors.text, 
    fontSize: 16, 
    textAlign: 'right',
    paddingRight: spacing(1)
  },
  hintCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing(1.5),
    borderRadius: radii.md,
    marginBottom: spacing(2),
    gap: spacing(1),
    borderWidth: 1,
    borderColor: colors.border,
  },
  hint: { 
    color: colors.subtext, 
    fontSize: 13,
    flex: 1,
  },
  emailDisplay: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    padding: spacing(1.5),
    borderRadius: radii.md,
    marginBottom: spacing(2),
    gap: spacing(1),
    borderWidth: 1,
    borderColor: colors.border,
  },
  emailText: { 
    color: colors.text, 
    fontSize: 16, 
    fontWeight: '600' 
  },
  resendText: { 
    color: colors.subtext, 
    textAlign: 'center', 
    marginTop: spacing(2), 
    fontSize: 14 
  },
  resendLink: { 
    color: colors.accent, 
    fontWeight: '600' 
  },
  resendDisabled: { 
    color: colors.muted 
  },
  messageContainer: {
    minHeight: 60,
    marginTop: spacing(2),
    marginBottom: spacing(2),
  },
  footer: {
    alignItems: 'center',
    paddingTop: spacing(2),
    paddingBottom: spacing(2),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    color: colors.subtext,
    fontSize: 14,
    textAlign: 'center',
  },
  footerLink: {
    color: colors.accent,
    fontWeight: '700',
  },
});
