import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getClient, Match, useApiState } from '../api/client';
import { colors, radii, shadows, spacing } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../components/ui/Avatar';
import GradientBackground from '../components/ui/GradientBackground';
import { feedback } from '../utils/haptics';
import ProfileDetailModal from '../components/ProfileDetailModal';
import { useMatch, useReport, useUnmatch } from '../api/hooks';
import {
  useMessages,
  useSendMessage,
  useMarkAsRead,
  useConversation,
  useUserPresence,
  useLoadMoreMessages,
} from '../hooks/useFirebaseChat';
import { FirestoreMessage } from '../services/firebase/types';
import { Timestamp } from 'firebase/firestore';

export default function FirebaseChatScreen() {
  const route = useRoute<RouteProp<any>>();
  const nav = useNavigation<any>();
  const matchId = (route.params as any)?.matchId as string;
  const currentUserId = useApiState((state) => state.currentUserId);
  const api = useMemo(() => getClient(), [currentUserId]);
  const baseUrl = api.defaults.baseURL;
  
  // Backend match data (for user profiles)
  const { data: match } = useMatch(matchId);
  
  // Firebase hooks
  const { conversation } = useConversation(matchId);
  const { messages, loading: messagesLoading } = useMessages(matchId, 100);
  const { send, sending } = useSendMessage();
  const { markAsRead } = useMarkAsRead();
  const { loadMore, loading: loadingMore, hasMore } = useLoadMoreMessages(matchId);
  
  // Backend hooks for reporting/unmatching
  const reportMutation = useReport();
  const unmatchMutation = useUnmatch();
  
  const [text, setText] = useState('');
  const [guardian, setGuardian] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<FirestoreMessage> | null>(null);

  // Helper function for formatting user location
  const formatUserLocation = (user: any) => {
    if (!user) return '—';
    const parts = [];
    if (user.city) parts.push(user.city);
    if (user.country) parts.push(user.country);
    return parts.length > 0 ? parts.join(', ') : '—';
  };

  const otherUser = useMemo(() => {
    if (!match || !currentUserId) return null;
    return match.user_a.id === currentUserId ? match.user_b : match.user_a;
  }, [match, currentUserId]);

  const myProfile = useMemo(() => {
    if (!match || !currentUserId) return null;
    return match.user_a.id === currentUserId ? match.user_a : match.user_b;
  }, [match, currentUserId]);
  
  const otherUserId = useMemo(() => otherUser?.id || null, [otherUser]);
  
  // Get online presence for other user
  const { online: otherUserOnline, lastSeen: otherUserLastSeen } = useUserPresence(otherUserId);

  // Set guardian flag when match data loads
  useEffect(() => {
    if (match) {
      const a = match.user_a?.role as string;
      const b = match.user_b?.role as string;
      setGuardian(a === 'mother' || b === 'mother');
    }
  }, [match]);
  
  // Mark messages as read when opening chat
  useEffect(() => {
    if (matchId && currentUserId && messages.length > 0) {
      markAsRead(matchId, currentUserId);
    }
  }, [matchId, currentUserId, messages.length]);

  async function sendMsg() {
    if (!text.trim() || !currentUserId || !otherUserId) return;
    const messageText = text;
    setText('');
    
    try {
      await send(matchId, currentUserId, messageText, otherUserId);
      
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('خطأ', 'فشل في إرسال الرسالة');
      setText(messageText); // Restore text on error
    }
  }

  const handleReport = () => {
    if (!otherUser) return;
    
    Alert.alert(
      'الإبلاغ عن المستخدم',
      `هل تريد الإبلاغ عن ${otherUser.display_name}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'الإبلاغ',
          style: 'destructive',
          onPress: () => {
            Alert.prompt(
              'سبب الإبلاغ',
              'يرجى كتابة سبب الإبلاغ:',
              [
                { text: 'إلغاء', style: 'cancel' },
                {
                  text: 'إرسال',
                  onPress: (reason: string | undefined) => {
                    if (reason && reason.trim()) {
                      reportMutation.mutate({
                        target_type: 'user',
                        target_id: otherUser.id,
                        reason: reason.trim(),
                      }, {
                        onSuccess: () => {
                          feedback.success();
                          Alert.alert('تم الإبلاغ', 'تم إرسال البلاغ بنجاح');
                        },
                        onError: (error) => {
                          feedback.error();
                          Alert.alert('خطأ', 'فشل في إرسال البلاغ');
                        },
                      });
                    }
                  },
                },
              ],
              'plain-text'
            );
          },
        },
      ]
    );
  };

  const handleUnmatch = () => {
    if (!otherUser || !matchId) return;
    
    Alert.alert(
      'إلغاء التوافق',
      `هل أنت متأكد من إلغاء التوافق مع ${otherUser.display_name}؟\n\nسيتم حذف جميع المحادثات نهائياً.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'إلغاء التوافق',
          style: 'destructive',
          onPress: () => {
            feedback.important();
            unmatchMutation.mutate(matchId, {
              onSuccess: () => {
                feedback.success();
                nav.goBack();
              },
              onError: (error: any) => {
                feedback.error();
                Alert.alert('خطأ', error.response?.data?.message || 'فشل في إلغاء التوافق');
              },
            });
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (!messages.length) return;
    const timeout = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 150);
    return () => clearTimeout(timeout);
  }, [messages.length]);

  // Handle keyboard events
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 300);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);
  
  const formatMessageTime = (timestamp: Timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatLastSeen = (lastSeen: number | undefined) => {
    if (!lastSeen) return '';
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'نشط الآن';
    if (diffMins < 60) return `نشط منذ ${diffMins} دقيقة`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `نشط منذ ${diffHours} ساعة`;
    
    return `نشط منذ ${Math.floor(diffHours / 24)} يوم`;
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    
    const olderMessages = await loadMore();
    if (olderMessages.length > 0) {
      // Keep scroll position when loading older messages
      // FlatList handles this automatically with maintainVisibleContentPosition
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={styles.flex}>
            {match && (
              <View style={styles.header}>
                <TouchableOpacity 
                  style={styles.headerMain} 
                  activeOpacity={0.85} 
                  onPress={() => {
                    feedback.buttonPress();
                    setCardVisible(true);
                  }}
                >
                  <View style={styles.avatarContainer}>
                    <Avatar
                      uri={otherUser?.photos?.[0]?.url}
                      label={otherUser?.display_name}
                      size={60}
                    />
                    {otherUserOnline && (
                      <View style={styles.onlineIndicator} />
                    )}
                    {guardian && (
                      <View style={styles.guardianIndicator}>
                        <Ionicons name="shield-checkmark" size={12} color="#fff" />
                      </View>
                    )}
                  </View>
                  <View style={styles.headerText}>
                    <View style={styles.nameRow}>
                      <Text style={styles.headerName}>{otherUser?.display_name ?? '—'}</Text>
                      {guardian && (
                        <View style={styles.guardianBadge}>
                          <Ionicons name="heart" size={12} color="#fff" />
                          <Text style={styles.guardianText}>ولي</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.headerMeta} numberOfLines={1}>
                      {otherUserOnline ? 'متصل الآن' : formatLastSeen(otherUserLastSeen)}
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <View style={styles.headerActions}>
                  <TouchableOpacity 
                    style={styles.headerActionBtn}
                    onPress={() => {
                      feedback.buttonPress();
                      setCardVisible(true);
                    }}
                  >
                    <Ionicons name="person-outline" size={20} color={colors.accent} />
                    <Text style={styles.headerActionText}>التفاصيل</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.headerReportBtn}
                    onPress={handleReport}
                  >
                    <Ionicons name="flag-outline" size={20} color="#ef4444" />
                    <Text style={styles.headerReportText}>إبلاغ</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.headerUnmatchBtn}
                    onPress={handleUnmatch}
                  >
                    <Ionicons name="close-outline" size={20} color="#ef4444" />
                    <Text style={styles.headerUnmatchText}>إلغاء</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {guardian && (
              <View style={styles.banner}>
                <Ionicons name="shield-checkmark" size={18} color={colors.info} style={{ marginLeft: spacing(0.5) }} />
                <Text style={styles.bannerText}>وضع الولي/الوالدة مفعل للحوار</Text>
              </View>
            )}

            {messagesLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.accent} />
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(m) => m.id}
                renderItem={({ item }) => {
                  const mine = item.senderId === currentUserId;
                  const avatarUser = mine ? myProfile : otherUser;
                  const isRead = item.readBy[otherUserId || ''] !== null;
                  
                  return (
                    <View style={[styles.messageRow, mine ? styles.rowMine : styles.rowTheirs]}>
                      {!mine && (
                        <Avatar
                          uri={avatarUser?.photos?.[0]?.url}
                          label={avatarUser?.display_name}
                          size={36}
                          style={styles.msgAvatar}
                        />
                      )}
                      <View style={[styles.msg, mine ? styles.msgMine : styles.msgTheirs]}>
                        <Text style={[styles.msgText, mine ? styles.msgTextMine : styles.msgTextTheirs]}>
                          {item.text}
                        </Text>
                        <View style={styles.timeRow}>
                          <Text style={[styles.time, mine ? styles.timeMine : styles.timeTheirs]}>
                            {formatMessageTime(item.createdAt)}
                          </Text>
                          {mine && (
                            <Ionicons 
                              name={isRead ? "checkmark-done" : "checkmark"} 
                              size={12} 
                              color={isRead ? colors.accent : "#555"} 
                              style={{ marginRight: 4 }}
                            />
                          )}
                        </View>
                      </View>
                      {mine && (
                        <Avatar
                          uri={avatarUser?.photos?.[0]?.url}
                          label={avatarUser?.display_name}
                          size={32}
                          style={styles.msgAvatar}
                        />
                      )}
                    </View>
                  );
                }}
                style={styles.messagesWrapper}
                contentContainerStyle={{ 
                  paddingTop: spacing(1), 
                  paddingBottom: spacing(3),
                  paddingHorizontal: spacing(2),
                  flexGrow: 1 
                }}
                keyboardShouldPersistTaps="handled"
                maintainVisibleContentPosition={{
                  minIndexForVisible: 0,
                }}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListHeaderComponent={
                  loadingMore ? (
                    <View style={styles.loadMoreIndicator}>
                      <ActivityIndicator size="small" color={colors.accent} />
                    </View>
                  ) : null
                }
                ListEmptyComponent={
                  <View style={styles.emptyWrapper}>
                    <Ionicons name="chatbubble-ellipses" size={32} color={colors.muted} />
                    <Text style={styles.emptyText}>ابدأ المحادثة بكلمة طيبة ✨</Text>
                  </View>
                }
                onContentSizeChange={() => {
                  if (messages.length > 0 && !loadingMore) {
                    flatListRef.current?.scrollToEnd({ animated: false });
                  }
                }}
              />
            )}

            <View style={[styles.inputWrapper, { paddingBottom: Math.max(insets.bottom, spacing(1.5)) }]}>
              <View style={styles.composer}>
                <TextInput
                  style={styles.input}
                  value={text}
                  onChangeText={setText}
                  placeholder="اكتب رسالة"
                  placeholderTextColor={colors.subtext}
                  returnKeyType="send"
                  onSubmitEditing={sendMsg}
                  blurOnSubmit={false}
                  editable={!sending}
                  onFocus={() => {
                    setTimeout(() => {
                      flatListRef.current?.scrollToEnd({ animated: true });
                    }, 400);
                  }}
                />
                <TouchableOpacity 
                  onPress={() => {
                    feedback.buttonPress();
                    sendMsg();
                  }} 
                  style={[styles.send, sending && styles.sendDisabled]}
                  disabled={sending || !text.trim()}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Ionicons name="send" size={18} color="#000" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <ProfileDetailModal
        visible={cardVisible}
        onClose={() => setCardVisible(false)}
        user={otherUser}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadMoreIndicator: {
    padding: spacing(2),
    alignItems: 'center',
  },
  header: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing(2),
    marginHorizontal: spacing(2),
    marginTop: 0,
    marginBottom: spacing(1),
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerMain: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: spacing(1.5),
  },
  avatarContainer: {
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: colors.card,
  },
  guardianIndicator: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    backgroundColor: colors.info,
    borderRadius: radii.pill,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.card,
  },
  headerText: {
    flex: 1,
    marginHorizontal: spacing(1.5),
  },
  nameRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing(1),
  },
  headerName: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  guardianBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing(1),
    paddingVertical: spacing(0.5),
    borderRadius: radii.pill,
    gap: spacing(0.25),
  },
  guardianText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  headerMeta: {
    color: colors.subtext,
    fontSize: 13,
    marginTop: spacing(0.25),
    textAlign: 'right',
  },
  headerActions: {
    flexDirection: 'row-reverse',
    gap: spacing(1),
  },
  headerActionBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing(1),
    paddingHorizontal: spacing(1.5),
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
    ...shadows.soft,
  },
  headerActionText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
    marginRight: spacing(0.5),
  },
  headerReportBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing(1),
    paddingHorizontal: spacing(1.5),
    borderRadius: radii.lg,
    backgroundColor: '#ef444410',
    borderWidth: 1,
    borderColor: '#ef4444',
    ...shadows.soft,
  },
  headerReportText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
    marginRight: spacing(0.5),
  },
  headerUnmatchBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing(1),
    paddingHorizontal: spacing(1.5),
    borderRadius: radii.lg,
    backgroundColor: '#ef444410',
    borderWidth: 1,
    borderColor: '#ef4444',
    ...shadows.soft,
  },
  headerUnmatchText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
    marginRight: spacing(0.5),
  },
  banner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.chip,
    padding: spacing(1),
    borderRadius: radii.md,
    marginHorizontal: spacing(2),
    marginBottom: spacing(1),
  },
  bannerText: { color: colors.text, textAlign: 'right', fontSize: 12, flex: 1 },
  messagesWrapper: {
    flex: 1,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing(1.25),
    gap: spacing(1),
  },
  rowMine: {
    flexDirection: 'row-reverse',
  },
  rowTheirs: {
    flexDirection: 'row',
  },
  msg: {
    maxWidth: '72%',
    paddingVertical: spacing(1),
    paddingHorizontal: spacing(1.5),
    borderRadius: radii.lg,
    ...shadows.soft,
  },
  msgMine: {
    backgroundColor: colors.accent,
    borderBottomRightRadius: radii.sm,
  },
  msgTheirs: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radii.sm,
  },
  msgText: {
    textAlign: 'right',
    lineHeight: 20,
    fontSize: 14,
  },
  msgTextMine: {
    color: '#000',
  },
  msgTextTheirs: {
    color: colors.text,
  },
  timeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: spacing(0.5),
  },
  time: {
    fontSize: 10,
    textAlign: 'right',
  },
  timeMine: {
    color: '#111',
  },
  timeTheirs: {
    color: colors.subtext,
  },
  msgAvatar: {
    ...shadows.soft,
  },
  emptyWrapper: {
    marginTop: spacing(6),
    alignItems: 'center',
    gap: spacing(1),
  },
  emptyText: {
    color: colors.subtext,
    fontSize: 14,
    textAlign: 'center',
  },
  inputWrapper: {
    paddingHorizontal: spacing(2),
  },
  composer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing(1),
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing(1),
    ...shadows.soft,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    color: colors.text,
    height: 44,
    borderRadius: radii.lg,
    paddingHorizontal: spacing(2),
    textAlign: 'right',
  },
  send: {
    backgroundColor: colors.accent,
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    opacity: 0.5,
  },
});

