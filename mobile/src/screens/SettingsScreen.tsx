import React, { useEffect, useState } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getClient, useApiState } from '../api/client';
import { colors, spacing, radii } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import ErrorMessage from '../components/ui/ErrorMessage';

export default function SettingsScreen() {
  const api = getClient();
  const navigation = useNavigation();
  const { setCurrentUserId } = useApiState();
  const [blur, setBlur] = useState(false);
  const [reveal, setReveal] = useState(true);
  const [photos, setPhotos] = useState<{ url: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/users/me').then(res => {
      setBlur(!!res.data.privacy_blur_mode);
      setReveal(!!res.data.privacy_reveal_on_match);
      setPhotos(res.data.photos || []);
    }).catch(()=>{});
  }, []);

  useEffect(() => {
    api.put('/users/me/privacy', { blur_mode: blur, reveal_on_match: reveal }).catch(()=>{});
  }, [blur, reveal]);

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
      setError(null);
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
            // Navigation will automatically update when currentUserId changes
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>الإعدادات</Text>
      
      <ErrorMessage message={error} type="error" />
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الخصوصية</Text>
        <View style={styles.row}>
          <Text style={styles.label}>إخفاء صوري في الاستكشاف</Text>
          <Switch value={blur} onValueChange={setBlur} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>إظهار صوري بعد التوافق</Text>
          <Switch value={reveal} onValueChange={setReveal} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الصور</Text>
        <TouchableOpacity onPress={pickAndUpload} style={styles.upload}>
          <Ionicons name="images" size={20} color="#000" />
          <Text style={styles.uploadText}>رفع الصور (حتى 5)</Text>
        </TouchableOpacity>
        <View style={styles.photosRow}>
          {photos.map(p => (
            <Image key={p.url} source={{ uri: `${getClient().defaults.baseURL}${p.url}` }} style={styles.photo} />
          ))}
        </View>
      </View>

      <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
        <Ionicons name="log-out-outline" size={22} color="#ef4444" />
        <Text style={styles.logoutText}>تسجيل الخروج</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing(2) },
  header: { color: colors.text, fontSize: 24, fontWeight: '700', marginBottom: spacing(2), textAlign: 'right' },
  section: { marginBottom: spacing(3) },
  sectionTitle: { color: colors.subtext, fontSize: 14, fontWeight: '600', marginBottom: spacing(1), textAlign: 'right' },
  row: { backgroundColor: colors.card, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', padding: spacing(2), borderRadius: radii.md, marginBottom: spacing(1) },
  label: { color: colors.text },
  upload: { marginTop: spacing(1), backgroundColor: colors.accent, alignSelf: 'stretch', paddingHorizontal: spacing(2), paddingVertical: spacing(1.5), borderRadius: radii.md, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: spacing(1) },
  uploadText: { color: '#000', fontWeight: '700' },
  photosRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing(1), marginTop: spacing(2) },
  photo: { width: 100, height: 120, borderRadius: radii.md },
  logoutBtn: { marginTop: spacing(4), backgroundColor: colors.card, padding: spacing(2), borderRadius: radii.md, borderWidth: 1, borderColor: '#ef4444', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: spacing(1) },
  logoutText: { color: '#ef4444', fontWeight: '700', fontSize: 16 },
});

