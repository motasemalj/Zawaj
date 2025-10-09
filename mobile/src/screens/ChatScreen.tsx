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
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getClient, Match, Message, useApiState } from '../api/client';
import { colors, radii, shadows, spacing } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../components/ui/Avatar';
import GradientBackground from '../components/ui/GradientBackground';
import { feedback } from '../utils/haptics';
import ProfileDetailModal from '../components/ProfileDetailModal';
import { useMatch, useMessages, useSendMessage, useReport, useUnmatch } from '../api/hooks';

export default function ChatScreen() {
  const route = useRoute<RouteProp<any>>();
  const nav = useNavigation<any>();
  const matchId = (route.params as any)?.matchId as string;
  const currentUserId = useApiState((state) => state.currentUserId);
  const api = useMemo(() => getClient(), [currentUserId]);
  const baseUrl = api.defaults.baseURL;
  
  // React Query hooks
  const { data: match } = useMatch(matchId);
  const { data: messagesData } = useMessages(matchId);
  const sendMessageMutation = useSendMessage();
  const reportMutation = useReport();
  const unmatchMutation = useUnmatch();
  
  const [text, setText] = useState('');
  const [guardian, setGuardian] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<Message> | null>(null);

  // Helper function for formatting user location
  const formatUserLocation = (user: any) => {
    if (!user) return '—';
    const parts = [];
    if (user.city) parts.push(user.city);
    if (user.country) parts.push(user.country);
    return parts.length > 0 ? parts.join(', ') : '—';
  };
  
  const messages = messagesData || [];

  const otherUser = useMemo(() => {
    if (!match || !currentUserId) return null;
    return match.user_a.id === currentUserId ? match.user_b : match.user_a;
  }, [match, currentUserId]);

  const myProfile = useMemo(() => {
    if (!match || !currentUserId) return null;
    return match.user_a.id === currentUserId ? match.user_a : match.user_b;
  }, [match, currentUserId]);

  // Set guardian flag when match data loads
  useEffect(() => {
    if (match) {
      const a = match.user_a?.role as string;
      const b = match.user_b?.role as string;
      setGuardian(a === 'mother' || b === 'mother');
    }
  }, [match]);

  function send() {
    if (!text.trim()) return;
    const messageText = text;
    setText('');
    
    sendMessageMutation.mutate({
      match_id: matchId,
      text: messageText,
    });
    
    // Scroll to bottom after sending
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
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
                // Navigate back to matches screen
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

  // React Query handles polling automatically via refetchInterval

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
        // Scroll to bottom when keyboard appears - longer delay for reliability
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
                      {formatUserLocation(otherUser)}
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

            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(m) => m.id}
              renderItem={({ item }) => {
                const mine = item.sender_id === currentUserId;
                const avatarUser = mine ? myProfile : otherUser;
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
                      <Text style={[styles.msgText, mine ? styles.msgTextMine : styles.msgTextTheirs]}>{item.text}</Text>
                      <Text style={[styles.time, mine ? styles.timeMine : styles.timeTheirs]}>{formatTime(item.created_at)}</Text>
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
              ListEmptyComponent={
                <View style={styles.emptyWrapper}>
                  <Ionicons name="chatbubble-ellipses" size={32} color={colors.muted} />
                  <Text style={styles.emptyText}>ابدأ المحادثة بكلمة طيبة ✨</Text>
                </View>
              }
              onContentSizeChange={() => {
                if (messages.length > 0) {
                  flatListRef.current?.scrollToEnd({ animated: false });
                }
              }}
            />

            <View style={[styles.inputWrapper, { paddingBottom: Math.max(insets.bottom, spacing(1.5)) }]}>
              <View style={styles.composer}>
                <TextInput
                  style={styles.input}
                  value={text}
                  onChangeText={setText}
                  placeholder="اكتب رسالة"
                  placeholderTextColor={colors.subtext}
                  returnKeyType="send"
                  onSubmitEditing={send}
                  blurOnSubmit={false}
                  onFocus={() => {
                    // Scroll when input is focused
                    setTimeout(() => {
                      flatListRef.current?.scrollToEnd({ animated: true });
                    }, 400);
                  }}
                />
                <TouchableOpacity onPress={() => {
                  feedback.buttonPress();
                  send();
                }} style={styles.send}>
                  <Ionicons name="send" size={18} color="#000" />
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
  guardianIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
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
  time: {
    fontSize: 10,
    textAlign: 'right',
    marginTop: spacing(0.5),
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
});

function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
}

