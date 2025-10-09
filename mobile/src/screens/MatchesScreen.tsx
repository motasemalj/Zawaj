import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert, ScrollView } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getClient, Match, useApiState } from '../api/client';
import { colors, radii, shadows, spacing } from '../theme';
import Avatar from '../components/ui/Avatar';
import GradientBackground from '../components/ui/GradientBackground';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import ProfileDetailModal from '../components/ProfileDetailModal';
import { Ionicons } from '@expo/vector-icons';
import { feedback } from '../utils/haptics';
import { useMatches, useUnmatch } from '../api/hooks';
import { LinearGradient } from 'expo-linear-gradient';

export default function MatchesScreen() {
  const currentUserId = useApiState((state) => state.currentUserId);
  const api = useMemo(() => getClient(), [currentUserId]);
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [unmatchingId, setUnmatchingId] = useState<string | null>(null);

  const { data, refetch, isFetching } = useMatches();
  const unmatchMutation = useUnmatch();

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleUnmatch = async (matchId: string, userName: string) => {
    feedback.important();
    
    Alert.alert(
      'إلغاء التوافق',
      `هل أنت متأكد من إلغاء التوافق مع ${userName}؟\n\nسيتم حذف جميع المحادثات نهائياً.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'إلغاء التوافق',
          style: 'destructive',
          onPress: () => {
            setUnmatchingId(matchId);
            unmatchMutation.mutate(matchId, {
              onSuccess: () => {
                setUnmatchingId(null);
                feedback.success();
              },
              onError: (error: any) => {
                setUnmatchingId(null);
                feedback.error();
                Alert.alert('خطأ', error.response?.data?.message || 'فشل في إلغاء التوافق');
              },
            });
          },
        },
      ]
    );
  };

  // Separate matches into new and with messages
  const { newMatches, chatMatches } = React.useMemo(() => {
    const rawMatches = data ?? [];
    const newM: typeof rawMatches = [];
    const chatM: typeof rawMatches = [];

    rawMatches.forEach((m: Match) => {
      if (!m.last_message_at) {
        newM.push(m);
      } else {
        chatM.push(m);
      }
    });

    // Sort new matches by creation date (newest first)
    newM.sort((a: Match, b: Match) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Sort chat matches by last message date (most recent first)
    chatM.sort((a: Match, b: Match) => new Date(b.last_message_at!).getTime() - new Date(a.last_message_at!).getTime());

    return { newMatches: newM, chatMatches: chatM };
  }, [data]);

  const renderNewMatch = (item: Match) => {
    const other = currentUserId
      ? item.user_a.id === currentUserId ? item.user_b : item.user_a
      : item.user_b;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.newMatchItem}
        activeOpacity={0.7}
        onPress={() => {
          feedback.buttonPress();
          nav.navigate('Chat', { matchId: item.id });
        }}
      >
        <View style={styles.newMatchAvatarWrapper}>
          <LinearGradient
            colors={['#fe3c72', '#ff5864', '#ff6b6b']}
            style={styles.newMatchGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Avatar 
              uri={other?.photos?.[0]?.url ?? null} 
              label={other?.display_name} 
              size={68} 
            />
          </LinearGradient>
          <View style={styles.newBadge}>
            <Ionicons name="sparkles" size={10} color="#000" />
          </View>
        </View>
        <Text style={styles.newMatchName} numberOfLines={1}>
          {other?.display_name ?? '—'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderChatPreview = ({ item }: { item: Match }) => {
    const other = currentUserId
      ? item.user_a.id === currentUserId ? item.user_b : item.user_a
      : item.user_b;
    const openPreview = () => { setSelectedUser(other); setSelectedMatchId(item.id); };
    
    const lastMessageTime = item.last_message_at 
      ? formatRelativeTime(new Date(item.last_message_at))
      : '';

    return (
      <TouchableOpacity
        style={styles.chatCard}
        activeOpacity={0.85}
        onPress={() => {
          feedback.buttonPress();
          nav.navigate('Chat', { matchId: item.id });
        }}
      >
        <View style={styles.chatContent}>
          <View style={styles.chatLeft}>
            <Avatar 
              uri={other?.photos?.[0]?.url ?? null} 
              label={other?.display_name} 
              size={64} 
            />
          </View>
          
          <View style={styles.chatMiddle}>
            <View style={styles.chatNameRow}>
              <Text style={styles.chatName}>{other?.display_name ?? '—'}</Text>
              {item.last_message_at && (
                <Text style={styles.chatTime}>{lastMessageTime}</Text>
              )}
            </View>
            
            <Text style={styles.chatLocation} numberOfLines={1}>
              {other?.city && other?.country ? `${other.city}, ${other.country}` : 'غير محدد'}
            </Text>
            
            {item.last_message_text && (
              <Text style={styles.chatPreviewText} numberOfLines={1}>
                {item.last_message_text}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.chatActions}>
          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={(e) => {
              e.stopPropagation();
              feedback.buttonPress();
              openPreview();
            }}
          >
            <Ionicons name="person-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionBtnDanger, unmatchingId === item.id && styles.actionBtnDisabled]}
            onPress={(e) => {
              e.stopPropagation();
              feedback.important();
              handleUnmatch(item.id, other?.display_name || 'هذا الشخص');
            }}
            disabled={unmatchingId === item.id}
          >
            <Ionicons 
              name={unmatchingId === item.id ? "hourglass-outline" : "close"} 
              size={20} 
              color={unmatchingId === item.id ? colors.muted : "#ef4444"} 
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing(2)) }]}> 
          <View style={styles.headerBlock}>
            <Text style={styles.title}>التوافقات</Text>
            <Text style={styles.subtitle}>
              {newMatches.length > 0 
                ? `لديك ${newMatches.length} توافق جديد`
                : 'استعرض محادثاتك'}
            </Text>
          </View>

          <FlatList
            data={chatMatches}
            keyExtractor={(m) => m.id}
            refreshControl={
              <RefreshControl
                refreshing={isFetching}
                onRefresh={() => refetch()}
                tintColor={colors.accent}
                title="جاري التحديث..."
                titleColor={colors.text}
              />
            }
            ListHeaderComponent={
              newMatches.length > 0 ? (
                <View style={styles.newMatchesSection}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="sparkles" size={18} color={colors.accent} />
                    <Text style={styles.sectionTitle}>توافقات جديدة</Text>
                  </View>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.newMatchesScroll}
                    style={styles.newMatchesContainer}
                    directionalLockEnabled={true}
                  >
                    {newMatches.map(renderNewMatch)}
                  </ScrollView>
                  
                  {chatMatches.length > 0 && (
                    <View style={styles.divider}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>المحادثات</Text>
                      <View style={styles.dividerLine} />
                    </View>
                  )}
                </View>
              ) : null
            }
            renderItem={renderChatPreview}
            ItemSeparatorComponent={() => <View style={{ height: spacing(1.5) }} />}
            contentContainerStyle={{ paddingBottom: spacing(3) }}
            ListEmptyComponent={
              newMatches.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="chatbubbles-outline" size={48} color={colors.muted} />
                  <Text style={styles.emptyTitle}>لا توجد توافقات بعد</Text>
                  <Text style={styles.emptyText}>
                    واصل التمرير والتفاعل لتحصل على مزيد من التوافقات
                  </Text>
                </View>
              ) : null
            }
          />
        </View>
      </SafeAreaView>

      <ProfileDetailModal
        visible={Boolean(selectedUser)}
        onClose={() => { setSelectedUser(null); setSelectedMatchId(null); }}
        user={selectedUser}
        onLike={selectedMatchId ? () => nav.navigate('Chat', { matchId: selectedMatchId }) : undefined}
      />
    </GradientBackground>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `${diffMins} د`;
  if (diffHours < 24) return `${diffHours} س`;
  if (diffDays < 7) return `${diffDays} ي`;
  return date.toLocaleDateString('ar', { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: spacing(2), paddingTop: spacing(2) },
  headerBlock: {
    marginTop: spacing(-5),
    marginBottom: spacing(2),
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'right',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.accent,
    fontSize: 14,
    marginTop: spacing(0.5),
    textAlign: 'right',
    fontWeight: '600',
  },
  
  // New Matches Section
  newMatchesSection: {
    marginBottom: spacing(2),
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing(0.75),
    marginBottom: spacing(1.5),
    paddingHorizontal: spacing(0.5),
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  newMatchesContainer: {
    // Ensure RTL support for horizontal scrolling
    transform: [{ scaleX: -1 }],
  },
  newMatchesScroll: {
    paddingHorizontal: spacing(0.5),
    gap: spacing(2),
    // Reverse the transform for content
    transform: [{ scaleX: -1 }],
  },
  newMatchItem: {
    alignItems: 'center',
    gap: spacing(0.75),
    width: 80,
  },
  newMatchAvatarWrapper: {
    position: 'relative',
  },
  newMatchGradient: {
    borderRadius: radii.pill,
    padding: 3,
    ...shadows.card,
  },
  newBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  newMatchName: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
  
  // Divider
  divider: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing(1.5),
    marginTop: spacing(2.5),
    marginBottom: spacing(1.5),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.subtext,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Chat Preview Card
  chatCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing(2),
    ...shadows.soft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chatContent: {
    flexDirection: 'row-reverse',
    gap: spacing(1.5),
    marginBottom: spacing(1.5),
  },
  chatLeft: {
    ...shadows.soft,
  },
  chatMiddle: {
    flex: 1,
    gap: spacing(0.5),
    justifyContent: 'center',
  },
  chatNameRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  chatTime: {
    color: colors.subtext,
    fontSize: 11,
    fontWeight: '500',
  },
  chatLocation: {
    color: colors.subtext,
    fontSize: 13,
    textAlign: 'right',
  },
  chatPreviewText: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'right',
    marginTop: spacing(0.25),
    fontStyle: 'italic',
  },
  
  // Actions
  chatActions: {
    flexDirection: 'row-reverse',
    gap: spacing(1.5),
    paddingTop: spacing(1),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtnPrimary: {
    flex: 1,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing(0.75),
  },
  actionBtnDanger: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#ef4444',
    backgroundColor: '#ef444410',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDisabled: {
    borderColor: colors.muted,
    backgroundColor: colors.surface,
    opacity: 0.5,
  },
  
  // Empty State
  emptyState: {
    marginTop: spacing(8),
    alignItems: 'center',
    gap: spacing(1.5),
    paddingHorizontal: spacing(4),
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyText: {
    color: colors.subtext,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

