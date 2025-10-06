import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, shadows } from '../theme';
import { User } from '../api/client';
import Avatar from './ui/Avatar';
import { getClient } from '../api/client';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Map Arabic country names to emoji flags (fallback to name if missing)
const originFlagMap: Record<string, string> = {
  'السعودية': '🇸🇦',
  'الإمارات': '🇦🇪',
  'الكويت': '🇰🇼',
  'قطر': '🇶🇦',
  'البحرين': '🇧🇭',
  'عُمان': '🇴🇲',
  'اليمن': '🇾🇪',
  'العراق': '🇮🇶',
  'الأردن': '🇯🇴',
  'سوريا': '🇸🇾',
  'لبنان': '🇱🇧',
  'فلسطين': '🇵🇸',
  'مصر': '🇪🇬',
  'السودان': '🇸🇩',
  'ليبيا': '🇱🇾',
  'تونس': '🇹🇳',
  'الجزائر': '🇩🇿',
  'المغرب': '🇲🇦',
  'موريتانيا': '🇲🇷',
  'الصومال': '🇸🇴',
  'جيبوتي': '🇩🇯',
  'جزر القمر': '🇰🇲',
};

function withOriginFlag(origin?: string | null): string | undefined {
  if (!origin) return origin ?? undefined;
  // If origin already contains an emoji, return as is
  if (/\p{Extended_Pictographic}/u.test(origin)) return origin;
  const flag = originFlagMap[origin];
  return flag ? `${origin} ${flag}` : origin;
}

type ProfileDetailModalProps = {
  visible: boolean;
  user: User | null;
  onClose: () => void;
  onLike?: () => void;
  onPass?: () => void;
  onSuperLike?: () => void;
};

