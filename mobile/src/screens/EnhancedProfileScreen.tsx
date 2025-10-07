import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  TextInput, 
  ImageBackground,
  Alert,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import { getClient } from '../api/client';
import { colors, radii, spacing, shadows } from '../theme';
import Button from '../components/ui/Button';
import ErrorMessage from '../components/ui/ErrorMessage';
import Avatar from '../components/ui/Avatar';
import GradientBackground from '../components/ui/GradientBackground';
import PhotoPickerModal from '../components/ui/PhotoPickerModal';
import { useCurrentUser, useOnboardingOptions, useUpdateProfile, useUploadPhoto, useDeletePhoto, useReorderPhotos } from '../api/hooks';

interface PhotoItem {
  id: string;
  url: string;
  ordering: number;
}

export default function EnhancedProfileScreen() {
  const api = getClient();
  const insets = useSafeAreaInsets();
  
  // React Query hooks
  const { data: userData, isLoading: userLoading, error: userError } = useCurrentUser();
  const { data: optionsData } = useOnboardingOptions();
  const updateProfileMutation = useUpdateProfile();
  const uploadPhotoMutation = useUploadPhoto();
  const deletePhotoMutation = useDeletePhoto();
  const reorderPhotosMutation = useReorderPhotos();
  
  // Show error if query fails
  useEffect(() => {
    if (userError) {
      const err = userError as any;
      console.error('Profile screen error:', err.response?.status, err.message);
      setError('فشل تحميل الملف الشخصي');
    }
  }, [userError]);
  
  const user = userData;
  const options = optionsData || {};
  const photos = (user?.photos || []).sort((a: any, b: any) => a.ordering - b.ordering);
  
  const [photosBlurred, setPhotosBlurred] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingDemographics, setEditingDemographics] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);

  // Sync state from user data
  useEffect(() => {
    if (user) {
      setPhotosBlurred(user.photos_blurred || false);
      setFormData({
        bio: user.bio || '',
        ethnicity: user.ethnicity || '',
        marriage_timeline: user.marriage_timeline || '',
        sect: user.sect || '',
        children_preference: user.children_preference || '',
        want_children: user.want_children || '',
        relocate: user.relocate || false,
        profession: user.profession || '',
        education: user.education || '',
        hometown: `${user.city || ''}, ${user.country || ''}`.replace(/^, |, $/, ''),
        smoker: user.smoker || '',
        marital_status: user.marital_status || '',
      });
    }
  }, [user]);


  function saveAboutMe() {
    setError(null);
    const updateData: any = {
      bio: formData.bio,
      ethnicity: formData.ethnicity,
      marriage_timeline: formData.marriage_timeline,
      sect: formData.sect,
      children_preference: formData.children_preference,
      want_children: formData.want_children,
      relocate: formData.relocate,
    };
    
    updateProfileMutation.mutate(updateData, {
      onSuccess: () => {
        setSuccess('تم حفظ التغييرات بنجاح');
        setEditing(false);
        setTimeout(() => setSuccess(null), 3000);
      },
      onError: (err: any) => {
        setError(err.response?.data?.message || 'فشل حفظ التغييرات');
      },
    });
  }

  function saveDemographics() {
    setError(null);
    const [city, country] = formData.hometown.split(',').map((s: string) => s.trim());
    const updateData: any = {
      profession: formData.profession,
      education: formData.education,
      city: city || formData.hometown,
      country: country || '',
      smoker: formData.smoker,
      marital_status: formData.marital_status,
    };
    
    updateProfileMutation.mutate(updateData, {
      onSuccess: () => {
        setSuccess('تم حفظ التغييرات بنجاح');
        setEditingDemographics(false);
        setTimeout(() => setSuccess(null), 3000);
      },
      onError: (err: any) => {
        setError(err.response?.data?.message || 'فشل حفظ التغييرات');
      },
    });
  }

  function showPhotoPickerModal() {
    setShowPhotoPicker(true);
  }

  function handleImageSelected(uri: string) {
    if (photos.length >= 5) {
      setError('الحد الأقصى 5 صور');
      return;
    }
    
    const form = new FormData();
    form.append('photos', {
      uri: uri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    } as any);
    
    uploadPhotoMutation.mutate(form, {
      onSuccess: () => {
        setSuccess('تمت إضافة الصورة بنجاح');
        setTimeout(() => setSuccess(null), 3000);
      },
      onError: (err: any) => {
        setError(err.response?.data?.message || 'فشل رفع الصورة');
      },
    });
  }

  function deletePhoto(photoId: string) {
    if (photos.length <= 1) {
      Alert.alert('لا يمكن الحذف', 'يجب أن تحتوي على صورة واحدة على الأقل في ملفك.');
      return;
    }
    Alert.alert(
      'حذف الصورة',
      'هل أنت متأكد من حذف هذه الصورة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'حذف', 
          style: 'destructive',
          onPress: () => {
            deletePhotoMutation.mutate(photoId, {
              onSuccess: () => {
                setSuccess('تم حذف الصورة');
                setTimeout(() => setSuccess(null), 3000);
              },
              onError: () => {
                setError('فشل حذف الصورة');
              },
            });
          }
        }
      ]
    );
  }

  function movePhoto(photoId: string, direction: 'left' | 'right') {
    const currentIndex = photos.findIndex(p => p.id === photoId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= photos.length) return;
    
    // Swap photos
    const newPhotos = [...photos];
    [newPhotos[currentIndex], newPhotos[newIndex]] = [newPhotos[newIndex], newPhotos[currentIndex]];
    
    // Update ordering
    const reordered = newPhotos.map((p, idx) => ({ ...p, ordering: idx }));
    
    // Send to backend
    const photosToReorder = reordered.map((p, idx) => ({ id: p.id, order: idx }));
    reorderPhotosMutation.mutate({ photos: photosToReorder }, {
      onError: () => {
        setError('فشل إعادة ترتيب الصور');
      },
    });
  }

  function toggleBlur() {
    const newBlurState = !photosBlurred;
    setPhotosBlurred(newBlurState); // Optimistic update
    
    updateProfileMutation.mutate({ photos_blurred: newBlurState }, {
      onSuccess: () => {
        setSuccess(newBlurState ? 'تم إخفاء الصور' : 'تم إظهار الصور');
        setTimeout(() => setSuccess(null), 3000);
      },
      onError: () => {
        setPhotosBlurred(!newBlurState); // Revert on error
        setError('فشل تغيير حالة الإخفاء');
      },
    });
  }

  if (userLoading || !user) {
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <Text style={styles.loading}>جاري التحميل...</Text>
        </View>
      </GradientBackground>
    );
  }

  const renderPhotoItem = (item: PhotoItem, index: number) => (
    <View key={item.id} style={styles.photoContainer}>
      <ImageBackground
        source={{ uri: `${api.defaults.baseURL}${item.url}` }}
        style={styles.photoThumb}
        imageStyle={{ borderRadius: radii.lg }}
      >
        {photosBlurred && (
          <BlurView intensity={75} style={styles.blurOverlay} tint="dark">
            <Ionicons name="eye-off" size={24} color="#fff" />
          </BlurView>
        )}
      </ImageBackground>
      
      <TouchableOpacity 
        style={styles.deletePhotoBtn} 
        onPress={() => deletePhoto(item.id)}
      >
        <Ionicons name="close-circle" size={28} color="#ef4444" />
      </TouchableOpacity>
      
      {/* Reorder buttons */}
      <View style={styles.reorderButtons}>
        {index > 0 && (
          <TouchableOpacity 
            style={styles.reorderBtn}
            onPress={() => movePhoto(item.id, 'left')}
          >
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
        )}
        {index < photos.length - 1 && (
          <TouchableOpacity 
            style={styles.reorderBtn}
            onPress={() => movePhoto(item.id, 'right')}
          >
            <Ionicons name="chevron-back" size={18} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
      
      {item.ordering === 0 && (
        <View style={styles.mainBadge}>
          <Text style={styles.mainBadgeText}>رئيسية</Text>
        </View>
      )}
    </View>
  );

  const personalityTraits = user.personality_traits ? 
    (typeof user.personality_traits === 'string' ? 
      JSON.parse(user.personality_traits) : 
      user.personality_traits) : 
    [];

  return (
    <GradientBackground>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={{ paddingTop: insets.top + spacing(2), paddingBottom: spacing(6) }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>الملف الشخصي</Text>

        <ErrorMessage message={error} type="error" />
        <ErrorMessage message={success} type="success" />

        {/* Card Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>معاينة البطاقة</Text>
            <View style={styles.badge}>
              <Ionicons name="eye" size={14} color={colors.text} />
              <Text style={styles.badgeText}>كيف سيراك الآخرون</Text>
            </View>
          </View>
          <View style={styles.previewCard}>
            {photos[0]?.url ? (
              <ImageBackground 
                source={{ uri: `${api.defaults.baseURL}${photos[0].url}` }} 
                style={styles.previewImage}
                imageStyle={{ borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl }}
              >
                {photosBlurred && (
                  <BlurView intensity={75} style={styles.previewBlurOverlay} tint="dark">
                    <Ionicons name="eye-off" size={48} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.blurText}>الصور مخفية</Text>
                  </BlurView>
                )}
                {/* Personality Traits Overlay */}
                {personalityTraits.length > 0 && !photosBlurred && (
                  <View style={styles.traitsOverlay}>
                    {personalityTraits.slice(0, 3).map((trait: string, idx: number) => (
                      <View key={idx} style={styles.traitChip}>
                        <Text style={styles.traitText}>{trait}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </ImageBackground>
            ) : (
              <View style={styles.previewImage}>
                <Avatar label={user.display_name || user.first_name} size={100} style={{ alignSelf: 'center', marginBottom: spacing(2) }} />
              </View>
            )}
            <View style={styles.previewInfo}>
              <Text style={styles.previewName}>
                {user.first_name || user.display_name}, {calculateAge(user.dob)}
              </Text>
              <View style={styles.previewDetailsRow}>
                {user.city && user.country && (
                  <View style={styles.previewDetailItem}>
                    <Ionicons name="location" size={16} color={colors.subtext} />
                    <Text style={styles.previewDetails}>{user.city}, {user.country}</Text>
                  </View>
                )}
                {user.ethnicity && (
                  <View style={styles.previewDetailItem}>
                    <Text style={styles.previewDetails}>الأصل: {user.ethnicity}</Text>
                  </View>
                )}
              </View>
              {user.bio && <Text style={styles.previewBio} numberOfLines={2}>{user.bio}</Text>}
            </View>
          </View>
        </View>

        {/* Photos Management */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>إدارة الصور ({photos.length}/5)</Text>
            <TouchableOpacity 
              onPress={toggleBlur} 
              style={[styles.blurToggle, photosBlurred && styles.blurToggleActive]}
            >
              <Ionicons name={photosBlurred ? "eye-off" : "eye"} size={16} color={photosBlurred ? '#fff' : colors.text} />
              <Text style={[styles.blurToggleText, photosBlurred && styles.blurToggleTextActive]}>
                {photosBlurred ? 'مخفية' : 'ظاهرة'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.photosHint}>استخدم الأسهم لإعادة الترتيب • الصورة الأولى هي الرئيسية</Text>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: spacing(1) }}
            contentContainerStyle={[styles.photosContainer, { flexDirection: 'row-reverse' }]}
            inverted
          >
            {photos.map((photo, index) => renderPhotoItem(photo, index))}
          </ScrollView>
          
          {photos.length < 5 && (
            <TouchableOpacity style={styles.addPhotoButton} onPress={showPhotoPickerModal}>
              <Ionicons name="add-circle" size={32} color={colors.accent} />
              <Text style={styles.addPhotoText}>أضف صورة جديدة</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Non-Editable Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معلومات أساسية</Text>
          <View style={styles.infoCard}>
            <InfoRow icon="person" label="الاسم" value={user.first_name || user.display_name} locked />
            <InfoRow icon="calendar" label="تاريخ الميلاد" value={formatDate(user.dob)} locked />
            <InfoRow icon="location" label="الموقع الحالي" value={`${user.city || '—'}, ${user.country || '—'}`} locked />
            {user.role && (
              <InfoRow 
                icon={user.role === 'male' ? 'male' : user.role === 'female' ? 'female' : 'people'} 
                label="نوع الحساب" 
                value={user.role === 'male' ? 'ذكر' : user.role === 'female' ? 'أنثى' : 'أم'} 
                locked 
              />
            )}
          </View>
        </View>

        {/* Editable: Demographics (Step 4) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>المعلومات الديموغرافية</Text>
            <TouchableOpacity 
              onPress={() => editingDemographics ? saveDemographics() : setEditingDemographics(true)}
              style={styles.editButton}
            >
              <Ionicons name={editingDemographics ? 'checkmark-circle' : 'create'} size={24} color={colors.accent} />
            </TouchableOpacity>
          </View>

          {editingDemographics ? (
            <View style={styles.editCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>المهنة *</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="مثال: مهندس برمجيات" 
                  placeholderTextColor={colors.muted}
                  value={formData.profession} 
                  onChangeText={(text) => setFormData({...formData, profession: text})}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>المستوى التعليمي *</Text>
                <View style={styles.chipRow}>
                  {options.education_levels?.map((level: string) => (
                    <TouchableOpacity 
                      key={level}
                      style={[styles.chip, formData.education === level && styles.chipActive]}
                      onPress={() => setFormData({...formData, education: level})}
                    >
                      <Text style={[styles.chipText, formData.education === level && styles.chipTextActive]}>
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>مكان النشأة *</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="مثال: عمّان، الأردن" 
                  placeholderTextColor={colors.muted}
                  value={formData.hometown} 
                  onChangeText={(text) => setFormData({...formData, hometown: text})}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>التدخين *</Text>
                <View style={styles.chipRow}>
                  {options.smoking_options?.map((option: string) => (
                    <TouchableOpacity 
                      key={option}
                      style={[styles.chip, formData.smoker === option && styles.chipActive]}
                      onPress={() => setFormData({...formData, smoker: option})}
                    >
                      <Text style={[styles.chipText, formData.smoker === option && styles.chipTextActive]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>الحالة الاجتماعية *</Text>
                <View style={styles.chipRow}>
                  {options.marital_status_options?.map((status: string) => (
                    <TouchableOpacity 
                      key={status}
                      style={[styles.chip, formData.marital_status === status && styles.chipActive]}
                      onPress={() => setFormData({...formData, marital_status: status})}
                    >
                      <Text style={[styles.chipText, formData.marital_status === status && styles.chipTextActive]}>
                        {status}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.editActions}>
                <Button title="حفظ التغييرات" onPress={saveDemographics} />
                <Button 
                  title="إلغاء" 
                  variant="outline" 
                  onPress={() => { setEditingDemographics(false); loadProfile(); }} 
                />
              </View>
            </View>
          ) : (
            <View style={styles.infoCard}>
              <InfoRow icon="briefcase" label="المهنة" value={user.profession || '—'} />
              <InfoRow icon="school" label="التعليم" value={user.education || '—'} />
              <InfoRow icon="home" label="مكان النشأة" value={`${user.city || '—'}, ${user.country || '—'}`} />
              <InfoRow icon="ban" label="التدخين" value={user.smoker || '—'} />
              <InfoRow icon="heart" label="الحالة الاجتماعية" value={user.marital_status || '—'} />
            </View>
          )}
        </View>

        {/* Editable: About Me (Step 5) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>عني وقيمي</Text>
            <TouchableOpacity 
              onPress={() => editing ? saveAboutMe() : setEditing(true)}
              style={styles.editButton}
            >
              <Ionicons name={editing ? 'checkmark-circle' : 'create'} size={24} color={colors.accent} />
            </TouchableOpacity>
          </View>

          {editing ? (
            <View style={styles.editCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>نبذة عني (اختياري)</Text>
                <TextInput 
                  style={[styles.input, styles.textArea]} 
                  placeholder="اكتب نبذة مختصرة عنك..." 
                  placeholderTextColor={colors.muted}
                  value={formData.bio} 
                  onChangeText={(text) => setFormData({...formData, bio: text})}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>الأصل *</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.originScroll}
                  contentContainerStyle={{ flexDirection: 'row-reverse' }}
                >
                  {options.arabic_origins?.map((item: any) => (
                    <TouchableOpacity 
                      key={item.name}
                      style={[styles.originChip, formData.ethnicity === item.name && styles.originChipActive]}
                      onPress={() => setFormData({...formData, ethnicity: item.name})}
                    >
                      <Text style={styles.originFlag}>{item.flag}</Text>
                      <Text style={[styles.originName, formData.ethnicity === item.name && styles.originNameActive]}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>المذهب *</Text>
                <View style={styles.chipRow}>
                  {options.sects?.map((sect: string) => (
                    <TouchableOpacity 
                      key={sect}
                      style={[styles.chip, formData.sect === sect && styles.chipActive]}
                      onPress={() => setFormData({...formData, sect: sect})}
                    >
                      <Text style={[styles.chipText, formData.sect === sect && styles.chipTextActive]}>
                        {sect}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>الزواج خلال *</Text>
                <View style={styles.chipRow}>
                  {options.marriage_timelines?.map((timeline: string) => (
                    <TouchableOpacity 
                      key={timeline}
                      style={[styles.chip, formData.marriage_timeline === timeline && styles.chipActive]}
                      onPress={() => setFormData({...formData, marriage_timeline: timeline})}
                    >
                      <Text style={[styles.chipText, formData.marriage_timeline === timeline && styles.chipTextActive]}>
                        {timeline}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>هل لديك أطفال؟ *</Text>
                <View style={styles.chipRow}>
                  {options.have_children_options?.map((option: string) => (
                    <TouchableOpacity 
                      key={option}
                      style={[styles.chip, formData.children_preference === option && styles.chipActive]}
                      onPress={() => setFormData({...formData, children_preference: option})}
                    >
                      <Text style={[styles.chipText, formData.children_preference === option && styles.chipTextActive]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>تريد أطفال في المستقبل؟ *</Text>
                <View style={styles.chipRow}>
                  {options.children_preferences?.map((pref: string) => (
                    <TouchableOpacity 
                      key={pref}
                      style={[styles.chip, formData.want_children === pref && styles.chipActive]}
                      onPress={() => setFormData({...formData, want_children: pref})}
                    >
                      <Text style={[styles.chipText, formData.want_children === pref && styles.chipTextActive]}>
                        {pref}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>هل تقبل الانتقال للخارج؟ *</Text>
                <View style={styles.chipRow}>
                  <TouchableOpacity 
                    style={[styles.chip, formData.relocate === true && styles.chipActive]}
                    onPress={() => setFormData({...formData, relocate: true})}
                  >
                    <Text style={[styles.chipText, formData.relocate === true && styles.chipTextActive]}>
                      نعم
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.chip, formData.relocate === false && styles.chipActive]}
                    onPress={() => setFormData({...formData, relocate: false})}
                  >
                    <Text style={[styles.chipText, formData.relocate === false && styles.chipTextActive]}>
                      لا
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.editActions}>
                <Button title="حفظ التغييرات" onPress={saveAboutMe} />
                <Button 
                  title="إلغاء" 
                  variant="outline" 
                  onPress={() => { setEditing(false); loadProfile(); }} 
                />
              </View>
            </View>
          ) : (
            <View style={styles.infoCard}>
              {user.bio && <InfoRow icon="document-text" label="النبذة" value={user.bio} />}
              <InfoRow icon="flag" label="الأصل" value={user.ethnicity || '—'} />
              <InfoRow icon="moon" label="المذهب" value={getDisplayValue('sect', user.sect)} />
              <InfoRow icon="time" label="الزواج خلال" value={getDisplayValue('marriage_timeline', user.marriage_timeline)} />
              <InfoRow icon="people" label="لديك أطفال" value={getDisplayValue('children_preference', user.children_preference)} />
              <InfoRow icon="heart" label="تريد أطفال" value={getDisplayValue('want_children', user.want_children)} />
              <InfoRow icon="airplane" label="الانتقال للخارج" value={user.relocate ? 'نعم' : 'لا'} />
            </View>
          )}
        </View>
        </ScrollView>
        
        <PhotoPickerModal
          visible={showPhotoPicker}
          onClose={() => setShowPhotoPicker(false)}
          onImageSelected={handleImageSelected}
          maxPhotos={5}
          currentPhotoCount={photos.length}
        />
      </GradientBackground>
    );
  }

function InfoRow({ icon, label, value, locked }: any) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconContainer}>
        <Ionicons name={icon} size={20} color={colors.accent} />
        {locked && (
          <View style={styles.lockBadge}>
            <Ionicons name="lock-closed" size={10} color={colors.muted} />
          </View>
        )}
      </View>
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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Helper to convert enum values to user-friendly Arabic labels
function getDisplayValue(field: string, value: string | null | undefined): string {
  if (!value) return '—';
  
  const mappings: Record<string, Record<string, string>> = {
    marriage_timeline: {
      'within_6_months': 'خلال 6 أشهر',
      '6_12_months': '6-12 شهر',
      '1_2_years': '1-2 سنة',
      '2plus_years': 'أكثر من سنتين',
      'open': 'مفتوح للتوقيت'
    },
    sect: {
      'sunni': 'سني',
      'shia': 'شيعي',
      'other': 'آخر'
    },
    children_preference: {
      'yes': 'نعم',
      'no': 'لا'
    },
    want_children: {
      'yes': 'نعم',
      'no': 'لا',
      'maybe': 'ربما'
    }
  };
  
  return mappings[field]?.[value] || value;
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
  sectionHeader: { 
    flexDirection: 'row-reverse', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: spacing(1.5),
  },
  sectionTitle: { 
    color: colors.text, 
    fontSize: 20, 
    fontWeight: '700', 
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  badge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.5),
    borderRadius: radii.pill,
    gap: spacing(0.5),
  },
  badgeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Card Preview
  previewCard: { 
    backgroundColor: colors.card, 
    borderRadius: radii.xl, 
    overflow: 'hidden', 
    ...shadows.card,
  },
  previewImage: { 
    width: '100%', 
    height: 400, 
    backgroundColor: colors.surface, 
    justifyContent: 'flex-end',
  },
  previewBlurOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
  },
  blurText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: spacing(1),
  },
  traitsOverlay: {
    position: 'absolute',
    top: spacing(2),
    right: spacing(2),
    gap: spacing(0.5),
  },
  traitChip: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.5),
    borderRadius: radii.pill,
    backdropFilter: 'blur(10px)',
  },
  traitText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  previewInfo: { 
    padding: spacing(2.5),
  },
  previewName: { 
    color: colors.text, 
    fontSize: 26, 
    fontWeight: '800', 
    textAlign: 'right',
    marginBottom: spacing(1),
  },
  previewDetailsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing(2),
    marginBottom: spacing(1),
  },
  previewDetailItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing(0.5),
  },
  previewDetails: { 
    color: colors.subtext, 
    fontSize: 14,
    textAlign: 'right',
  },
  previewBio: { 
    color: colors.text, 
    fontSize: 15, 
    lineHeight: 22,
    textAlign: 'right',
  },
  
  // Photos Management
  photosHint: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'right',
    marginBottom: spacing(1),
  },
  photosContainer: {
    gap: spacing(1.5),
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  photoContainer: { 
    position: 'relative',
    marginRight: spacing(1),
  },
  photoThumb: { 
    width: 130, 
    height: 180, 
    borderRadius: radii.lg, 
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: radii.lg,
  },
  deletePhotoBtn: { 
    position: 'absolute', 
    top: spacing(0.5), 
    right: spacing(0.5),
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radii.full,
  },
  reorderButtons: {
    position: 'absolute',
    bottom: spacing(0.5),
    left: spacing(0.5),
    flexDirection: 'row-reverse',
    gap: spacing(0.5),
  },
  reorderBtn: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: spacing(0.5),
    borderRadius: radii.sm,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainBadge: { 
    position: 'absolute', 
    bottom: spacing(0.5), 
    right: spacing(0.5), 
    backgroundColor: colors.accent, 
    paddingHorizontal: spacing(1.5), 
    paddingVertical: spacing(0.5), 
    borderRadius: radii.sm,
  },
  mainBadgeText: { 
    color: '#000', 
    fontSize: 11, 
    fontWeight: '700', 
    textAlign: 'center',
  },
  addPhotoButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    padding: spacing(2),
    borderRadius: radii.lg,
    marginTop: spacing(2),
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    gap: spacing(1),
  },
  addPhotoText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  blurToggle: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.75),
    borderRadius: radii.pill,
    gap: spacing(0.5),
  },
  blurToggleActive: {
    backgroundColor: colors.accent,
  },
  blurToggleText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  blurToggleTextActive: {
    color: '#000',
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
    alignItems: 'flex-start', 
    marginBottom: spacing(2),
  },
  infoIconContainer: {
    position: 'relative',
    marginLeft: spacing(1.5),
  },
  lockBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.surface,
    borderRadius: radii.full,
    padding: 2,
  },
  infoContent: { 
    flex: 1,
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
  
  // Edit Card
  editCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing(2),
    ...shadows.soft,
  },
  editButton: {
    padding: spacing(0.5),
  },
  inputGroup: {
    marginBottom: spacing(2),
  },
  inputLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: spacing(0.75),
    textAlign: 'right',
  },
  input: { 
    backgroundColor: colors.surface, 
    color: colors.text, 
    borderRadius: radii.md, 
    height: 48, 
    paddingHorizontal: spacing(2), 
    textAlign: 'right',
    fontSize: 15,
    writingDirection: 'rtl',
  },
  textArea: { 
    height: 100, 
    paddingTop: spacing(1.5),
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing(1),
  },
  chip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#000',
    fontWeight: '700',
  },
  originScroll: {
    marginTop: spacing(0.5),
  },
  originChip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(1),
    borderRadius: radii.md,
    marginLeft: spacing(1),
    borderWidth: 2,
    borderColor: 'transparent',
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
  editActions: { 
    flexDirection: 'row-reverse', 
    gap: spacing(1.5), 
    marginTop: spacing(2),
  },
});

