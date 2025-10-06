import React, { useEffect, useState } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, TextInput, Platform, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { getClient, useApiState } from '../api/client';
import { colors, spacing, radii, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import ErrorMessage from '../components/ui/ErrorMessage';

export default function EnhancedSettingsScreen() {
  const api = getClient();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { setCurrentUserId } = useApiState();
  const [blur, setBlur] = useState(false);
  const [reveal, setReveal] = useState(true);
  const [photos, setPhotos] = useState<{ url: string; id: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Filters
  const [ageMin, setAgeMin] = useState(20);
  const [ageMax, setAgeMax] = useState(35);
  const [relMin, setRelMin] = useState(3);
  const [radius, setRadius] = useState(50);

  // Permissions
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  // Re-check permissions when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      checkPermissions();
    }, [])
  );

  async function loadSettings() {
    try {
      const res = await api.get('/users/me');
      setBlur(!!res.data.privacy_blur_mode);
      setReveal(!!res.data.privacy_reveal_on_match);
      setPhotos(res.data.photos || []);
      
      if (res.data.preferences) {
        setAgeMin(res.data.preferences.age_min || 20);
        setAgeMax(res.data.preferences.age_max || 35);
        setRelMin(res.data.preferences.religiousness_min || 3);
        setRadius(res.data.preferences.distance_km || 50);
      }
    } catch {}
  }

  async function checkPermissions() {
    setCheckingPermissions(true);
    try {
      // Check location permission
      const locStatus = await Location.getForegroundPermissionsAsync();
      setLocationEnabled(locStatus.granted);

      // Check notification permission
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
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }
            }
          ]
        );
        return;
      }

      const permReq = await Location.requestForegroundPermissionsAsync();
      if (permReq.status === 'granted') {
        setLocationEnabled(true);
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        await api.put('/users/me/device', { location: { lat, lng } });
        
        try {
          const rg = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
          const first = rg?.[0];
          if (first) {
            const city = (first.city || first.subregion || first.region) as any;
            const country = first.country as any;
            await api.put('/users/me', { city, country });
          }
        } catch {}
        
        setSuccess('تم تفعيل خدمات الموقع');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        // Handle permission denial with option to open settings
        if (permReq.canAskAgain === false) {
          Alert.alert(
            'تفعيل خدمات الموقع',
            'يرجى تفعيل خدمات الموقع من إعدادات النظام',
            [
              { text: 'إلغاء', style: 'cancel' },
              {
                text: 'فتح الإعدادات',
                onPress: () => {
                  if (Platform.OS === 'ios') {
                    Linking.openURL('app-settings:');
                  } else {
                    Linking.openSettings();
                  }
                }
              }
            ]
          );
        } else {
          Alert.alert(
            'تم رفض الإذن',
            'يجب السماح بالوصول إلى الموقع لاستخدام هذه الميزة',
            [{ text: 'حسناً' }]
          );
        }
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
            {
              text: 'فتح الإعدادات',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }
            }
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
      } else {
        // Handle permission denial with option to open settings
        if (notifReq.canAskAgain === false) {
          Alert.alert(
            'تفعيل الإشعارات',
            'يرجى تفعيل الإشعارات من إعدادات النظام',
            [
              { text: 'إلغاء', style: 'cancel' },
              {
                text: 'فتح الإعدادات',
                onPress: () => {
                  if (Platform.OS === 'ios') {
                    Linking.openURL('app-settings:');
                  } else {
                    Linking.openSettings();
                  }
                }
              }
            ]
          );
        } else {
          Alert.alert(
            'تم رفض الإذن',
            'يجب السماح بالإشعارات لتلقي إشعارات التوافقات والرسائل',
            [{ text: 'حسناً' }]
          );
        }
      }
    } catch (e) {
      console.error('Notification toggle error:', e);
      setError('فشل تفعيل الإشعارات');
    }
  }

  useEffect(() => {
    api.put('/users/me/privacy', { blur_mode: blur, reveal_on_match: reveal }).catch(()=>{});
  }, [blur, reveal]);

  async function saveFilters() {
    try {
      await api.put('/users/me/preferences', {
        age_min: ageMin,
        age_max: ageMax,
        religiousness_min: relMin,
        distance_km: Math.round(radius),
      });
      setSuccess('تم حفظ التفضيلات');
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('فشل حفظ التفضيلات');
    }
  }

  async function pickAndUpload() {
    try {
      setError(null);
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { setError('يرجى السماح بالوصول للصور'); return; }
      const sel = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, quality: 0.8, mediaTypes: ['images'], selectionLimit: 5 });
      if (sel.canceled) return;
      const form = new FormData();
      for (const a of sel.assets) {
        form.append('photos', {
          uri: a.uri,
          name: `photo.jpg`,
          type: 'image/jpeg',
        } as any);
      }
      const res = await api.put('/photos/me/photos', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPhotos(res.data.photos || []);
      setSuccess('تم رفع الصور');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل رفع الصور');
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
            setCurrentUserId(null);
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: spacing(4) }}>
      <Text style={styles.header}>الإعدادات</Text>
      
      <ErrorMessage message={error} type="error" />
      <ErrorMessage message={success} type="success" />

      {/* Permissions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔔 الأذونات</Text>
        <View style={styles.permissionCard}>
          <View style={styles.permissionInfo}>
            <Ionicons name="location" size={24} color={locationEnabled ? colors.accent : colors.subtext} />
            <View style={{ flex: 1, marginHorizontal: spacing(1.5) }}>
              <Text style={styles.permissionTitle}>خدمات الموقع</Text>
              <Text style={styles.permissionDesc}>
                {checkingPermissions ? 'جاري التحقق...' : locationEnabled ? 'مفعّل - للمقترحات القريبة' : 'معطّل - فعّل للحصول على مقترحات قريبة'}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={toggleLocation} 
              style={[styles.permissionBtn, locationEnabled && styles.permissionBtnActive]}
              disabled={checkingPermissions}
            >
              <Text style={[styles.permissionBtnText, locationEnabled && styles.permissionBtnTextActive]}>
                {locationEnabled ? 'مفعّل' : 'تفعيل'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.permissionCard}>
          <View style={styles.permissionInfo}>
            <Ionicons name="notifications" size={24} color={notificationsEnabled ? colors.accent : colors.subtext} />
            <View style={{ flex: 1, marginHorizontal: spacing(1.5) }}>
              <Text style={styles.permissionTitle}>الإشعارات</Text>
              <Text style={styles.permissionDesc}>
                {checkingPermissions ? 'جاري التحقق...' : notificationsEnabled ? 'مفعّلة - لتلقي إشعارات التوافقات' : 'معطّلة - فعّل لتلقي الإشعارات'}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={toggleNotifications} 
              style={[styles.permissionBtn, notificationsEnabled && styles.permissionBtnActive]}
              disabled={checkingPermissions}
            >
              <Text style={[styles.permissionBtnText, notificationsEnabled && styles.permissionBtnTextActive]}>
                {notificationsEnabled ? 'مفعّلة' : 'تفعيل'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Discovery Filters */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔍 تصفية الاستكشاف</Text>
        
        <View style={styles.filterCard}>
          <Text style={styles.filterLabel}>العمر: {ageMin} - {ageMax}</Text>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderValue}>{ageMin}</Text>
            <Slider
              style={styles.slider}
              minimumValue={18}
              maximumValue={100}
              step={1}
              value={ageMin}
              onValueChange={setAgeMin}
              minimumTrackTintColor={colors.accent}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.accent}
            />
            <Text style={styles.sliderValue}>{ageMax}</Text>
            <Slider
              style={styles.slider}
              minimumValue={18}
              maximumValue={100}
              step={1}
              value={ageMax}
              onValueChange={setAgeMax}
              minimumTrackTintColor={colors.accent}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.accent}
            />
          </View>
        </View>

        <View style={styles.filterCard}>
          <Text style={styles.filterLabel}>الالتزام الديني (الحد الأدنى): {relMin}/5</Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={5}
            step={1}
            value={relMin}
            onValueChange={setRelMin}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.accent}
          />
          <View style={styles.relLabels}>
            <Text style={styles.relLabel}>منخفض</Text>
            <Text style={styles.relLabel}>متوسط</Text>
            <Text style={styles.relLabel}>عالي</Text>
          </View>
        </View>

        <View style={styles.filterCard}>
          <Text style={styles.filterLabel}>نطاق المسافة: {Math.round(radius)} كم</Text>
          <Slider
            style={styles.slider}
            minimumValue={5}
            maximumValue={500}
            step={5}
            value={radius}
            onValueChange={setRadius}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.accent}
          />
          <Text style={{ color: colors.subtext, textAlign: 'right', marginTop: spacing(0.5) }}>افتراضي: 50 كم</Text>
        </View>

        <TouchableOpacity style={styles.saveFiltersBtn} onPress={saveFilters}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.saveFiltersText}>حفظ التفضيلات</Text>
        </TouchableOpacity>
      </View>

      {/* Privacy */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔒 الخصوصية</Text>
        <View style={styles.row}>
          <Text style={styles.label}>إخفاء صوري في الاستكشاف</Text>
          <Switch value={blur} onValueChange={setBlur} trackColor={{ true: colors.accent }} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>إظهار صوري بعد التوافق</Text>
          <Switch value={reveal} onValueChange={setReveal} trackColor={{ true: colors.accent }} />
        </View>
      </View>

      {/* Photos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📸 الصور</Text>
        <TouchableOpacity onPress={pickAndUpload} style={styles.upload}>
          <Ionicons name="images" size={20} color="#fff" />
          <Text style={styles.uploadText}>رفع الصور (حتى 5)</Text>
        </TouchableOpacity>
        <View style={styles.photosRow}>
          {photos.map(p => (
            <Image key={p.id} source={{ uri: `${api.defaults.baseURL}${p.url}` }} style={styles.photo} />
          ))}
        </View>
      </View>

      {/* Development Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>تطوير (اختبار)</Text>
        <TouchableOpacity style={styles.devBtn} onPress={() => switchUser('cmgayry8d0000m7ygso92wqra')}>
          <Text style={styles.devBtnText}>تبديل إلى أحمد محمد (ذكر)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.devBtn} onPress={() => switchUser('cmgayrzxb002sm7ygwlilg382')}>
          <Text style={styles.devBtnText}>تبديل إلى لينا عمر (أنثى)</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
        <Ionicons name="log-out-outline" size={22} color="#ef4444" />
        <Text style={styles.logoutText}>تسجيل الخروج</Text>
      </TouchableOpacity>
    </ScrollView>
  );
  
  async function switchUser(userId: string) {
    setCurrentUserId(userId);
    Alert.alert('تم', 'تم تبديل المستخدم بنجاح');
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { color: colors.text, fontSize: 28, fontWeight: '700', padding: spacing(2), textAlign: 'right' },
  section: { marginBottom: spacing(3), paddingHorizontal: spacing(2) },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: spacing(1.5), textAlign: 'right' },
  filterCard: { backgroundColor: colors.card, borderRadius: radii.md, padding: spacing(2), marginBottom: spacing(1.5), ...shadows.soft },
  filterLabel: { color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: spacing(1), textAlign: 'right' },
  sliderContainer: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing(1) },
  slider: { flex: 1 },
  sliderValue: { color: colors.text, fontSize: 14, fontWeight: '600', minWidth: 30, textAlign: 'center' },
  relLabels: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: spacing(0.5) },
  relLabel: { color: colors.subtext, fontSize: 12 },
  saveFiltersBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: spacing(1), backgroundColor: colors.accent, padding: spacing(1.5), borderRadius: radii.md, marginTop: spacing(1) },
  saveFiltersText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  row: { backgroundColor: colors.card, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', padding: spacing(2), borderRadius: radii.md, marginBottom: spacing(1), ...shadows.soft },
  label: { color: colors.text, flex: 1, textAlign: 'right' },
  upload: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: spacing(1), backgroundColor: colors.accent, paddingHorizontal: spacing(2), paddingVertical: spacing(1.5), borderRadius: radii.md },
  uploadText: { color: '#fff', fontWeight: '700' },
  photosRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing(1), marginTop: spacing(2) },
  photo: { width: 100, height: 120, borderRadius: radii.md },
  logoutBtn: { marginTop: spacing(2), marginHorizontal: spacing(2), backgroundColor: colors.card, padding: spacing(2), borderRadius: radii.md, borderWidth: 1, borderColor: '#ef4444', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: spacing(1), ...shadows.soft },
  logoutText: { color: '#ef4444', fontWeight: '700', fontSize: 16 },
  permissionCard: { backgroundColor: colors.card, borderRadius: radii.md, padding: spacing(2), marginBottom: spacing(1.5), ...shadows.soft },
  permissionInfo: { flexDirection: 'row-reverse', alignItems: 'center' },
  permissionTitle: { color: colors.text, fontSize: 16, fontWeight: '600', textAlign: 'right' },
  permissionDesc: { color: colors.subtext, fontSize: 13, marginTop: spacing(0.5), textAlign: 'right' },
  permissionBtn: { 
    backgroundColor: colors.accent, 
    paddingHorizontal: spacing(2), 
    paddingVertical: spacing(1), 
    borderRadius: radii.md,
    minWidth: 70,
    alignItems: 'center'
  },
  permissionBtnActive: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.accent },
  permissionBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  permissionBtnTextActive: { color: colors.accent },
  devBtn: {
    backgroundColor: colors.surface,
    padding: spacing(2),
    borderRadius: radii.md,
    marginBottom: spacing(1),
    borderWidth: 1,
    borderColor: colors.border,
  },
  devBtnText: {
    color: colors.text,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});