export default function ProfileDetailModal({
  visible,
  user,
  onClose,
  onLike,
  onPass,
  onSuperLike,
}: ProfileDetailModalProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const api = getClient();
  const insets = useSafeAreaInsets();

  if (!user) return null;

  const calculateAge = (dob: string): number => {
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const nextPhoto = () => {
    if (user.photos && currentPhotoIndex < user.photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const prevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  const interests = user.interests ? JSON.parse(user.interests) : [];
  const traits = user.personality_traits ? JSON.parse(user.personality_traits) : [];
  const icebreakers = user.icebreaker_questions ? JSON.parse(user.icebreaker_questions) : [];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.modalContainer, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, spacing(2)) }]}> 
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="chevron-down" size={32} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>الملف الشخصي</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Photos */}
          <View style={styles.photoSection}>
            {user.photos && user.photos.length > 0 ? (
              <View>
                <ImageBackground
                  source={{ uri: `${api.defaults.baseURL}${user.photos[currentPhotoIndex]?.url}` }}
                  style={styles.mainPhoto}
                  imageStyle={{ borderRadius: radii.lg }}
                  blurRadius={(user.privacy_blur_mode || user.photos[currentPhotoIndex]?.blurred) ? 25 : 0}
                >
                  {/* Photo Navigation */}
                  {user.photos.length > 1 && (
                    <>
                      {currentPhotoIndex > 0 && (
                        <TouchableOpacity onPress={prevPhoto} style={styles.photoNavLeft}>
                          <Ionicons name="chevron-back" size={28} color="#fff" />
                        </TouchableOpacity>
                      )}
                      {currentPhotoIndex < user.photos.length - 1 && (
                        <TouchableOpacity onPress={nextPhoto} style={styles.photoNavRight}>
                          <Ionicons name="chevron-forward" size={28} color="#fff" />
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </ImageBackground>
                {/* Photo Indicators */}
                {user.photos.length > 1 && (
                  <View style={styles.photoIndicators}>
                    {user.photos.map((_, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.photoDot,
                          idx === currentPhotoIndex && styles.photoDotActive,
                        ]}
                      />
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View style={[styles.mainPhoto, styles.noPhotoContainer]}>
                <Avatar uri={undefined} size={120} label={user.display_name} />
              </View>
            )}
          </View>

          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.nameAge}>
              {/* RTL: name first then age with Arabic comma */}
              {user.display_name}، {calculateAge(user.dob)}
            </Text>
            {user.role === 'mother' && (
              <View style={styles.motherBadge}>
                <Ionicons name="heart" size={16} color="#fff" />
                <Text style={styles.motherBadgeText}>
                  أم {user.mother_for === 'son' ? 'لابن' : user.mother_for === 'daughter' ? 'لابنة' : ''}
                </Text>
              </View>
            )}
          </View>

          {/* Location & Origin */}
          <View style={styles.section}>
            {(user.city || user.country) && (
              <InfoRow icon="location" text={[user.city, user.country].filter(Boolean).join(', ')} />
            )}
            {user.ethnicity && (
              <InfoRow icon="globe" text={withOriginFlag(user.ethnicity) || ''} label="الأصل" />
            )}
            {user.height_cm && (
              <InfoRow icon="resize" text={`${user.height_cm} سم`} label="الطول" />
            )}
          </View>

          {/* Bio */}
          {user.bio && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>عني</Text>
              <Text style={styles.bioText}>{user.bio}</Text>
            </View>
          )}

          {/* Professional Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>المعلومات المهنية</Text>
            {user.profession && <InfoRow icon="briefcase" text={user.profession} label="المهنة" />}
            {user.education && <InfoRow icon="school" text={user.education} label="التعليم" />}
          </View>

          {/* Personal Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>المعلومات الشخصية</Text>
            {user.sect && <InfoRow icon="moon" text={getSectLabel(user.sect)} label="المذهب" />}
            {user.marriage_timeline && <InfoRow icon="calendar" text={getMarriageTimelineLabel(user.marriage_timeline)} label="التوقيت المفضل للزواج" />}
            {user.children_preference && <InfoRow icon="people" text={user.children_preference === 'yes' ? 'نعم' : 'لا'} label="لديه أطفال" />}
            {user.want_children && <InfoRow icon="heart" text={user.want_children} label="يريد أطفالاً" />}
            {user.smoker && <InfoRow icon="ban" text={user.smoker} label="التدخين" />}
            {user.marital_status && <InfoRow icon="person" text={user.marital_status} label="الحالة الاجتماعية" />}
            {user.relocate !== undefined && <InfoRow icon="airplane" text={user.relocate ? 'نعم' : 'لا'} label="الانتقال للخارج" />}
          </View>

          {/* Personality Traits */}
          {traits.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>السمات الشخصية</Text>
              <View style={styles.chipContainer}>
                {traits.map((trait: string, idx: number) => (
                  <View key={idx} style={styles.chip}>
                    <Text style={styles.chipText}>{trait}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Interests */}
          {interests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>الاهتمامات</Text>
              <View style={styles.chipContainer}>
                {interests.map((interest: string, idx: number) => (
                  <View key={idx} style={[styles.chip, styles.interestChip]}>
                    <Text style={styles.chipText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Icebreakers */}
          {icebreakers.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>أسئلة تمهيدية</Text>
              {icebreakers.map((icebreaker: any, idx: number) => (
                <View key={idx} style={styles.icebreakerCard}>
                  <Text style={styles.icebreakerPrompt}>{icebreaker.prompt}</Text>
                  <Text style={styles.icebreakerAnswer}>{icebreaker.answer}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: spacing(10) }} />
        </ScrollView>

        {/* Action Buttons */}
        {(onLike || onPass || onSuperLike) && (
          <View style={styles.actionBar}>
            {onPass && (
              <TouchableOpacity onPress={onPass} style={[styles.actionButton, styles.passButton]}>
                <Ionicons name="close" size={32} color="#fff" />
              </TouchableOpacity>
            )}
            {onSuperLike && (
              <TouchableOpacity onPress={onSuperLike} style={[styles.actionButton, styles.superButton]}>
                <Ionicons name="star" size={28} color="#fff" />
              </TouchableOpacity>
            )}
            {onLike && (
              <TouchableOpacity onPress={onLike} style={[styles.actionButton, styles.likeButton]}>
                <Ionicons name="heart" size={32} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

function InfoRow({ icon, text, label }: { icon: string; text: string; label?: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoContent}>
        {label && <Text style={styles.infoLabel}>{label}:</Text>}
        <Text style={styles.infoText}>{text}</Text>
      </View>
      <Ionicons name={icon as any} size={20} color={colors.accent} />
    </View>
  );
}

function getSectLabel(sect: string): string {
  const labels: any = {
    sunni: 'سني',
    shia: 'شيعي',
    other: 'آخر',
  };
  return labels[sect] || sect;
}

function getMarriageTimelineLabel(timeline: string): string {
  const labels: any = {
    within_6_months: 'خلال 6 أشهر',
    '6_12_months': '6-12 شهر',
    '1_2_years': '1-2 سنة',
    '2plus_years': 'أكثر من سنتين',
    open: 'مفتوح للتوقيت',
  };
  return labels[timeline] || timeline;
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(2),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: spacing(1),
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  photoSection: {
    paddingHorizontal: spacing(2),
    paddingTop: spacing(2),
  },
  mainPhoto: {
    width: '100%',
    height: 400,
    borderRadius: radii.lg,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPhotoContainer: {
    backgroundColor: colors.surface,
  },
  photoNavLeft: {
    position: 'absolute',
    left: spacing(2),
    top: '50%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radii.pill,
    padding: spacing(1),
  },
  photoNavRight: {
    position: 'absolute',
    right: spacing(2),
    top: '50%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radii.pill,
    padding: spacing(1),
  },
  photoIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing(2),
    gap: spacing(1),
  },
  photoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  photoDotActive: {
    backgroundColor: colors.accent,
    width: 24,
  },
  section: {
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(2),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  nameAge: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: spacing(1),
  },
  motherBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: radii.pill,
    gap: spacing(0.5),
    marginTop: spacing(1),
  },
  motherBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing(2),
    textAlign: 'right',
  },
  bioText: {
    color: colors.subtext,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'right',
  },
  infoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing(1.5),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoContent: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing(1),
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  infoText: {
    color: colors.text,
    fontSize: 16,
    textAlign: 'right',
    flex: 1,
  },
  chipContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing(1.5),
  },
  chip: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: radii.pill,
  },
  interestChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  chipText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  icebreakerCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing(2),
    marginBottom: spacing(2),
  },
  icebreakerPrompt: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing(1),
    textAlign: 'right',
  },
  icebreakerAnswer: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'right',
  },
  actionBar: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing(3),
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(2),
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  passButton: {
    backgroundColor: '#ef4444',
  },
  superButton: {
    backgroundColor: '#3b82f6',
  },
  likeButton: {
    backgroundColor: '#10b981',
  },
});

