import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert, ScrollView, ActivityIndicator } from 'react-native';
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
import { useConversations, useTotalUnreadCount } from '../hooks/useFirebaseChat';
import { FirestoreConversation } from '../services/firebase/types';
import { Timestamp } from 'firebase/firestore';

export default function FirebaseMatchesScreen() {
  const currentUserId = useApiState((state) => state.currentUserId);
  const api = useMemo(() => getClient(), [currentUserId]);
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [unmatchingId, setUnmatchingId] = useState<string | null>(null);

  // Backend matches data
  const { data: backendMatches, refetch, isFetching } = useMatches();
  const unmatchMutation = useUnmatch();
  
  // Firebase conversations data
  const { conversations, loading: conversationsLoading } = useConversations(currentUserId);
  const totalUnread = useTotalUnreadCount(conversations, currentUserId);

  // Update badge count
  useEffect(() => {
    if (totalUnread > 0) {
      // You can update app badge here if needed
      // setBadgeCount(totalUnread);
    }
  }, [totalUnread]);

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

  // Merge backend matches with Firebase conversations
  const matchesWithConversations = useMemo(() => {
    if (!backendMatches || !conversations) return [];
    
    return backendMatches.map((match: Match) => {
      const conversation = conversations.find((conv) => conv.id === match.id);
      return {
        ...match,
        conversation,
      };
    });
  }, [backendMatches, conversations]);

  // Separate matches into new and with messages
  const { newMatches, chatMatches } = React.useMemo(() => {
    const rawMatches = matchesWithConversations ?? [];
    const newM: typeof rawMatches = [];
    const chatM: typeof rawMatches = [];

    rawMatches.forEach((m) => {
      if (!m.conversation || !m.conversation.lastMessage) {
        newM.push(m);
      } else {
        chatM.push(m);
      }
    });

    // Sort new matches by creation date (newest first)
    newM.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Sort chat matches by last message date (most recent first)
    chatM.sort((a, b) => {
      const aTime = a.conversation?.lastMessage?.timestamp?.toMillis() || 0;
      const bTime = b.conversation?.lastMessage?.timestamp?.toMillis() || 0;
      return bTime - aTime;
    });

    return { newMatches: newM, chatMatches: chatM };
  }, [matchesWithConversations]);

  const renderNewMatch = (item: Match & { conversation?: FirestoreConversation }) => {
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

  const renderChatPreview = ({ item }: { item: Match & { conversation?: FirestoreConversation } }) => {
    const other = currentUserId
      ? item.user_a.id === currentUserId ? item.user_b : item.user_a
      : item.user_b;
    const openPreview = () => { setSelectedUser(other); setSelectedMatchId(item.id); };
    
    const lastMessageTime = item.conversation?.lastMessage?.timestamp
      ? formatRelativeTime(item.conversation.lastMessage.timestamp.toDate())
      : '';
    
    const unreadCount = currentUserId && item.conversation 
      ? item.conversation.unreadCount[currentUserId] || 0 
      : 0;

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
            <View style={styles.avatarWithBadge}>
              <Avatar 
                uri={other?.photos?.[0]?.url ?? null} 
                label={other?.display_name} 
                size={64} 
              />
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.chatMiddle}>
            <View style={styles.chatNameRow}>
              <Text style={[styles.chatName, unreadCount > 0 && styles.chatNameUnread]}>
                {other?.display_name ?? '—'}
              </Text>
              {lastMessageTime && (
                <Text style={styles.chatTime}>{lastMessageTime}</Text>
              )}
            </View>
            
            <Text style={styles.chatLocation} numberOfLines={1}>
              {other?.city && other?.country ? `${other.city}, ${other.country}` : 'غير محدد'}
            </Text>
            
            {item.conversation?.lastMessage && (
              <Text 
                style={[
                  styles.chatPreviewText, 
                  unreadCount > 0 && styles.chatPreviewTextUnread
                ]} 
                numberOfLines={1}
              >
                {item.conversation.lastMessage.text}
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

  const isLoading = isFetching || conversationsLoading;

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing(2)) }]}> 
          <View style={styles.headerBlock}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>التوافقات</Text>
              {totalUnread > 0 && (
                <View style={styles.totalUnreadBadge}>
                  <Text style={styles.totalUnreadText}>
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.subtitle}>
              {newMatches.length > 0 
                ? `لديك ${newMatches.length} توافق جديد`
                : 'استعرض محادثاتك'}
            </Text>
          </View>

          {isLoading && chatMatches.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={styles.loadingText}>جاري التحميل...</Text>
            </View>
          ) : (
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
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing(2),
  },
  loadingText: {
    color: colors.text,
    fontSize: 14,
  },
  headerBlock: {
    marginTop: spacing(-5),
    marginBottom: spacing(2),
  },
  titleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing(1.5),
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'right',
    letterSpacing: -0.5,
  },
  totalUnreadBadge: {
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    minWidth: 28,
    height: 28,
    paddingHorizontal: spacing(1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalUnreadText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
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
    transform: [{ scaleX: -1 }],
  },
  newMatchesScroll: {
    paddingHorizontal: spacing(0.5),
    gap: spacing(2),
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
  avatarWithBadge: {
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    minWidth: 22,
    height: 22,
    paddingHorizontal: spacing(0.5),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.card,
  },
  unreadBadgeText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '700',
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
  chatNameUnread: {
    fontWeight: '800',
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
  chatPreviewTextUnread: {
    color: colors.text,
    fontWeight: '600',
    fontStyle: 'normal',
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

