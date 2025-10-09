import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Dimensions, Image, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getClient, User } from '../api/client';
import { colors, radii, shadows, spacing } from '../theme';
import GradientBackground from '../components/ui/GradientBackground';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import ProfileDetailModal from '../components/ProfileDetailModal';
import { Ionicons } from '@expo/vector-icons';
import { feedback } from '../utils/haptics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Avatar from '../components/ui/Avatar';
import MatchModal from '../components/MatchModal';
import { useCurrentUser } from '../api/hooks';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = spacing(2);
const NUM_COLUMNS = 2;
const CARD_WIDTH = (SCREEN_WIDTH - spacing(2) * 2 - CARD_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

function UserCard({ user, onPress }: { user: User; onPress: () => void }) {
  const api = getClient();
  const photo = user.photos?.[0]?.url;
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

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => {
        feedback.buttonPress();
        onPress();
      }}
    >
      <View style={styles.cardImageContainer}>
        {photo ? (
          <Image
            source={{ uri: `${api.defaults.baseURL}${photo}` }}
            style={styles.cardImage}
            blurRadius={user.privacy_blur_mode ? 20 : 0}
          />
        ) : (
          <View style={styles.noPhotoContainer}>
            <Avatar uri={undefined} size={60} label={user.display_name} />
          </View>
        )}
        {/* Gradient overlay for text readability */}
        <View style={styles.cardGradient} />
        
        {/* Mother badge */}
        {user.role === 'mother' && (
          <View style={styles.motherBadge}>
            <Ionicons name="heart" size={12} color="#fff" />
          </View>
        )}
        
        {/* Info overlay */}
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>
            {user.display_name}
          </Text>
          <View style={styles.cardMeta}>
            <Text style={styles.cardMetaText} numberOfLines={1}>
              {calculateAge(user.dob)} • {user.city || user.country}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function LikedMeScreen() {
  const api = getClient();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const navigation = useNavigation<any>();
  const { data: currentUser } = useCurrentUser();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data, refetch, isFetching } = useQuery({
    queryKey: ['liked-me'],
    queryFn: async () => {
      const res = await api.get('/swipes/liked-me');
      return res.data.users as User[];
    },
  });

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const swipeMutation = useMutation({
    mutationFn: async ({ userId, direction }: { userId: string; direction: 'left' | 'right' }) => {
      const res = await api.post('/swipes', {
        to_user_id: userId,
        direction,
      });
      return res.data;
    },
    onSuccess: (data) => {
      // Refetch liked-me list and matches
      queryClient.invalidateQueries({ queryKey: ['liked-me'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      
      // CRITICAL: Invalidate discovery to refresh the deck immediately
      queryClient.invalidateQueries({ queryKey: ['discovery'] });
      
      // Check if a match was created
      if (data.match) {
        console.log('✅ Match created!', data.match);
      }
    },
  });

  const handleLike = async () => {
    if (!selectedUser || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const result = await swipeMutation.mutateAsync({ 
        userId: selectedUser.id, 
        direction: 'right' 
      });
      
      // Close the profile modal
      setSelectedUser(null);
      
      // If a match was created, show match modal with celebration
      if (result.match) {
        setMatchedUser(selectedUser);
        
        // Play match celebration sound and haptics
        feedback.match();
        
        // Show modal with slight delay for better UX
        setTimeout(() => {
          setShowMatchModal(true);
        }, 100);
      } else {
        // Just success haptic for regular like
        feedback.success();
      }
    } catch (error: any) {
      console.error('Error liking user:', error);
      feedback.error();
      Alert.alert(
        'خطأ',
        error.response?.data?.message || 'فشل في إرسال الإعجاب. حاول مرة أخرى.',
        [{ text: 'حسناً' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePass = async () => {
    if (!selectedUser || isProcessing) return;
    
    setIsProcessing(true);
    try {
      feedback.buttonPress();
      await swipeMutation.mutateAsync({ 
        userId: selectedUser.id, 
        direction: 'left' 
      });
      
      // Close the profile modal
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Error passing user:', error);
      feedback.error();
      Alert.alert(
        'خطأ',
        error.response?.data?.message || 'فشل في تسجيل التمرير. حاول مرة أخرى.',
        [{ text: 'حسناً' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const users = data ?? [];

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing(2)) }]}>
          <View style={styles.headerBlock}>
            <Text style={styles.title}>أعجبتهم</Text>
            <Text style={styles.subtitle}>تصفح الأشخاص الذين أعجبوا بك واختر من تريد</Text>
          </View>

          <FlatList
            data={users}
            keyExtractor={(user) => user.id}
            numColumns={NUM_COLUMNS}
            columnWrapperStyle={styles.row}
            refreshControl={
              <RefreshControl
                refreshing={isFetching}
                onRefresh={() => refetch()}
                tintColor={colors.accent}
                title="جاري التحديث..."
                titleColor={colors.text}
              />
            }
            renderItem={({ item }) => (
              <UserCard
                user={item}
                onPress={() => setSelectedUser(item)}
              />
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="heart-dislike" size={64} color={colors.muted} />
                </View>
                <Text style={styles.emptyTitle}>لا يوجد إعجابات بعد</Text>
                <Text style={styles.emptyText}>
                  عندما يعجب بك أحد، سيظهر هنا.{'\n'}
                  واصل التفاعل في تبويب الاستكشاف!
                </Text>
              </View>
            }
          />
        </View>
      </SafeAreaView>

      <ProfileDetailModal
        visible={Boolean(selectedUser)}
        onClose={() => {
          if (!isProcessing) {
            setSelectedUser(null);
          }
        }}
        user={selectedUser}
        onLike={handleLike}
        onPass={handlePass}
      />

      <MatchModal
        visible={showMatchModal}
        currentUser={currentUser ?? null}
        matchedUser={matchedUser}
        onClose={() => {
          setShowMatchModal(false);
          setMatchedUser(null);
        }}
        onSendMessage={() => {
          if (matchedUser) {
            setShowMatchModal(false);
            const userId = matchedUser.id;
            setMatchedUser(null);
            navigation.navigate('Chat', { userId });
          }
        }}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: spacing(2),
    paddingTop: spacing(2),
  },
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
  listContent: {
    paddingBottom: spacing(3),
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.4,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: colors.card,
    ...shadows.card,
  },
  cardImageContainer: {
    flex: 1,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  noPhotoContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  motherBadge: {
    position: 'absolute',
    top: spacing(1),
    left: spacing(1),
    backgroundColor: colors.accent,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  cardInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing(1.5),
  },
  cardName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: spacing(0.5),
  },
  cardMeta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  cardMetaText: {
    color: colors.subtext,
    fontSize: 13,
    textAlign: 'right',
  },
  emptyState: {
    marginTop: spacing(10),
    alignItems: 'center',
    paddingHorizontal: spacing(4),
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(3),
    ...shadows.soft,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing(1),
  },
  emptyText: {
    color: colors.subtext,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});

