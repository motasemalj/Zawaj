import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../../theme';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import GradientBackground from '../../components/ui/GradientBackground';
import { getClient } from '../../api/client';
import { BlurView } from 'expo-blur';

type Step3Props = {
  onComplete: (images: string[]) => void;
  onBack: () => void;
};

export default function Step3ProfilePhotos({ onComplete, onBack }: Step3Props) {
  const [images, setImages] = useState<string[]>([]);
  const [photosBlurred, setPhotosBlurred] = useState(false);
  const [updatingBlur, setUpdatingBlur] = useState(false);
  const insets = useSafeAreaInsets();

  const MAX_PHOTOS = 6;

  useEffect(() => {
    (async () => {
      try {
        const api = getClient();
        const me = (await api.get('/users/me')).data;
        setPhotosBlurred(!!me.photos_blurred);
      } catch {}
    })();
  }, []);

  const pickImages = async () => {
    if (images.length >= MAX_PHOTOS) {
      Alert.alert('الحد الأقصى للصور', `يمكنك تحميل ${MAX_PHOTOS} صور كحد أقصى.`);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('إذن مطلوب', 'إذن مكتبة الصور مطلوب.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
      allowsMultipleSelection: true,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.slice(0, MAX_PHOTOS - images.length).map(asset => asset.uri);
      setImages([...images, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    if (images.length === 0) return;
    onComplete(images);
  };

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing(3), paddingBottom: insets.bottom + spacing(2) }]}>
        <View style={styles.header}>
          <ProgressBar current={3} total={8} />
          <Text style={styles.step}>الخطوة 3 من 8</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="arrow-forward" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>أضف صورك</Text>
          </View>
          <Text style={styles.subtitle}>
            حمّل صورة واحدة على الأقل. يمكنك إخفاء الصور من هنا.
          </Text>

          
          <View style={styles.privacyRow}>
            <View style={styles.privacyInfo}>
              <Ionicons name={photosBlurred ? 'eye-off' : 'eye'} size={20} color={colors.accent} />
              <Text style={styles.privacyLabel}>إخفاء جميع الصور</Text>
            </View>
            <Switch
              value={photosBlurred}
              onValueChange={async (val) => {
                try {
                  setUpdatingBlur(true);
                  setPhotosBlurred(val);
                  const api = getClient();
                  await api.put('/users/me', { photos_blurred: val });
                } catch {
                  setPhotosBlurred((prev) => !prev);
                } finally {
                  setUpdatingBlur(false);
                }
              }}
              trackColor={{ true: colors.accent, false: colors.border }}
              thumbColor="#fff"
              disabled={updatingBlur}
            />
          </View>

          <Text style={styles.blurHint}>
            يمكنك إلغاء إخفاء الصور لاحقاً في أي وقت.
          </Text>

          <View style={styles.counterHeader}>
            <Text style={styles.photoCounterLabel}>الصور المرفوعة</Text>
            <View style={styles.photoCounterBadge}>
              <Text style={styles.photoCounterText}>{images.length} / {MAX_PHOTOS}</Text>
            </View>
          </View>

          <View style={styles.photosGrid}>
            {images.length < MAX_PHOTOS && (
              <TouchableOpacity style={styles.addPhotoButton} onPress={pickImages} activeOpacity={0.8}>
                <View style={styles.addPhotoContent}>
                  <Ionicons name="image-outline" size={26} color={colors.accent} />
                  <Text style={styles.addPhotoText}>أضف صورة</Text>
                </View>
              </TouchableOpacity>
            )}
            {images.map((uri, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image source={{ uri }} style={styles.photo} />
                {photosBlurred && (
                  <BlurView intensity={75} tint="dark" style={StyleSheet.absoluteFill as any} />
                )}
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close" size={18} color="#fff" />
                </TouchableOpacity>
                {index > 0 && (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => {
                      setImages((prev) => {
                        const copy = [...prev];
                        const [chosen] = copy.splice(index, 1);
                        return [chosen, ...copy];
                      });
                    }}
                  >
                    <Ionicons name="star-outline" size={18} color="#fff" />
                  </TouchableOpacity>
                )}
                {index === 0 && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryText}>رئيسية</Text>
                  </View>
                )}
                {photosBlurred && (
                  <View style={styles.blurredBadge}>
                    <Ionicons name="eye-off" size={14} color="#fff" />
                    <Text style={styles.blurredText}>مخفية</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            title="متابعة"
            onPress={handleContinue}
            disabled={images.length === 0}
            variant="gradient"
          />
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing(3),
  },
  privacyRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing(1.5),
    marginBottom: spacing(2),
    borderWidth: 1,
    borderColor: colors.border,
  },
  privacyInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing(1),
  },
  privacyLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  toggleBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing(1.5),
    borderWidth: 2,
    borderColor: colors.accent,
  },
  toggleBtnActive: {
    backgroundColor: colors.surface,
    borderColor: colors.accent,
  },
  header: {
    marginBottom: spacing(3),
  },
  step: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing(1),
    textAlign: 'center',
  },
  content: {
    // Removed flex: 1 to let content flow naturally
  },
  titleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing(1.5),
    marginBottom: spacing(1),
  },
  backButton: {
    padding: spacing(0.5),
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    color: colors.subtext,
    fontSize: 16,
    marginBottom: spacing(2),
    lineHeight: 24,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  blurHint: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: spacing(2),
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  guidelinesContainer: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing(2.5),
    marginBottom: spacing(3),
    gap: spacing(1.5),
  },
  guideline: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  guidelineText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginLeft: spacing(1.5),
  },
  counterHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing(2.5),
  },
  photoCounterLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  photoCounterBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(0.75),
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoCounterText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  photosGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing(2),
    marginTop: spacing(1),
    justifyContent: 'flex-start',
    alignContent: 'flex-start',
    alignItems: 'flex-start',
  },
  photoContainer: {
    position: 'relative',
    flexBasis: '48%',
    maxWidth: '48%',
    aspectRatio: 3 / 4,
    borderRadius: radii.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    backgroundColor: colors.card,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: radii.lg,
  },
  removeButton: {
    position: 'absolute',
    top: spacing(1),
    right: spacing(1),
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: radii.pill,
    padding: spacing(0.25),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  primaryButton: {
    position: 'absolute',
    top: spacing(1),
    left: spacing(1),
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing(0.75),
    paddingVertical: spacing(0.5),
  },
  primaryBadge: {
    position: 'absolute',
    bottom: spacing(1),
    left: spacing(1),
    backgroundColor: colors.accent,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.75),
    borderRadius: radii.md,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 2,
  },
  primaryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  blurredBadge: {
    position: 'absolute',
    top: spacing(1),
    right: spacing(5),
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing(1),
    paddingVertical: spacing(0.5),
    borderRadius: radii.md,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing(0.5),
  },
  blurredText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  addPhotoButton: {
    flexBasis: '48%',
    maxWidth: '48%',
    aspectRatio: 3 / 4,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.accent + '40',
    borderStyle: 'dashed',
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  addPhotoContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(1),
  },
  addPhotoText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    marginTop: spacing(3),
    paddingTop: spacing(2),
  },
});

