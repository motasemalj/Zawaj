import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
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
    // Add haptic feedback for unmatch button press
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

  const matches = React.useMemo(() => {
    const rawMatches = data ?? [];
    return [...rawMatches].sort((a, b) => {
      const aHasMessages = !!a.last_message_at;
      const bHasMessages = !!b.last_message_at;
      if (aHasMessages && !bHasMessages) return -1;
      if (!aHasMessages && bHasMessages) return 1;
      if (aHasMessages && bHasMessages) {
        return new Date(b.last_message_at!).getTime() - new Date(a.last_message_at!).getTime();
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [data]);

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing(2)) }]}> 
          <View style={styles.headerBlock}>
            <Text style={styles.title}>التوافقات</Text>
            <Text style={styles.subtitle}>استعرض الأشخاص الذين شاركوك الإعجاب وابدأ الحوار</Text>
          </View>

          <FlatList
            data={matches}
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
            renderItem={({ item }) => {
              const other = currentUserId
                ? item.user_a.id === currentUserId ? item.user_b : item.user_a
                : item.user_b;
              const openPreview = () => { setSelectedUser(other); setSelectedMatchId(item.id); };
              return (
                <TouchableOpacity
                  style={styles.card}
                  activeOpacity={0.85}
                  onPress={() => {
                    feedback.buttonPress();
                    nav.navigate('Chat', { matchId: item.id });
                  }}
                >
                  <View style={styles.cardContent}>
                    <Avatar 
                      uri={other?.photos?.[0]?.url ?? null} 
                      label={other?.display_name} 
                      size={72} 
                    />
                    <View style={styles.cardDetails}>
                      <View style={styles.nameRow}>
                        <Text style={styles.name}>{other?.display_name ?? '—'}</Text>
                        {!item.last_message_at && (
                          <View style={styles.newMatchBadge}>
                            <Ionicons name="sparkles" size={12} color={colors.accent} />
                            <Text style={styles.newMatchText}>توافق جديد!</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.meta}>{other?.city && other?.country ? `${other.city}, ${other.country}` : '—'}</Text>
                    </View>
                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={styles.previewBtn}
                        onPress={() => {
                          feedback.buttonPress();
                          openPreview();
                        }}
                      >
                        <Ionicons name="id-card" size={18} color={colors.text} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.chatBtn}
                        onPress={() => {
                          feedback.buttonPress();
                          nav.navigate('Chat', { matchId: item.id });
                        }}
                      >
                        <Ionicons name="chatbubble" size={18} color="#000" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.unmatchBtn, unmatchingId === item.id && styles.unmatchBtnDisabled]}
                        onPress={() => {
                          feedback.important();
                          handleUnmatch(item.id, other?.display_name || 'هذا الشخص');
                        }}
                        disabled={unmatchingId === item.id}
                      >
                        <Ionicons 
                          name={unmatchingId === item.id ? "hourglass" : "close"} 
                          size={18} 
                          color={unmatchingId === item.id ? colors.muted : "#ef4444"} 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => <View style={{ height: spacing(1.5) }} />}
            contentContainerStyle={{ paddingBottom: spacing(3) }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="sparkles" size={36} color={colors.muted} />
                <Text style={styles.emptyTitle}>لا توجد توافقات بعد</Text>
                <Text style={styles.emptyText}>واصل التمرير والتفاعل لتحصل على مزيد من التوافقات.</Text>
              </View>
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

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: spacing(2), paddingTop: spacing(2) },
  headerBlock: {
    marginBottom: spacing(2),
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'right',
  },
  subtitle: {
    color: colors.subtext,
    fontSize: 14,
    marginTop: spacing(0.5),
    textAlign: 'right',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing(1.5),
    ...shadows.soft,
  },
  cardContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing(1.5),
  },
  cardDetails: { flex: 1, gap: spacing(0.5) },
  nameRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing(1),
  },
  name: { color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'right', flex: 1 },
  meta: { color: colors.subtext, fontSize: 12, textAlign: 'right' },
  actions: { flexDirection: 'row-reverse', gap: spacing(1), alignItems: 'center' },
  previewBtn: { width: 44, height: 44, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  chatBtn: { width: 48, height: 48, borderRadius: radii.lg, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  unmatchBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: radii.lg, 
    borderWidth: 1, 
    borderColor: '#ef4444', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#ef444410'
  },
  unmatchBtnDisabled: {
    borderColor: colors.muted,
    backgroundColor: colors.surface,
    opacity: 0.6
  },
  newMatchBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing(0.5), paddingHorizontal: spacing(1), paddingVertical: spacing(0.5), borderRadius: radii.lg, backgroundColor: colors.chip, alignSelf: 'flex-end' },
  newMatchText: { color: colors.accent, fontSize: 12, fontWeight: '600' },
  emptyState: { marginTop: spacing(6), alignItems: 'center', gap: spacing(1) },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptyText: { color: colors.subtext, fontSize: 14, textAlign: 'center', paddingHorizontal: spacing(4) },
});

