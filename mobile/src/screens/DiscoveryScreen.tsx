import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Swiper from 'react-native-deck-swiper';
import { useQuery } from '@tanstack/react-query';
import { colors, gradients, radii, shadows, spacing } from '../theme';
import { getClient, User } from '../api/client';
import IconButton from '../components/ui/IconButton';
import GradientBackground from '../components/ui/GradientBackground';

function OverlayLabel({ text, variant }: { text: string; variant: 'like' | 'nope' | 'super' }) {
  const bg = variant === 'like' ? gradients.like : variant === 'nope' ? gradients.nope : gradients.super;
  return (
    <View style={{ position: 'absolute', top: spacing(2), right: variant === 'like' ? spacing(2) : undefined, left: variant !== 'like' ? spacing(2) : undefined, transform: [{ rotate: variant === 'like' ? '-10deg' : '10deg' }] }}>
      <View style={{ borderRadius: radii.md, overflow: 'hidden' }}>
        <View style={{ backgroundColor: colors.overlayDarker }}>
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 22, letterSpacing: 2, paddingHorizontal: spacing(1), paddingVertical: 4 }}>{text}</Text>
        </View>
      </View>
    </View>
  );
}

function Card({ user }: { user: User }) {
  const photo = user.photos?.[0]?.url;
  return (
    <View style={styles.card}>
      {photo ? (
        <Image
          source={{ uri: `${getClient().defaults.baseURL}${photo}` }}
          style={styles.photo}
          blurRadius={user.privacy_blur_mode ? 25 : 0}
        />
      ) : null}
      {user.role === 'mother' && (
        <View style={styles.motherBadge}><Text style={styles.motherText}>أم{user.mother_for === 'son' ? ' تبحث لابنها' : user.mother_for === 'daughter' ? ' تبحث لابنتها' : ''}</Text></View>
      )}
      <View style={styles.gradientFade} />
      <View style={styles.info}>
        <Text style={styles.name}>{user.display_name}</Text>
        <Text style={styles.sub}>{user.city}، {user.country}</Text>
        <Text style={styles.sub}>{user.education} • {user.profession}</Text>
      </View>
    </View>
  );
}

export default function DiscoveryScreen() {
  const api = getClient();
  const nav = useNavigation<any>();
  const { data, refetch, isLoading } = useQuery({
    queryKey: ['discovery'],
    queryFn: async () => (await api.get('/discovery')).data.users as User[],
  });

  return (
    <GradientBackground>
      <View style={styles.container}>
        {isLoading ? (
          <Text style={styles.loading}>جاري التحميل...</Text>
        ) : (
          <Swiper
            cards={data ?? []}
            renderCard={(u) => u ? <Card user={u} /> : <View />}
            onSwipedAll={() => refetch()}
            onSwipedRight={(idx) => {
              const u = (data ?? [])[idx];
              if (u) api.post('/swipes', { to_user_id: u.id, direction: 'right' }).catch(()=>{});
            }}
            onSwipedLeft={(idx) => {
              const u = (data ?? [])[idx];
              if (u) api.post('/swipes', { to_user_id: u.id, direction: 'left' }).catch(()=>{});
            }}
            backgroundColor="transparent"
            stackSize={3}
            verticalSwipe={false}
            cardVerticalMargin={spacing(2)}
            overlayLabels={{
              left: {
                element: <OverlayLabel text="رفض" variant="nope" />,
                style: { wrapper: { alignItems: 'flex-start' } },
              },
              right: {
                element: <OverlayLabel text="إعجاب" variant="like" />,
                style: { wrapper: { alignItems: 'flex-end' } },
              },
            }}
          />
        )}
        <View style={styles.actions}>
          <IconButton name="close" variant="danger" onPress={() => { /* no-op; swipe handled by gesture */ }} />
          <IconButton name="star" variant="gradient" onPress={() => { /* future: super like */ }} />
          <IconButton name="heart" variant="success" onPress={() => { /* no-op; swipe handled by gesture */ }} />
        </View>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => nav.navigate('Filters')} style={styles.filter}><Text style={styles.filterText}>تصفية</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => refetch()} style={styles.refresh}><Text style={styles.refreshText}>تحديث</Text></TouchableOpacity>
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing(2) },
  loading: { color: colors.text, textAlign: 'center', marginTop: spacing(4) },
  card: { flex: 0.7, borderRadius: radii.lg, backgroundColor: colors.card, overflow: 'hidden', ...shadows.card },
  photo: { width: '100%', height: '75%' },
  gradientFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', backgroundColor: colors.overlayDark },
  info: { position: 'absolute', bottom: spacing(2), right: spacing(2), left: spacing(2) },
  name: { color: colors.text, fontSize: 26, fontWeight: '800', textAlign: 'right' },
  sub: { color: colors.subtext, marginTop: 4, textAlign: 'right' },
  motherBadge: { position: 'absolute', top: spacing(1), left: spacing(1), backgroundColor: colors.chip, paddingHorizontal: spacing(1), paddingVertical: 4, borderRadius: 8 },
  motherText: { color: colors.text, fontSize: 12 },
  actions: { position: 'absolute', bottom: spacing(2), alignSelf: 'center', flexDirection: 'row-reverse', gap: spacing(2) },
  topBar: { position: 'absolute', top: spacing(1), right: spacing(2), left: spacing(2), flexDirection: 'row-reverse', justifyContent: 'space-between' },
  filter: { backgroundColor: colors.chip, paddingHorizontal: spacing(3), paddingVertical: spacing(1), borderRadius: radii.pill },
  filterText: { color: colors.text, fontWeight: '700' },
  refresh: { backgroundColor: colors.accent, paddingHorizontal: spacing(3), paddingVertical: spacing(1), borderRadius: radii.pill },
  refreshText: { color: '#000', fontWeight: 'bold' },
});

