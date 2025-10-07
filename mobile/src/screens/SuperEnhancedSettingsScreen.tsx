import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  TextInput, 
  Platform, 
  Linking,
  Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { getClient, useApiState } from '../api/client';
import { resetDiscoverySession } from '../api/hooks';
import { colors, spacing, radii, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../components/ui/GradientBackground';
import Button from '../components/ui/Button';
import ErrorMessage from '../components/ui/ErrorMessage';
import { useQueryClient } from '@tanstack/react-query';

export default function SuperEnhancedSettingsScreen() {
  const api = getClient();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { setCurrentUserId, currentUserId } = useApiState();
  const queryClient = useQueryClient();
  
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Permissions
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(true);

  // Delete Account Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadUserData();
    checkPermissions();
  }, []);

  async function loadUserData() {
    try {
      const res = await api.get('/users/me');
      setUser(res.data);
    } catch (err) {
      setError('فشل تحميل البيانات');
    }
  }

  async function checkPermissions() {
    setCheckingPermissions(true);
    try {
      const locStatus = await Location.getForegroundPermissionsAsync();
      setLocationEnabled(locStatus.granted);

      const notifStatus = await Notifications.getPermissionsAsync();
      setNotificationsEnabled(notifStatus.granted);
    } catch (e) {
      console.error('Error checking permissions:', e);
    } finally {
      setCheckingPermissions(false);
    }
  }

  async function toggleLocation() {
    try {
      if (locationEnabled) {
        Alert.alert(
          'تعطيل الموقع',
          'لتعطيل الموقع، يرجى الذهاب إلى إعدادات النظام',
          [
            { text: 'إلغاء', style: 'cancel' },
            {
              text: 'فتح الإعدادات',
              onPress: () => Linking.openSettings()
            }
          ]
        );
        return;
      }

      const permReq = await Location.requestForegroundPermissionsAsync();
      if (permReq.status === 'granted') {
        setLocationEnabled(true);
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        await api.put('/users/me/device', { location: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
        
        try {
          const rg = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          const first = rg?.[0];
          if (first) {
            const city = (first.city || first.subregion || first.region) as any;
            const country = first.country as any;
            await api.put('/users/me', { city, country });
          }
        } catch {}
        
        setSuccess('تم تفعيل خدمات الموقع');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (e) {
      console.error('Location toggle error:', e);
      setError('فشل تفعيل خدمات الموقع');
    }
  }

  async function toggleNotifications() {
    try {
      if (notificationsEnabled) {
        Alert.alert(
          'تعطيل الإشعارات',
          'لتعطيل الإشعارات، يرجى الذهاب إلى إعدادات النظام',
          [
            { text: 'إلغاء', style: 'cancel' },
            { text: 'فتح الإعدادات', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      const notifReq = await Notifications.requestPermissionsAsync();
      if (notifReq.granted) {
        setNotificationsEnabled(true);
        try {
          const token = (await Notifications.getExpoPushTokenAsync()).data;
          await api.put('/users/me/device', { expo_push_token: token });
          setSuccess('تم تفعيل الإشعارات');
          setTimeout(() => setSuccess(null), 3000);
        } catch (e) {
          console.error('Failed to save notification token:', e);
        }
      }
    } catch (e) {
      console.error('Notification toggle error:', e);
      setError('فشل تفعيل الإشعارات');
    }
  }

  function handleLogout() {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تسجيل الخروج',
          style: 'destructive',
          onPress: () => {
            resetDiscoverySession(); // Clear session excludes on logout
            queryClient.clear(); // Clear ALL React Query cache
            setCurrentUserId(null);
          },
        },
      ]
    );
  }

  function openDeleteModal() {
    setShowDeleteModal(true);
    setDeleteConfirmText('');
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText.toLowerCase() !== 'delete') {
      setError('يرجى كتابة "delete" للتأكيد');
      return;
    }

    setIsDeleting(true);
    try {
      await api.delete('/users/me');
      setShowDeleteModal(false);
      Alert.alert(
        'تم حذف الحساب',
        'تم حذف حسابك بنجاح',
        [{ text: 'حسناً', onPress: () => setCurrentUserId(null) }]
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل حذف الحساب');
      setIsDeleting(false);
    }
  }

  if (!user) {
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <Text style={styles.loading}>جاري التحميل...</Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={{ paddingTop: insets.top + spacing(2), paddingBottom: spacing(6) }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>الإعدادات</Text>

        <ErrorMessage message={error} type="error" />
        <ErrorMessage message={success} type="success" />

        {/* Account Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معلومات الحساب</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="person-circle" size={24} color={colors.accent} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>الاسم</Text>
                <Text style={styles.infoValue}>{user.first_name || user.display_name}</Text>
              </View>
            </View>
            {user.phone && (
              <View style={styles.infoRow}>
                <Ionicons name="call" size={24} color={colors.accent} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>الهاتف</Text>
                  <Text style={styles.infoValue}>{user.phone}</Text>
                </View>
              </View>
            )}
            {user.email && (
              <View style={styles.infoRow}>
                <Ionicons name="mail" size={24} color={colors.accent} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>البريد الإلكتروني</Text>
                  <Text style={styles.infoValue}>{user.email}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Permissions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الأذونات</Text>
          
          <View style={styles.permissionCard}>
            <View style={styles.permissionRow}>
              <View style={styles.permissionInfo}>
                <Ionicons name="location" size={24} color={locationEnabled ? colors.accent : colors.subtext} />
                <View style={styles.permissionText}>
                  <Text style={styles.permissionTitle}>خدمات الموقع</Text>
                  <Text style={styles.permissionDesc}>
                    {checkingPermissions ? 'جاري التحقق...' : locationEnabled ? 'مفعّل' : 'معطّل'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={toggleLocation} 
                style={[styles.toggleBtn, locationEnabled && styles.toggleBtnActive]}
                disabled={checkingPermissions}
              >
                <Ionicons 
                  name={locationEnabled ? "checkmark" : "add"} 
                  size={20} 
                  color={locationEnabled ? colors.accent : '#fff'} 
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.permissionCard}>
            <View style={styles.permissionRow}>
              <View style={styles.permissionInfo}>
                <Ionicons name="notifications" size={24} color={notificationsEnabled ? colors.accent : colors.subtext} />
                <View style={styles.permissionText}>
                  <Text style={styles.permissionTitle}>الإشعارات</Text>
                  <Text style={styles.permissionDesc}>
                    {checkingPermissions ? 'جاري التحقق...' : notificationsEnabled ? 'مفعّلة' : 'معطّلة'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={toggleNotifications} 
                style={[styles.toggleBtn, notificationsEnabled && styles.toggleBtnActive]}
                disabled={checkingPermissions}
              >
                <Ionicons 
                  name={notificationsEnabled ? "checkmark" : "add"} 
                  size={20} 
                  color={notificationsEnabled ? colors.accent : '#fff'} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={styles.actionContent}>
              <Ionicons name="create" size={24} color={colors.accent} />
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>تعديل الملف الشخصي</Text>
                <Text style={styles.actionDesc}>تحديث المعلومات والصور</Text>
              </View>
            </View>
            <Ionicons name="chevron-back" size={20} color={colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Filters')}
          >
            <View style={styles.actionContent}>
              <Ionicons name="options" size={24} color={colors.accent} />
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>تفضيلات البحث</Text>
                <Text style={styles.actionDesc}>تخصيص معايير الاستكشاف</Text>
              </View>
            </View>
            <Ionicons name="chevron-back" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Account Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>إدارة الحساب</Text>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={handleLogout}
          >
            <View style={styles.actionContent}>
              <Ionicons name="log-out-outline" size={24} color="#f59e0b" />
              <View style={styles.actionText}>
                <Text style={[styles.actionTitle, { color: '#f59e0b' }]}>تسجيل الخروج</Text>
                <Text style={styles.actionDesc}>الخروج من الحساب الحالي</Text>
              </View>
            </View>
            <Ionicons name="chevron-back" size={20} color={colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, styles.dangerCard]}
            onPress={openDeleteModal}
          >
            <View style={styles.actionContent}>
              <Ionicons name="trash" size={24} color="#ef4444" />
              <View style={styles.actionText}>
                <Text style={[styles.actionTitle, { color: '#ef4444' }]}>حذف الحساب</Text>
                <Text style={styles.actionDesc}>حذف حسابك نهائياً</Text>
              </View>
            </View>
            <Ionicons name="chevron-back" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>حول التطبيق</Text>
          <View style={styles.infoCard}>
            <InfoItem icon="information-circle" label="الإصدار" value="1.0.0" />
            <InfoItem icon="shield-checkmark" label="الخصوصية" value="محمي" />
            <InfoItem icon="people" label="المجتمع" value="إسلامي" />
          </View>
        </View>

        {/* Delete Account Modal */}
        <Modal
          visible={showDeleteModal}
          transparent
          animationType="fade"
          onRequestClose={() => !isDeleting && setShowDeleteModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Ionicons name="warning" size={48} color="#ef4444" />
                <Text style={styles.modalTitle}>حذف الحساب نهائياً</Text>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.warningText}>⚠️ تحذير: هذا الإجراء لا يمكن التراجع عنه</Text>
                <Text style={styles.deleteInfoText}>
                  سيتم حذف جميع بياناتك بشكل نهائي، بما في ذلك:{'\n'}
                  • الصور والمعلومات الشخصية{'\n'}
                  • التوافقات والمحادثات{'\n'}
                  • التفضيلات والإعدادات{'\n'}
                  • السجل الكامل
                </Text>

                <View style={styles.confirmSection}>
                  <Text style={styles.confirmLabel}>
                    للتأكيد، اكتب كلمة <Text style={styles.deleteKeyword}>delete</Text> في المربع أدناه:
                  </Text>
                  <TextInput
                    style={styles.confirmInput}
                    value={deleteConfirmText}
                    onChangeText={setDeleteConfirmText}
                    placeholder="delete"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isDeleting}
                  />
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.deleteBtn, deleteConfirmText.toLowerCase() !== 'delete' && styles.deleteBtnDisabled]}
                  onPress={handleDeleteAccount}
                  disabled={deleteConfirmText.toLowerCase() !== 'delete' || isDeleting}
                >
                  <Ionicons name="trash" size={20} color="#fff" />
                  <Text style={styles.deleteBtnText}>
                    {isDeleting ? 'جاري الحذف...' : 'حذف الحساب نهائياً'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn]}
                  onPress={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                >
                  <Text style={styles.cancelBtnText}>إلغاء</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </GradientBackground>
  );

  async function handleDeleteAccount() {
    if (deleteConfirmText.toLowerCase() !== 'delete') {
      setError('يرجى كتابة "delete" للتأكيد');
      return;
    }

    setIsDeleting(true);
    try {
      await api.delete('/users/me');
      setShowDeleteModal(false);
      Alert.alert(
        'تم حذف الحساب',
        'تم حذف حسابك وجميع بياناتك بنجاح',
        [{ 
          text: 'حسناً', 
          onPress: () => {
            setCurrentUserId(null);
          }
        }]
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل حذف الحساب');
      setIsDeleting(false);
    }
  }
}

function InfoItem({ icon, label, value }: any) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={20} color={colors.accent} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    paddingHorizontal: spacing(2),
  },
  loading: {
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing(10),
    fontSize: 16,
  },
  header: { 
    color: colors.text, 
    fontSize: 32, 
    fontWeight: '800', 
    marginBottom: spacing(2), 
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  section: { 
    marginBottom: spacing(3),
  },
  sectionTitle: { 
    color: colors.text, 
    fontSize: 20, 
    fontWeight: '700', 
    marginBottom: spacing(1.5), 
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  
  // Info Card
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing(2),
    ...shadows.soft,
  },
  infoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: spacing(2),
  },
  infoContent: {
    flex: 1,
    marginRight: spacing(1.5),
  },
  infoLabel: {
    color: colors.subtext,
    fontSize: 13,
    textAlign: 'right',
    marginBottom: spacing(0.25),
  },
  infoValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  // Permission Card
  permissionCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing(2),
    marginBottom: spacing(1.5),
    ...shadows.soft,
  },
  permissionRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  permissionInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
  },
  permissionText: {
    flex: 1,
    marginRight: spacing(1.5),
  },
  permissionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: spacing(0.25),
  },
  permissionDesc: {
    color: colors.subtext,
    fontSize: 13,
    textAlign: 'right',
  },
  toggleBtn: {
    backgroundColor: colors.accent,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.soft,
  },
  toggleBtnActive: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.accent,
  },

  // Action Card
  actionCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing(2),
    marginBottom: spacing(1.5),
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.soft,
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  actionContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
  },
  actionText: {
    flex: 1,
    marginRight: spacing(1.5),
  },
  actionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: spacing(0.25),
  },
  actionDesc: {
    color: colors.subtext,
    fontSize: 13,
    textAlign: 'right',
  },

  // Delete Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing(3),
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    width: '100%',
    maxWidth: 400,
    padding: spacing(3),
    ...shadows.card,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: spacing(2),
  },
  modalTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing(1),
  },
  modalBody: {
    marginBottom: spacing(2),
  },
  warningText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing(2),
  },
  deleteInfoText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'right',
    backgroundColor: colors.surface,
    padding: spacing(2),
    borderRadius: radii.md,
    marginBottom: spacing(2),
  },
  confirmSection: {
    marginTop: spacing(2),
  },
  confirmLabel: {
    color: colors.text,
    fontSize: 15,
    textAlign: 'right',
    marginBottom: spacing(1),
  },
  deleteKeyword: {
    fontWeight: '700',
    color: '#ef4444',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  confirmInput: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing(1.5),
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalActions: {
    gap: spacing(1.5),
  },
  modalBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing(1.5),
    borderRadius: radii.md,
    gap: spacing(1),
  },
  deleteBtn: {
    backgroundColor: '#ef4444',
  },
  deleteBtnDisabled: {
    backgroundColor: '#6b7280',
    opacity: 0.5,
  },
  deleteBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

