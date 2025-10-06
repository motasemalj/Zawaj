import React, { useState, useEffect } from 'react';
import { Modal, View, StyleSheet, ImageBackground, ScrollView, TouchableOpacity, Text, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from './ui/Avatar';
import { User, getClient } from '../api/client';
import { colors, radii, shadows, spacing } from '../theme';

export type MatchPreviewModalProps = {
  visible: boolean;
  onClose: () => void;
  user: User | null;
  baseUrl?: string;
  matchId?: string | null;
  onUnmatch?: () => void;
  onBlock?: () => void;
  onReport?: () => void;
};

export default function MatchPreviewModal({ 
  visible, 
  onClose, 
  user, 
  baseUrl,
  matchId,
  onUnmatch,
  onBlock,
  onReport,
}: MatchPreviewModalProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  // Reset photo index when modal opens or user changes
  useEffect(() => {
    if (visible) {
      setCurrentPhotoIndex(0);
    }
  }, [visible, user?.id]);
  
  if (!user) return null;
  
  const hasPhotos = user.photos && user.photos.length > 0;
  const hasMultiplePhotos = user.photos && user.photos.length > 1;
  const currentPhoto = user.photos?.[currentPhotoIndex]?.url;
  const age = calculateUserAge(user.dob);
  const photoUri = currentPhoto && baseUrl ? `${baseUrl}${currentPhoto}` : undefined;
  
  const nextPhoto = () => {
    if (!user.photos || user.photos.length <= 1) return;
    setCurrentPhotoIndex((prev) => (prev + 1) % user.photos.length);
  };
  
  const prevPhoto = () => {
    if (!user.photos || user.photos.length <= 1) return;
    setCurrentPhotoIndex((prev) => (prev - 1 + user.photos.length) % user.photos.length);
  };

  const handleUnmatch = () => {
    Alert.alert(
      'إلغاء التوافق',
      `هل أنت متأكد من إلغاء التوافق مع ${user?.display_name}؟ سيتم حذف جميع الرسائل.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'نعم، إلغاء التوافق',
          style: 'destructive',
          onPress: () => {
            onClose();
            onUnmatch?.();
          },
        },
      ]
    );
  };

  const handleBlock = () => {
    Alert.alert(
      'حظر المستخدم',
      `هل تريد حظر ${user?.display_name}؟ لن تستطيعا رؤية بعضكما مرة أخرى.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'نعم، حظر',
          style: 'destructive',
          onPress: () => {
            onClose();
            onBlock?.();
          },
        },
      ]
    );
  };

  const handleReport = () => {
    // Note: Alert.prompt is iOS only. For Android, we'll use a simpler approach
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'الإبلاغ عن المستخدم',
        `لماذا تريد الإبلاغ عن ${user?.display_name}؟`,
        [
          { text: 'إلغاء', style: 'cancel' },
          {
            text: 'إبلاغ',
            onPress: (reason) => {
              if (reason && reason.trim().length > 0) {
                onClose();
                onReport?.();
              }
            },
          },
        ],
        'plain-text',
        '',
        'default'
      );
    } else {
      Alert.alert(
        'الإبلاغ عن المستخدم',
        `سيتم إرسال تقرير عن ${user?.display_name}`,
        [
          { text: 'إلغاء', style: 'cancel' },
          {
            text: 'إبلاغ',
            onPress: () => {
              onClose();
              onReport?.();
            },
          },
        ]
      );
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {photoUri ? (
            <ImageBackground
              source={{ uri: photoUri }}
              style={styles.hero}
              imageStyle={{ borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl }}
            >
              {/* Photo Navigation */}
              {hasMultiplePhotos && (
                <>
                  <TouchableOpacity 
                    onPress={prevPhoto} 
                    style={styles.photoNavLeft}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-forward" size={28} color="#fff" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={nextPhoto} 
                    style={styles.photoNavRight}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-back" size={28} color="#fff" />
                  </TouchableOpacity>

                  {/* Photo Indicators */}
                  <View style={styles.photoIndicators}>
                    {user.photos?.map((_, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.indicator,
                          idx === currentPhotoIndex && styles.indicatorActive
                        ]}
                      />
                    ))}
                  </View>
                </>
              )}
            </ImageBackground>
          ) : (
            <View style={[styles.hero, styles.heroFallback]}>
              <Avatar uri={null} label={user.display_name} size={110} />
            </View>
          )}
          <ScrollView contentContainerStyle={{ paddingBottom: spacing(3) }}>
            <View style={styles.body}>
              <View style={styles.headerRow}>
                <Text style={styles.name}>{user.display_name}</Text>
                {user.role === 'mother' && (
                  <View style={styles.guardianBadge}>
                    <Ionicons name="shield-checkmark" size={14} color={colors.info} />
                    <Text style={styles.guardianText}>ولي أمر</Text>
                  </View>
                )}
              </View>
              <Text style={styles.meta}>
                {age ? `${age} عامًا` : 'العمر غير متوفر'} · {formatUserLocation(user)}
              </Text>
              {user.bio ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>نبذة مختصرة</Text>
                  <Text style={styles.sectionContent}>{user.bio}</Text>
                </View>
              ) : null}
              <View style={styles.grid}>
                {renderInfoTile('school', 'التعليم', user.education)}
                {renderInfoTile('briefcase', 'المهنة', user.profession)}
                {renderInfoTile('location', 'المدينة', user.city)}
                {renderInfoTile('earth', 'الدولة', user.country)}
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          {(matchId || onUnmatch || onBlock || onReport) && (
            <View style={styles.actionsFooter}>
              {onUnmatch && matchId && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.unmatchButton]}
                  onPress={handleUnmatch}
                  activeOpacity={0.7}
                >
                  <Ionicons name="heart-dislike" size={20} color="#ef4444" />
                  <Text style={[styles.actionButtonText, styles.unmatchButtonText]}>إلغاء التوافق</Text>
                </TouchableOpacity>
              )}
              {onReport && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.reportButton]}
                  onPress={handleReport}
                  activeOpacity={0.7}
                >
                  <Ionicons name="flag" size={20} color="#f59e0b" />
                  <Text style={[styles.actionButtonText, styles.reportButtonText]}>إبلاغ</Text>
                </TouchableOpacity>
              )}
              {onBlock && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.blockButton]}
                  onPress={handleBlock}
                  activeOpacity={0.7}
                >
                  <Ionicons name="ban" size={20} color="#ef4444" />
                  <Text style={[styles.actionButtonText, styles.blockButtonText]}>حظر</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function renderInfoTile(icon: any, label: string, value?: string | null) {
  return (
    <View style={styles.tile} key={label}>
      <Ionicons name={icon} size={18} color={colors.accent} style={{ marginLeft: spacing(0.5) }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.tileLabel}>{label}</Text>
        <Text style={styles.tileValue}>{value || '—'}</Text>
      </View>
    </View>
  );
}

