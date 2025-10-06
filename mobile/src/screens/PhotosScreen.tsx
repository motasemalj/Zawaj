import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Button from '../components/ui/Button';
import { colors, radii, spacing } from '../theme';
import { getClient } from '../api/client';

export default function PhotosScreen({ navigation }: any) {
  const api = getClient();
  const [picked, setPicked] = useState<string[]>([]);
  const [blurred, setBlurred] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick() {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, mediaTypes: ['images'], quality: 0.8, selectionLimit: 5 });
      if (!res.canceled) {
        const uris = res.assets.map(a => a.uri);
        setPicked(uris);
      }
    } catch (e) {
      setError('فشل اختيار الصور (غير متاح على الويب)');
    }
  }

  async function upload() {
    if (picked.length === 0) {
      // Skip photos and continue
      navigation.replace('Details');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const form = new FormData();
      picked.forEach((uri, idx) => {
        const name = `photo-${idx}.jpg`;
        // @ts-ignore
        form.append('photos', { uri, name, type: 'image/jpeg' });
      });
      await api.put('/photos/me/photos', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (blurred) await api.put('/photos/me/photos/privacy', { blur: true });
      navigation.replace('Details');
    } catch (e: any) {
      setError('فشل رفع الصور. جرب لاحقاً أو تخطّ الخطوة.');
    } finally {
      setSaving(false);
    }
  }

  function skip() {
    navigation.replace('Details');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>الصور</Text>
      <Text style={styles.subtitle}>اختياري - يمكنك إضافتها لاحقاً</Text>
      <View style={styles.grid}>
        {picked.map((u, i) => (
          <Image key={i} source={{ uri: u }} style={styles.photo} />
        ))}
      </View>
      <View style={{ height: spacing(1) }} />
      <Button title="اختيار صور" variant="outline" onPress={pick} />
      <View style={{ height: spacing(1) }} />
      <TouchableOpacity style={[styles.toggle, blurred && { backgroundColor: colors.accent }]} onPress={() => setBlurred(!blurred)}>
        <Text style={{ color: blurred ? '#000' : colors.text }}>تفعيل التمويه</Text>
      </TouchableOpacity>
      <View style={{ height: spacing(1) }} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title={saving ? 'جارٍ الحفظ...' : picked.length > 0 ? 'حفظ والمتابعة' : 'تخطي'} onPress={upload} disabled={saving} />
      <View style={{ height: spacing(1) }} />
      <Button title="تخطي" variant="ghost" onPress={skip} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing(2) },
  title: { color: colors.text, fontSize: 20, textAlign: 'center', marginBottom: spacing(1) },
  subtitle: { color: colors.subtext, textAlign: 'center', marginBottom: spacing(2) },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing(1) },
  photo: { width: '31%', aspectRatio: 1, borderRadius: radii.md },
  toggle: { alignSelf: 'center', backgroundColor: colors.chip, paddingHorizontal: spacing(2), paddingVertical: spacing(1), borderRadius: radii.pill },
  error: { color: colors.danger, textAlign: 'center', marginBottom: spacing(1) },
});


