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
  Modal,
  Switch
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { getClient, useApiState } from '../api/client';
import { colors, spacing, radii, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../components/ui/GradientBackground';
import Button from '../components/ui/Button';
import ErrorMessage from '../components/ui/ErrorMessage';
import { feedback } from '../utils/haptics';

export default function UltraEnhancedSettingsScreen() {
  const api = getClient();
  const insets = useSafeAreaInsets();
  const { setCurrentUserId } = useApiState();
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Permissions
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(true);

  // Basic Filters
  const [ageMin, setAgeMin] = useState(20);
  const [ageMax, setAgeMax] = useState(35);
  const [distanceKm, setDistanceKm] = useState(50);
  const [heightMin, setHeightMin] = useState(150);
  const [heightMax, setHeightMax] = useState(190);
  
  // Advanced Filters
  const [selectedSects, setSelectedSects] = useState<string[]>([]);
  const [selectedEducation, setSelectedEducation] = useState<string[]>([]);
  const [selectedMaritalStatus, setSelectedMaritalStatus] = useState<string[]>([]);
  const [selectedSmoking, setSelectedSmoking] = useState<string[]>([]);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [selectedRelocate, setSelectedRelocate] = useState<string | null>(null);
  const [selectedOrigins, setSelectedOrigins] = useState<string[]>([]);
  
  const [options, setOptions] = useState<any>({});
  const [userDiscoverable, setUserDiscoverable] = useState(true);
  
  // Privacy
  const [photosBlurred, setPhotosBlurred] = useState(false);

  // Delete Account Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadSettings();
    loadOptions();
    checkPermissions();
  }, []);

  async function loadOptions() {
    try {
      const res = await api.get('/onboarding/options');
      setOptions(res.data);
    } catch (err) {
      console.error('Failed to load options', err);
    }
  }

  async function loadSettings() {
    try {
      const res = await api.get('/users/me');
      const user = res.data;
      const prefs = user.preferences;
      
      // User settings
      setPhotosBlurred(user.photos_blurred || false);
      setUserDiscoverable(user.discoverable !== false);
      
      // Preferences
      if (prefs) {
        setAgeMin(prefs.age_min || 20);
        setAgeMax(prefs.age_max || 35);
        setDistanceKm(prefs.distance_km || 50);
        setHeightMin(prefs.height_min_cm || 150);
        setHeightMax(prefs.height_max_cm || 190);
        
        // Parse JSON filters
        try { if (prefs.sect_preferences) setSelectedSects(JSON.parse(prefs.sect_preferences)); } catch {}
        try { if (prefs.education_preferences) setSelectedEducation(JSON.parse(prefs.education_preferences)); } catch {}
        try { if (prefs.marital_status_preferences) setSelectedMaritalStatus(JSON.parse(prefs.marital_status_preferences)); } catch {}
        try { if (prefs.smoking_preferences) setSelectedSmoking(JSON.parse(prefs.smoking_preferences)); } catch {}
        try { if (prefs.children_preferences) setSelectedChildren(JSON.parse(prefs.children_preferences)); } catch {}
        try { if (prefs.origin_preferences) setSelectedOrigins(JSON.parse(prefs.origin_preferences)); } catch {}
        
        if (prefs.relocate_preference !== undefined && prefs.relocate_preference !== null) {
          setSelectedRelocate(prefs.relocate_preference ? 'yes' : 'no');
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError('فشل تحميل الإعدادات');
      setLoading(false);
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
      // Add haptic feedback for toggle
      feedback.selection();
      
      if (locationEnabled) {
        Alert.alert(
          'تعطيل الموقع',
          'لتعطيل الموقع، يرجى الذهاب إلى إعدادات النظام',
          [
            { text: 'إلغاء', style: 'cancel' },
            { text: 'فتح الإعدادات', onPress: () => Linking.openSettings() }
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
            await api.put('/users/me', { 
              city: (first.city || first.subregion || first.region) as any,
              country: first.country as any 
            });
          }
        } catch {}
        
        setSuccess('✅ تم تفعيل خدمات الموقع');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (e) {
      setError('فشل تفعيل خدمات الموقع');
    }
  }

  async function toggleNotifications() {
    try {
      // Add haptic feedback for toggle
      feedback.selection();
      
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
          setSuccess('✅ تم تفعيل الإشعارات');
          setTimeout(() => setSuccess(null), 3000);
        } catch (e) {
          console.error('Failed to save notification token:', e);
        }
      }
    } catch (e) {
      setError('فشل تفعيل الإشعارات');
    }
  }

  // Auto-save preferences whenever they change
  useEffect(() => {
    if (loading) return; // Don't save during initial load
    
    const timer = setTimeout(() => {
      savePreferences();
    }, 500); // Debounce 500ms
    
    return () => clearTimeout(timer);
  }, [
    ageMin, ageMax, distanceKm, heightMin, heightMax,
    selectedSects, selectedEducation, selectedMaritalStatus,
    selectedSmoking, selectedChildren, selectedRelocate, selectedOrigins
  ]);

  async function savePreferences() {
    try {
      await api.put('/users/me/preferences', {
        age_min: ageMin,
        age_max: ageMax,
        distance_km: distanceKm,
        height_min_cm: heightMin,
        height_max_cm: heightMax,
        sect_preferences: JSON.stringify(selectedSects),
        education_preferences: JSON.stringify(selectedEducation),
        marital_status_preferences: JSON.stringify(selectedMaritalStatus),
        smoking_preferences: JSON.stringify(selectedSmoking),
        children_preferences: JSON.stringify(selectedChildren),
        origin_preferences: JSON.stringify(selectedOrigins),
        relocate_preference: selectedRelocate === null ? null : selectedRelocate === 'yes',
      });
      console.log('✅ Preferences auto-saved');
    } catch (err: any) {
      console.error('Failed to auto-save preferences:', err);
    }
  }

  function toggleSelection(array: string[], setArray: (arr: string[]) => void, value: string) {
    if (array.includes(value)) {
      setArray(array.filter(v => v !== value));
    } else {
      setArray([...array, value]);
    }
  }

  function handleLogout() {
    // Add haptic feedback for logout button
    feedback.important();
    
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'تسجيل الخروج', style: 'destructive', onPress: () => setCurrentUserId(null) },
      ]
    );
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText.toLowerCase() !== 'delete') {
      setError('يرجى كتابة "delete" للتأكيد');
      return;
    }

    // Add haptic feedback for delete account
    feedback.important();
    
    setIsDeleting(true);
    try {
      await api.delete('/users/me');
      setShowDeleteModal(false);
      Alert.alert(
        'تم حذف الحساب',
        'تم حذف حسابك وجميع بياناتك بنجاح',
        [{ text: 'حسناً', onPress: () => setCurrentUserId(null) }]
      );
    } catch (err: any) {
      feedback.error();
      setError(err.response?.data?.message || 'فشل حذف الحساب');
      setIsDeleting(false);
    }
  }

  if (loading) {
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center' }]}>
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

        {/* Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الخصوصية</Text>
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="person" size={22} color={colors.accent} />
                <Text style={styles.settingLabel}>إخفاء الحساب من الظهور</Text>
              </View>
              <View style={styles.rtlSwitchContainer}>
                <Switch 
                  value={!userDiscoverable} 
                  onValueChange={async (hidden) => {
                    try {
                      setUserDiscoverable(!hidden);
                      await api.put('/users/me', { discoverable: !hidden });
                    } catch (e) {
                      setUserDiscoverable((prev) => !prev);
                    }
                  }} 
                  trackColor={{ true: colors.accent, false: colors.border }} 
                  thumbColor="#fff"
                />
              </View>
            </View>
            <Text style={styles.settingHelp}>لن يظهر حسابك في الاستكشاف طالما هذا الخيار مفعّل.</Text>
          </View>
        </View>

        {/* Discovery Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>تفضيلات الاستكشاف</Text>
          <Text style={styles.sectionHint}>التفضيلات تُحفظ تلقائياً</Text>

          {/* Distance - Simple Slider */}
          <View style={styles.filterCard}>
            <View style={styles.filterHeader}>
              <Ionicons name="location" size={20} color={colors.accent} />
              <Text style={styles.filterTitle}>نطاق المسافة</Text>
            </View>
            <View style={styles.distanceControl}>
              <Text style={styles.distanceValue}>{distanceKm} كم</Text>
              <View style={styles.rtlSliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={5}
                  maximumValue={500}
                  step={5}
                  value={distanceKm}
                  onValueChange={setDistanceKm}
                  minimumTrackTintColor={colors.accent}
                  maximumTrackTintColor={colors.border}
                  thumbTintColor={colors.accent}
                />
              </View>
              <View style={styles.distanceLabels}>
                <Text style={styles.distanceLabel}>5</Text>
                <Text style={styles.distanceLabel}>100</Text>
                <Text style={styles.distanceLabel}>500</Text>
              </View>
            </View>
          </View>

          {/* Age Range - Tinder Style */}
          <View style={styles.filterCard}>
            <View style={styles.filterHeader}>
              <Ionicons name="calendar" size={20} color={colors.accent} />
              <Text style={styles.filterTitle}>نطاق العمر</Text>
            </View>
            <View style={styles.rangeSelector}>
              <View style={styles.rangeControl}>
                <Text style={styles.rangeLabel}>من</Text>
                <View style={styles.numberControl}>
                  <TouchableOpacity 
                    style={styles.controlBtn}
                    onPress={() => setAgeMin(Math.max(18, ageMin - 1))}
                  >
                    <Ionicons name="remove" size={20} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.rangeNumber}>{ageMin}</Text>
                  <TouchableOpacity 
                    style={styles.controlBtn}
                    onPress={() => setAgeMin(Math.min(100, ageMin + 1))}
                  >
                    <Ionicons name="add" size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.rangeDivider} />
              
              <View style={styles.rangeControl}>
                <Text style={styles.rangeLabel}>إلى</Text>
                <View style={styles.numberControl}>
                  <TouchableOpacity 
                    style={styles.controlBtn}
                    onPress={() => setAgeMax(Math.max(18, ageMax - 1))}
                  >
                    <Ionicons name="remove" size={20} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.rangeNumber}>{ageMax}</Text>
                  <TouchableOpacity 
                    style={styles.controlBtn}
                    onPress={() => setAgeMax(Math.min(100, ageMax + 1))}
                  >
                    <Ionicons name="add" size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Height Range - Tinder Style */}
          <View style={styles.filterCard}>
            <View style={styles.filterHeader}>
              <Ionicons name="resize" size={20} color={colors.accent} />
              <Text style={styles.filterTitle}>نطاق الطول</Text>
            </View>
            <View style={styles.rangeSelector}>
              <View style={styles.rangeControl}>
                <Text style={styles.rangeLabel}>من</Text>
                <View style={styles.numberControl}>
                  <TouchableOpacity 
                    style={styles.controlBtn}
                    onPress={() => setHeightMin(Math.max(140, heightMin - 1))}
                  >
                    <Ionicons name="remove" size={20} color={colors.text} />
                  </TouchableOpacity>
                  <View style={styles.heightDisplay}>
                    <Text style={styles.rangeNumber}>{heightMin}</Text>
                    <Text style={styles.unitText}>سم</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.controlBtn}
                    onPress={() => setHeightMin(Math.min(210, heightMin + 1))}
                  >
                    <Ionicons name="add" size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.imperialText}>{Math.round(heightMin / 2.54)}"</Text>
              </View>
              
              <View style={styles.rangeDivider} />
              
              <View style={styles.rangeControl}>
                <Text style={styles.rangeLabel}>إلى</Text>
                <View style={styles.numberControl}>
                  <TouchableOpacity 
                    style={styles.controlBtn}
                    onPress={() => setHeightMax(Math.max(140, heightMax - 1))}
                  >
                    <Ionicons name="remove" size={20} color={colors.text} />
                  </TouchableOpacity>
                  <View style={styles.heightDisplay}>
                    <Text style={styles.rangeNumber}>{heightMax}</Text>
                    <Text style={styles.unitText}>سم</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.controlBtn}
                    onPress={() => setHeightMax(Math.min(210, heightMax + 1))}
                  >
                    <Ionicons name="add" size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.imperialText}>{Math.round(heightMax / 2.54)}"</Text>
              </View>
            </View>
          </View>

          {/* Origin */}
          <View style={styles.filterCard}>
            <View style={styles.filterHeader}>
              <Ionicons name="flag" size={20} color={colors.accent} />
              <Text style={styles.filterTitle}>الأصل</Text>
            </View>
            <Text style={styles.filterHint}>فارغ = الكل</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.originScrollContent}
            >
              {(options.arabic_origins || []).map((country: any) => (
                <TouchableOpacity
                  key={country.code}
                  style={[styles.originChip, selectedOrigins.includes(country.name) && styles.originChipActive]}
                  onPress={() => toggleSelection(selectedOrigins, setSelectedOrigins, country.name)}
                >
                  <Text style={[styles.originName, selectedOrigins.includes(country.name) && styles.originNameActive]}>
                    {country.name} {country.flag}
                  </Text>
                  {selectedOrigins.includes(country.name) && (
                    <View style={styles.originCheckmark}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Sect */}
          <View style={styles.filterCard}>
            <View style={styles.filterHeader}>
              <Ionicons name="moon" size={20} color={colors.accent} />
              <Text style={styles.filterTitle}>المذهب</Text>
            </View>
            <Text style={styles.filterHint}>فارغ = الكل</Text>
            <View style={styles.chipsContainer}>
              {(options.sects || []).map((sect: string) => (
                <TouchableOpacity
                  key={sect}
                  style={[styles.filterChip, selectedSects.includes(sect) && styles.filterChipActive]}
                  onPress={() => toggleSelection(selectedSects, setSelectedSects, sect)}
                >
                  <Text style={[styles.filterChipText, selectedSects.includes(sect) && styles.filterChipTextActive]}>
                    {sect}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Education */}
          <View style={styles.filterCard}>
            <View style={styles.filterHeader}>
              <Ionicons name="school" size={20} color={colors.accent} />
              <Text style={styles.filterTitle}>التعليم</Text>
            </View>
            <Text style={styles.filterHint}>فارغ = الكل</Text>
            <View style={styles.chipsContainer}>
              {(options.education_levels || []).map((level: string) => (
                <TouchableOpacity
                  key={level}
                  style={[styles.filterChip, selectedEducation.includes(level) && styles.filterChipActive]}
                  onPress={() => toggleSelection(selectedEducation, setSelectedEducation, level)}
                >
                  <Text style={[styles.filterChipText, selectedEducation.includes(level) && styles.filterChipTextActive]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Marital Status */}
          <View style={styles.filterCard}>
            <View style={styles.filterHeader}>
              <Ionicons name="heart" size={20} color={colors.accent} />
              <Text style={styles.filterTitle}>الحالة الاجتماعية</Text>
            </View>
            <Text style={styles.filterHint}>فارغ = الكل</Text>
            <View style={styles.chipsContainer}>
              {(options.marital_status_options || []).map((status: string) => (
                <TouchableOpacity
                  key={status}
                  style={[styles.filterChip, selectedMaritalStatus.includes(status) && styles.filterChipActive]}
                  onPress={() => toggleSelection(selectedMaritalStatus, setSelectedMaritalStatus, status)}
                >
                  <Text style={[styles.filterChipText, selectedMaritalStatus.includes(status) && styles.filterChipTextActive]}>
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Smoking */}
          <View style={styles.filterCard}>
            <View style={styles.filterHeader}>
              <Ionicons name="ban" size={20} color={colors.accent} />
              <Text style={styles.filterTitle}>التدخين</Text>
            </View>
            <Text style={styles.filterHint}>فارغ = الكل</Text>
            <View style={styles.chipsContainer}>
              {(options.smoking_options || []).map((option: string) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.filterChip, selectedSmoking.includes(option) && styles.filterChipActive]}
                  onPress={() => toggleSelection(selectedSmoking, setSelectedSmoking, option)}
                >
                  <Text style={[styles.filterChipText, selectedSmoking.includes(option) && styles.filterChipTextActive]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Children */}
          <View style={styles.filterCard}>
            <View style={styles.filterHeader}>
              <Ionicons name="people" size={20} color={colors.accent} />
              <Text style={styles.filterTitle}>رغبة الأطفال</Text>
            </View>
            <Text style={styles.filterHint}>فارغ = الكل</Text>
            <View style={styles.chipsContainer}>
              {(options.children_preferences || []).map((pref: string) => (
                <TouchableOpacity
                  key={pref}
                  style={[styles.filterChip, selectedChildren.includes(pref) && styles.filterChipActive]}
                  onPress={() => toggleSelection(selectedChildren, setSelectedChildren, pref)}
                >
                  <Text style={[styles.filterChipText, selectedChildren.includes(pref) && styles.filterChipTextActive]}>
                    {pref}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Relocation */}
          <View style={styles.filterCard}>
            <View style={styles.filterHeader}>
              <Ionicons name="airplane" size={20} color={colors.accent} />
              <Text style={styles.filterTitle}>الاستعداد للانتقال</Text>
            </View>
            <Text style={styles.filterHint}>اختر واحد</Text>
            <View style={styles.chipsContainer}>
              <TouchableOpacity
                style={[styles.filterChip, selectedRelocate === null && styles.filterChipActive]}
                onPress={() => setSelectedRelocate(null)}
              >
                <Text style={[styles.filterChipText, selectedRelocate === null && styles.filterChipTextActive]}>
                  لا يهم
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, selectedRelocate === 'yes' && styles.filterChipActive]}
                onPress={() => setSelectedRelocate('yes')}
              >
                <Text style={[styles.filterChipText, selectedRelocate === 'yes' && styles.filterChipTextActive]}>
                  نعم
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, selectedRelocate === 'no' && styles.filterChipActive]}
                onPress={() => setSelectedRelocate('no')}
              >
                <Text style={[styles.filterChipText, selectedRelocate === 'no' && styles.filterChipTextActive]}>
                  لا
                </Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>

        {/* Account Actions */}
        <View style={styles.accountSection}>
          <Text style={styles.sectionTitle}>إدارة الحساب</Text>
          
          <TouchableOpacity 
            style={styles.logoutCard}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="#f59e0b" />
            <Text style={styles.logoutText}>تسجيل الخروج</Text>
            <Ionicons name="chevron-back" size={20} color="#f59e0b" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.deleteCard}
            onPress={() => setShowDeleteModal(true)}
          >
            <Ionicons name="trash" size={24} color="#ef4444" />
            <Text style={styles.deleteText}>حذف الحساب نهائياً</Text>
            <Ionicons name="chevron-back" size={20} color="#ef4444" />
          </TouchableOpacity>
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
                <Ionicons name="warning" size={56} color="#ef4444" />
                <Text style={styles.modalTitle}>حذف الحساب نهائياً</Text>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.warningText}>⚠️ تحذير: هذا الإجراء لا يمكن التراجع عنه</Text>
                <Text style={styles.deleteInfoText}>
                  سيتم حذف جميع بياناتك بشكل نهائي:{'\n\n'}
                  • الصور والمعلومات الشخصية{'\n'}
                  • التوافقات والمحادثات{'\n'}
                  • التفضيلات والإعدادات{'\n'}
                  • السجل الكامل
                </Text>

                <View style={styles.confirmSection}>
                  <Text style={styles.confirmLabel}>
                    للتأكيد، اكتب <Text style={styles.deleteKeyword}>delete</Text>
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
                    {isDeleting ? 'جاري الحذف...' : 'حذف الحساب'}
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing(2),
  },
  loading: {
    color: colors.text,
    textAlign: 'center',
    fontSize: 16,
  },
  header: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    marginBottom: spacing(1),
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  section: {
    marginBottom: spacing(3),
  },
  accountSection: {
    marginBottom: spacing(3),
    marginTop: spacing(3),
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing(0.5),
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sectionHint: {
    color: colors.subtext,
    fontSize: 14,
    marginBottom: spacing(2),
    textAlign: 'right',
  },

  // Permission Cards
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

  // Setting Card
  settingCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing(2),
    ...shadows.soft,
  },
  settingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing(1),
  },
  settingInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing(1.5),
    flex: 1,
  },
  settingLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'right',
  },
  rtlSwitchContainer: {
    flexDirection: 'row-reverse',
  },
  settingHelp: {
    color: colors.text,
    fontSize: 13,
    textAlign: 'right',
    marginTop: spacing(1),
    lineHeight: 18,
  },

  // Filter Cards - Tinder Inspired
  filterCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing(2.5),
    marginBottom: spacing(1.5),
    ...shadows.soft,
  },
  filterHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing(1),
    marginBottom: spacing(1.5),
  },
  filterTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
  },
  filterHint: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'right',
    marginBottom: spacing(1.5),
  },

  // Range Selector (Tinder Style)
  rangeSelector: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: spacing(2),
  },
  rangeControl: {
    flex: 1,
    alignItems: 'center',
  },
  rangeLabel: {
    color: colors.subtext,
    fontSize: 13,
    marginBottom: spacing(1),
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  numberControl: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing(0.5),
    gap: spacing(0.5),
  },
  controlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.soft,
  },
  rangeNumber: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    minWidth: 50,
    textAlign: 'center',
  },
  heightDisplay: {
    flexDirection: 'row-reverse',
    alignItems: 'baseline',
    gap: spacing(0.5),
  },
  unitText: {
    color: colors.subtext,
    fontSize: 14,
  },
  imperialText: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing(0.5),
  },
  rangeDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },

  // Distance Control
  distanceControl: {
    alignItems: 'center',
  },
  distanceValue: {
    color: colors.accent,
    fontSize: 32,
    fontWeight: '800',
    marginBottom: spacing(1),
  },
  slider: {
    width: '100%',
    height: 40,
  },
  rtlSliderContainer: {
    flexDirection: 'row-reverse',
    transform: [{ scaleX: -1 }],
  },
  distanceLabels: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing(0.5),
  },
  distanceLabel: {
    color: colors.muted,
    fontSize: 12,
  },

  // Filter Chips
  chipsContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing(1),
  },
  filterChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterChipText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#000',
    fontWeight: '700',
  },

  // Origin Chips
  originScrollContent: {
    flexDirection: 'row-reverse',
    gap: spacing(1),
    paddingVertical: spacing(0.5),
  },
  originChip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(1),
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  originChipActive: {
    backgroundColor: colors.accent + '20',
    borderColor: colors.accent,
  },
  originFlag: {
    fontSize: 28,
    marginBottom: spacing(0.5),
  },
  originName: {
    color: colors.text,
    fontSize: 12,
    textAlign: 'center',
  },
  originNameActive: {
    color: colors.text,
    fontWeight: '700',
  },
  originCheckmark: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.card,
    borderRadius: 12,
  },

  // Account Actions
  logoutCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing(2.5),
    marginBottom: spacing(1.5),
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f59e0b',
    alignSelf: 'center',
    width: '70%',
    ...shadows.soft,
  },
  logoutText: {
    color: '#f59e0b',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: spacing(1),
  },
  deleteCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing(2.5),
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ef4444',
    alignSelf: 'center',
    width: '70%',
    ...shadows.card,
  },
  deleteText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: spacing(1),
  },

  // Delete Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
    fontWeight: '800',
    textAlign: 'center',
    marginTop: spacing(1),
  },
  modalBody: {
    marginBottom: spacing(2),
  },
  warningText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing(2),
  },
  deleteInfoText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
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
    fontWeight: '800',
    color: '#ef4444',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  confirmInput: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing(1.5),
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '600',
  },
  modalActions: {
    gap: spacing(1.5),
  },
  modalBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing(1.5),
    borderRadius: radii.lg,
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