export function formatUserLocation(user: User | null | undefined) {
  if (!user) return 'الموقع غير محدد';
  const city = user.city?.trim();
  const country = user.country?.trim();
  if (city && country) return `${city}, ${country}`;
  if (city) return city;
  if (country) return country;
  return 'الموقع غير محدد';
}

export function calculateUserAge(dob?: string | null) {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlayDarker,
    justifyContent: 'center',
    paddingHorizontal: spacing(2),
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    overflow: 'hidden',
    ...shadows.card,
  },
  hero: {
    width: '100%',
    height: 260,
    backgroundColor: colors.surface,
  },
  heroFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: spacing(2),
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing(1),
  },
  name: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  meta: {
    color: colors.subtext,
    marginTop: spacing(0.5),
    textAlign: 'right',
  },
  section: {
    marginTop: spacing(2),
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing(0.5),
    textAlign: 'right',
  },
  sectionContent: {
    color: colors.text,
    lineHeight: 22,
    textAlign: 'right',
  },
  grid: {
    marginTop: spacing(2),
    gap: spacing(1),
  },
  tile: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing(1),
    borderRadius: radii.md,
    gap: spacing(0.5),
  },
  tileLabel: {
    color: colors.subtext,
    fontSize: 12,
    textAlign: 'right',
  },
  tileValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  closeBtn: {
    position: 'absolute',
    top: spacing(1.5),
    left: spacing(1.5),
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.overlayDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guardianBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing(0.5),
    paddingHorizontal: spacing(1),
    paddingVertical: spacing(0.5),
    borderRadius: radii.lg,
    backgroundColor: colors.chip,
  },
  guardianText: {
    color: colors.info,
    fontSize: 12,
    fontWeight: '600',
  },
  photoNavLeft: {
    position: 'absolute',
    left: spacing(1),
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  photoNavRight: {
    position: 'absolute',
    right: spacing(1),
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  photoIndicators: {
    position: 'absolute',
    bottom: spacing(1.5),
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing(0.5),
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  indicatorActive: {
    backgroundColor: '#fff',
    width: 20,
  },
  actionsFooter: {
    flexDirection: 'row-reverse',
    gap: spacing(1),
    paddingHorizontal: spacing(2),
    paddingBottom: spacing(2),
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing(2),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(0.5),
    paddingVertical: spacing(1.5),
    paddingHorizontal: spacing(2),
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  unmatchButton: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  reportButton: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  blockButton: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  unmatchButtonText: {
    color: '#ef4444',
  },
  reportButtonText: {
    color: '#f59e0b',
  },
  blockButtonText: {
    color: '#ef4444',
  },
});
