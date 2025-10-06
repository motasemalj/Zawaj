import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, ImageBackground } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getClient } from '../api/client';
import { colors, radii, spacing, shadows } from '../theme';
import Button from '../components/ui/Button';
import ErrorMessage from '../components/ui/ErrorMessage';
import Avatar from '../components/ui/Avatar';

export default function ProfileScreen() {
  const api = getClient();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const res = await api.get('/users/me');
      setUser(res.data);
      setPhotos(res.data.photos || []);
      setFormData({
        display_name: res.data.display_name,
        bio: res.data.bio || '',
        city: res.data.city || '',
        country: res.data.country || '',
        education: res.data.education || '',
        profession: res.data.profession || '',
      });
    } catch (err: any) {
      setError('فشل تحميل الملف الشخصي');
    }
  }

  async function saveProfile() {
    try {
      setError(null);
      await api.put('/users/me', formData);
      setSuccess('تم حفظ التغييرات بنجاح');
      setEditing(false);
      loadProfile();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل حفظ التغييرات');
    }
  }

  async function addPhoto() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { setError('يرجى السماح بالوصول للصور'); return; }
      
      const sel = await ImagePicker.launchImageLibraryAsync({ 
        allowsMultipleSelection: false, 
        quality: 0.8, 
        mediaTypes: ['images'] 
      });
      
      if (sel.canceled) return;
      
      const form = new FormData();
      form.append('photos', {
        uri: sel.assets[0].uri,
        name: 'photo.jpg',
        type: 'image/jpeg',
      } as any);
      
      const res = await api.put('/photos/me/photos', form, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      setPhotos(res.data.photos || []);
      setSuccess('تمت إضافة الصورة بنجاح');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل رفع الصورة');
    }
  }

  async function deletePhoto(photoId: string) {
    try {
      await api.delete(`/photos/me/photos/${photoId}`);
      setPhotos(photos.filter(p => p.id !== photoId));
      setSuccess('تم حذف الصورة');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError('فشل حذف الصورة');
    }
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>جاري التحميل...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: spacing(4) }}>
      <Text style={styles.header}>الملف الشخصي</Text>

      <ErrorMessage message={error} type="error" />
      <ErrorMessage message={success} type="success" />

      {/* Profile Card Preview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>معاينة البطاقة</Text>
        <View style={styles.previewCard}>
          {photos[0]?.url ? (
            <ImageBackground 
              source={{ uri: `${api.defaults.baseURL}${photos[0].url}` }} 
              style={styles.previewImage}
            />
          ) : (
            <View style={styles.previewImage}>
              <Avatar label={user.display_name} size={120} style={{ alignSelf: 'center', marginTop: spacing(8) }} />
            </View>
          )}
          <View style={styles.previewInfo}>
            <Text style={styles.previewName}>{user.display_name}, {calculateAge(user.dob)}</Text>
            <Text style={styles.previewDetails}>
              {user.city && user.country && `📍 ${user.city}, ${user.country}`}
            </Text>
            {user.profession && <Text style={styles.previewDetails}>💼 {user.profession}</Text>}
            {user.bio && <Text style={styles.previewBio}>{user.bio}</Text>}
          </View>
        </View>
      </View>

      {/* Photos Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الصور ({photos.length}/5)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
          {photos.map((photo, idx) => (
            <View key={photo.id} style={styles.photoContainer}>
              <Image 
                source={{ uri: `${api.defaults.baseURL}${photo.url}` }} 
                style={styles.photoThumb} 
              />
              <TouchableOpacity 
                style={styles.deletePhotoBtn} 
                onPress={() => deletePhoto(photo.id)}
              >
                <Ionicons name="close-circle" size={24} color="#ef4444" />
              </TouchableOpacity>
              {idx === 0 && <View style={styles.mainBadge}><Text style={styles.mainBadgeText}>رئيسية</Text></View>}
            </View>
          ))}
          {photos.length < 5 && (
            <TouchableOpacity style={styles.addPhotoBtn} onPress={addPhoto}>
              <Ionicons name="add" size={32} color={colors.text} />
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Edit Profile */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>المعلومات الشخصية</Text>
          <TouchableOpacity onPress={() => editing ? saveProfile() : setEditing(true)}>
            <Ionicons name={editing ? 'checkmark' : 'pencil'} size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {editing ? (
          <>
            <TextInput 
              style={styles.input} 
              placeholder="الاسم" 
              value={formData.display_name} 
              onChangeText={(text) => setFormData({...formData, display_name: text})}
            />
            <TextInput 
              style={styles.input} 
              placeholder="المدينة" 
              value={formData.city} 
              onChangeText={(text) => setFormData({...formData, city: text})}
            />
            <TextInput 
              style={styles.input} 
              placeholder="الدولة" 
              value={formData.country} 
              onChangeText={(text) => setFormData({...formData, country: text})}
            />
            <TextInput 
              style={styles.input} 
              placeholder="التعليم" 
              value={formData.education} 
              onChangeText={(text) => setFormData({...formData, education: text})}
            />
            <TextInput 
              style={styles.input} 
              placeholder="المهنة" 
              value={formData.profession} 
              onChangeText={(text) => setFormData({...formData, profession: text})}
            />
            <TextInput 
              style={styles.inputArea} 
              placeholder="نبذة عنك" 
              value={formData.bio} 
              onChangeText={(text) => setFormData({...formData, bio: text})}
              multiline
              numberOfLines={4}
            />
            <View style={styles.editActions}>
              <Button title="حفظ" onPress={saveProfile} />
              <Button title="إلغاء" variant="outline" onPress={() => { setEditing(false); loadProfile(); }} />
            </View>
          </>
        ) : (
          <View style={styles.infoCard}>
            <InfoRow icon="person" label="الاسم" value={user.display_name} />
            <InfoRow icon="location" label="الموقع" value={`${user.city || '—'}, ${user.country || '—'}`} />
            <InfoRow icon="school" label="التعليم" value={user.education || '—'} />
            <InfoRow icon="briefcase" label="المهنة" value={user.profession || '—'} />
            <InfoRow icon="document-text" label="النبذة" value={user.bio || '—'} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: any) {
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

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  return now.getFullYear() - birth.getFullYear() - ((now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) ? 1 : 0);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loading: { color: colors.text, textAlign: 'center', marginTop: spacing(4) },
  header: { color: colors.text, fontSize: 28, fontWeight: '700', padding: spacing(2), textAlign: 'right' },
  section: { marginBottom: spacing(3), paddingHorizontal: spacing(2) },
  sectionHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing(1) },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: spacing(1), textAlign: 'right' },
  previewCard: { backgroundColor: colors.card, borderRadius: radii.xl, overflow: 'hidden', ...shadows.card },
  previewImage: { width: '100%', height: 300, backgroundColor: colors.surface, justifyContent: 'flex-end' },
  previewInfo: { padding: spacing(2) },
  previewName: { color: colors.text, fontSize: 24, fontWeight: '700', textAlign: 'right' },
  previewDetails: { color: colors.subtext, fontSize: 14, marginTop: spacing(0.5), textAlign: 'right' },
  previewBio: { color: colors.text, fontSize: 14, marginTop: spacing(1), textAlign: 'right' },
  photosScroll: { flexDirection: 'row-reverse' },
  photoContainer: { position: 'relative', marginLeft: spacing(1) },
  photoThumb: { width: 100, height: 140, borderRadius: radii.md, backgroundColor: colors.surface },
  deletePhotoBtn: { position: 'absolute', top: 4, right: 4 },
  mainBadge: { position: 'absolute', bottom: 4, left: 4, backgroundColor: colors.accent, paddingHorizontal: spacing(1), paddingVertical: 2, borderRadius: radii.sm },
  mainBadgeText: { color: '#000', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  addPhotoBtn: { width: 100, height: 140, borderRadius: radii.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed' },
  input: { backgroundColor: colors.surface, color: colors.text, borderRadius: radii.md, height: 48, paddingHorizontal: spacing(2), marginBottom: spacing(1), textAlign: 'right' },
  inputArea: { backgroundColor: colors.surface, color: colors.text, borderRadius: radii.md, padding: spacing(2), marginBottom: spacing(1), textAlign: 'right', minHeight: 100 },
  editActions: { flexDirection: 'row-reverse', gap: spacing(1), marginTop: spacing(1) },
  infoCard: { backgroundColor: colors.card, borderRadius: radii.md, padding: spacing(2), ...shadows.soft },
  infoRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', marginBottom: spacing(2) },
  infoContent: { flex: 1, marginRight: spacing(1.5) },
  infoLabel: { color: colors.subtext, fontSize: 12, textAlign: 'right' },
  infoValue: { color: colors.text, fontSize: 16, marginTop: 2, textAlign: 'right' },
});
