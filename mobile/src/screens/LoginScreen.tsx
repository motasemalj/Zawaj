import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, radii, spacing } from '../theme';
import GradientBackground from '../components/ui/GradientBackground';
import Button from '../components/ui/Button';
import ErrorMessage from '../components/ui/ErrorMessage';
import { getClient, useApiState } from '../api/client';
import { initializeFirebaseForUser } from '../services/firebase/init';

export default function LoginScreen({ navigation }: any) {
  const api = getClient();
  const { setCurrentUserId } = useApiState();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [requested, setRequested] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Quick dev login - use a real user ID from the database
  async function quickDevLogin() {
    try {
      setError(null);
      setSuccess('تم تسجيل الدخول بنجاح! 🎉');
      
      // Initialize Firebase for the dev user
      const userId = 'cmgayry8d0000m7ygso92wqra'; // أحمد محمد
      const email = `${userId}@zawaj.app`; // Match backend Firebase email mapping
      
      try {
        await initializeFirebaseForUser(userId, email);
        console.log('✅ Firebase initialized for dev user');
      } catch (firebaseError) {
        console.error('❌ Firebase initialization failed:', firebaseError);
        // Don't fail login if Firebase fails
      }
      
      setTimeout(() => {
        setCurrentUserId(userId);
      }, 500);
    } catch (e: any) {
      setError('فشل تسجيل الدخول السريع. يرجى المحاولة مرة أخرى.');
    }
  }

  async function request() {
    try {
      setError(null);
      setSuccess(null);
      setLoading(true);
      
      const normalized = phone.replace(/\D/g, '');
      
      if (!/^\d{8,15}$/.test(normalized)) {
        setError('رقم الهاتف غير صالح. يجب أن يحتوي على 8-15 رقماً');
        setLoading(false);
        return;
      }

      // Send isSignup: false to indicate this is a login flow
      const res = await api.post('/auth/otp/request', { 
        phone: normalized,
        isSignup: false 
      });
      
      setRequested(true);
      setSuccess('✅ تم إرسال رمز التحقق بنجاح!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      const errorMsg = e.response?.data?.message || e.response?.data?.error;
      
      if (e.response?.status === 429) {
        setError('⏱️ يرجى الانتظار دقيقة قبل إعادة المحاولة');
      } else if (e.response?.status === 404) {
        setError('❌ لا يوجد حساب مرتبط بهذا الرقم. يرجى إنشاء حساب جديد');
        setTimeout(() => {
          navigation.navigate('SignupMethod');
        }, 2000);
      } else if (errorMsg) {
        setError(errorMsg);
      } else {
        setError('❌ تعذر إرسال الرمز. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى');
      }
    } finally {
      setLoading(false);
    }
  }

  async function verifyNow() {
    try {
      setError(null);
      setSuccess(null);
      setLoading(true);
      
      if (!code || code.length < 6) {
        setError('يرجى إدخال رمز التحقق كاملاً (6 أرقام)');
        setLoading(false);
        return;
      }

      const normalized = phone.replace(/\D/g, '');
      
      // Send isSignup: false for login
      const res = await api.post('/auth/otp/verify', { 
        phone: normalized, 
        code: code,
        isSignup: false
      });
      
      setSuccess('✅ تم تسجيل الدخول بنجاح! 🎉');
      
      // Initialize Firebase for the logged-in user
      const userId = res.data.userId;
      const userEmail = res.data.email || `${userId}@zawaj.app`; // Use provided email or generate one
      
      try {
        await initializeFirebaseForUser(userId, userEmail);
        console.log('✅ Firebase initialized for user:', userId);
      } catch (firebaseError) {
        console.error('❌ Firebase initialization failed:', firebaseError);
        // Don't fail login if Firebase fails
      }
      
      setTimeout(() => {
        setCurrentUserId(userId);
      }, 500);
    } catch (e: any) {
      const errorMsg = e.response?.data?.message || e.response?.data?.error;
      
      if (e.response?.status === 400) {
        setError('❌ رمز التحقق غير صحيح أو منتهي الصلاحية. يرجى المحاولة مرة أخرى');
      } else if (e.response?.status === 404) {
        setError('❌ لا يوجد حساب مرتبط بهذا الرقم. يرجى إنشاء حساب جديد');
      } else if (errorMsg) {
        setError(errorMsg);
      } else {
        setError('❌ حدث خطأ أثناء التحقق. يرجى المحاولة مرة أخرى');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <GradientBackground colors={gradients.screen}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.container}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <Ionicons name="log-in" size={48} color={colors.accent} />
                </View>
                <Text style={styles.brand}>زواج</Text>
                <Text style={styles.title}>تسجيل الدخول</Text>
                <Text style={styles.subtitle}>
                  {!requested 
                    ? 'أدخل رقم هاتفك لتسجيل الدخول' 
                    : 'أدخل رمز التحقق المرسل إلى هاتفك'}
                </Text>
              </View>

              {/* Form */}
              <View style={styles.form}>
                {!requested ? (
                  <>
                    <View style={styles.inputContainer}>
                      <Ionicons name="call" size={20} color={colors.subtext} style={styles.inputIcon} />
                      <TextInput 
                        style={styles.input} 
                        placeholder="رقم الهاتف (مثال: +962791234567)" 
                        keyboardType="phone-pad" 
                        value={phone} 
                        onChangeText={setPhone} 
                        placeholderTextColor={colors.muted}
                        returnKeyType="done"
                        editable={!loading}
                        onSubmitEditing={request}
                      />
                    </View>
                    
                    <View style={styles.hintCard}>
                      <Ionicons name="information-circle" size={18} color={colors.info} />
                      <Text style={styles.hint}>للتجربة: أي رقم صالح + رمز 123456</Text>
                    </View>
                    
                    <Button 
                      title={loading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'} 
                      onPress={request}
                      disabled={loading}
                    />
                  </>
                ) : (
                  <>
                    <View style={styles.phoneDisplay}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                      <Text style={styles.phoneText}>{phone}</Text>
                      <TouchableOpacity onPress={() => setRequested(false)}>
                        <Ionicons name="pencil" size={18} color={colors.subtext} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.inputContainer}>
                      <Ionicons name="lock-closed" size={20} color={colors.subtext} style={styles.inputIcon} />
                      <TextInput 
                        style={styles.input} 
                        placeholder="أدخل الرمز (6 أرقام)" 
                        keyboardType="number-pad" 
                        value={code} 
                        onChangeText={setCode} 
                        placeholderTextColor={colors.muted}
                        returnKeyType="done"
                        maxLength={6}
                        editable={!loading}
                        autoFocus
                        onSubmitEditing={verifyNow}
                      />
                    </View>
                    
                    <View style={styles.hintCard}>
                      <Ionicons name="information-circle" size={18} color={colors.info} />
                      <Text style={styles.hint}>يمكنك استخدام 123456 للتجربة</Text>
                    </View>
                    
                    <Button 
                      title={loading ? 'جاري التحقق...' : 'تأكيد وتسجيل الدخول'} 
                      onPress={verifyNow}
                      disabled={loading}
                    />

                    <TouchableOpacity onPress={request} disabled={loading}>
                      <Text style={styles.resendText}>
                        لم تستلم الرمز؟{' '}
                        <Text style={styles.resendLink}>إعادة إرسال</Text>
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {/* Messages */}
              <View style={styles.messageContainer}>
                <ErrorMessage message={error} type="error" />
                <ErrorMessage message={success} type="success" />
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <TouchableOpacity onPress={() => navigation.navigate('SignupMethod')}>
                  <Text style={styles.footerText}>
                    ليس لديك حساب؟{' '}
                    <Text style={styles.footerLink}>إنشاء حساب جديد</Text>
                  </Text>
                </TouchableOpacity>

                {/* Development quick login */}
                {__DEV__ && (
                  <TouchableOpacity onPress={quickDevLogin} style={styles.devButton}>
                    <Ionicons name="flash" size={16} color={colors.accent2} />
                    <Text style={styles.devButtonText}>تسجيل دخول سريع (تطوير)</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing(4),
  },
  container: { 
    flex: 1, 
    padding: spacing(3), 
    justifyContent: 'space-between',
    paddingBottom: spacing(2),
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
  brand: { 
    color: colors.accent, 
    fontSize: 42, 
    fontWeight: '900', 
    marginBottom: spacing(1),
    textShadowColor: 'rgba(254, 60, 114, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  title: { 
    color: colors.text, 
    fontSize: 24, 
    fontWeight: '700',
    marginBottom: spacing(1),
  },
  subtitle: {
    color: colors.subtext,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: spacing(2),
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
    borderColor: colors.border,
  },
  inputIcon: {
    marginLeft: spacing(1),
  },
  input: { 
    flex: 1,
    color: colors.text,
    fontSize: 16,
    textAlign: 'right',
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
  phoneDisplay: {
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
  phoneText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  resendText: {
    color: colors.subtext,
    textAlign: 'center',
    marginTop: spacing(2),
    fontSize: 14,
  },
  resendLink: {
    color: colors.accent,
    fontWeight: '600',
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
  devButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.5),
    borderRadius: radii.md,
    marginTop: spacing(2),
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing(1),
  },
  devButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
});
