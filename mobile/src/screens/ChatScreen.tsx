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
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getClient, Match, Message, useApiState } from '../api/client';
import { colors, radii, shadows, spacing } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../components/ui/Avatar';
import GradientBackground from '../components/ui/GradientBackground';
import MatchPreviewModal, { formatUserLocation } from '../components/MatchPreviewModal';

export default function ChatScreen() {
  const route = useRoute<RouteProp<any>>();
  const matchId = (route.params as any)?.matchId as string;
  const currentUserId = useApiState((state) => state.currentUserId);
  const api = useMemo(() => getClient(), [currentUserId]);
  const baseUrl = api.defaults.baseURL;
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [guardian, setGuardian] = useState(false);
  const [match, setMatch] = useState<Match | null>(null);
  const [cardVisible, setCardVisible] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<Message> | null>(null);

  const otherUser = useMemo(() => {
    if (!match || !currentUserId) return null;
    return match.user_a.id === currentUserId ? match.user_b : match.user_a;
  }, [match, currentUserId]);

  const myProfile = useMemo(() => {
    if (!match || !currentUserId) return null;
    return match.user_a.id === currentUserId ? match.user_a : match.user_b;
  }, [match, currentUserId]);

  const loadMatch = useCallback(async () => {
    const res = await api.get(`/matches/${matchId}`);
    const m = res.data as Match;
    setMatch(m);
    const a = m.user_a?.role as string;
    const b = m.user_b?.role as string;
    setGuardian(a === 'mother' || b === 'mother');
  }, [api, matchId]);

  const loadMessages = useCallback(async () => {
    const res = await api.get(`/messages/${matchId}/messages`);
    setMessages(res.data.messages);
  }, [api, matchId]);

  async function send() {
    if (!text.trim()) return;
    const messageText = text;
    
    // Optimistic update - add message immediately to UI
    const tempMessage = {
      id: `temp-${Date.now()}`,
      match_id: matchId,
      sender_id: currentUserId!,
      text: messageText,
      created_at: new Date().toISOString(),
      read_at: null,
      flagged: false,
    };
    
    setMessages((m) => [...m, tempMessage]);
    setText('');
    
    // Scroll to bottom immediately
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);
    
    // Send to backend in background
    try {
      const res = await api.post(`/messages/${matchId}/messages`, { text: messageText });
      // Replace temp message with real one
      setMessages((m) => m.map(msg => msg.id === tempMessage.id ? res.data : msg));
    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove temp message on error
      setMessages((m) => m.filter(msg => msg.id !== tempMessage.id));
    }
  }

  // Avoid overlapping poll requests
  const messagesInFlightRef = useRef(false);

  useEffect(() => {
    loadMatch();
    (async () => {
      if (messagesInFlightRef.current) return;
      messagesInFlightRef.current = true;
      try { await loadMessages(); } finally { messagesInFlightRef.current = false; }
    })();

    const id = setInterval(async () => {
      if (messagesInFlightRef.current) return;
      messagesInFlightRef.current = true;
      try { await loadMessages(); } finally { messagesInFlightRef.current = false; }
    }, 1500); // faster polling for near-realtime feel
    return () => clearInterval(id);
  }, [loadMatch, loadMessages]);

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
              <TouchableOpacity style={styles.header} activeOpacity={0.85} onPress={() => setCardVisible(true)}>
                <Avatar
                  uri={otherUser?.photos?.[0]?.url}
                  label={otherUser?.display_name}
                  size={56}
                />
                <View style={styles.headerText}>
                  <Text style={styles.headerName}>{otherUser?.display_name ?? '—'}</Text>
                  <Text style={styles.headerMeta} numberOfLines={1}>
                    {formatUserLocation(otherUser)}
                  </Text>
                </View>
                <View style={styles.headerAction}>
                  <Ionicons name="id-card" size={18} color={colors.accent} />
                  <Text style={styles.headerActionText}>عرض البطاقة</Text>
                </View>
              </TouchableOpacity>
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
                <TouchableOpacity style={styles.attach}>
                  <Ionicons name="image" size={20} color={colors.text} />
                </TouchableOpacity>
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
                <TouchableOpacity onPress={send} style={styles.send}>
                  <Ionicons name="send" size={18} color="#000" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <MatchPreviewModal
        visible={cardVisible}
        onClose={() => setCardVisible(false)}
        user={otherUser}
        baseUrl={baseUrl}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing(1.5),
    marginHorizontal: spacing(2),
    marginTop: 0,
    marginBottom: spacing(0.75),
    ...shadows.soft,
  },
  headerText: {
    flex: 1,
    marginHorizontal: spacing(1.5),
  },
  headerName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
  },
  headerMeta: {
    color: colors.subtext,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  headerAction: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing(0.5),
    paddingHorizontal: spacing(1),
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  headerActionText: {
    color: colors.accent,
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
  attach: {
    backgroundColor: colors.surface,
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
});

function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
}

