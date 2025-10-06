import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import Button from '../components/ui/Button';
import { colors, spacing } from '../theme';
import { getClient } from '../api/client';

export default function PermissionsScreen({ navigation }: any) {
  const api = getClient();
  const [locGranted, setLocGranted] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);
  const [locAsked, setLocAsked] = useState(false);
  const [notifAsked, setNotifAsked] = useState(false);

  // Check current permission status on mount
  useEffect(() => {
    checkPermissions();
  }, []);

  async function checkPermissions() {
    try {
      // Check location permission
      const locStatus = await Location.getForegroundPermissionsAsync();
      if (locStatus.granted) {
        setLocGranted(true);
        setLocAsked(true);
      } else if (locStatus.canAskAgain === false) {
        setLocAsked(true);
      }

      // Check notification permission
      const notifStatus = await Notifications.getPermissionsAsync();
      if (notifStatus.granted) {
        setNotifGranted(true);
        setNotifAsked(true);
      } else if (notifStatus.canAskAgain === false) {
        setNotifAsked(true);
      }
    } catch (e) {
      // Permissions not available on web
    }
  }

  async function askLocation() {
    setLocAsked(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocGranted(true);
        const pos = await Location.getCurrentPositionAsync({});
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        await api.put('/users/me/device', { location: { lat, lng } });
        try {
          const rg = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
          const first = rg?.[0];
          if (first) {
            const city = first.city || first.subregion || first.region || null as any;
            const country = first.country || null as any;
            await api.put('/users/me', { city, country });
          }
        } catch {}
      }
    } catch (e) {
      // Location not available on web
    }
  }

  async function askNotifications() {
    setNotifAsked(true);
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        const t = (await Notifications.getExpoPushTokenAsync()).data;
        setNotifGranted(true);
        await api.put('/users/me/device', { expo_push_token: t });
      }
    } catch (e) {
      // Notifications not available on web
    }
  }

  function continueToApp() {
    navigation.replace('Tabs');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>الأذونات</Text>
      <Text style={styles.subtitle}>اختياري - لتحسين التجربة</Text>
      <View style={{ height: spacing(2) }} />
      <Text style={styles.text}>📍 الموقع للمقترحات القريبة</Text>
      <Button 
        title={locGranted ? '✓ تم السماح بالموقع' : locAsked ? 'تم الرفض' : 'السماح بالموقع'} 
        onPress={askLocation} 
        variant={locGranted ? 'solid' : 'outline'}
        disabled={locAsked && !locGranted}
      />
      <View style={{ height: spacing(2) }} />
      <Text style={styles.text}>🔔 الإشعارات للتوافقات والرسائل (اختياري)</Text>
      <Button 
        title={notifGranted ? '✓ تم السماح بالإشعارات' : notifAsked ? 'تم الرفض' : 'السماح بالإشعارات'} 
        onPress={askNotifications}
        variant={notifGranted ? 'solid' : 'outline'}
        disabled={notifAsked && !notifGranted}
      />
      <View style={{ height: spacing(3) }} />
      <Button title="متابعة" onPress={continueToApp} />
      <View style={{ height: spacing(1) }} />
      <Button title="تخطي الكل" variant="ghost" onPress={continueToApp} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing(2), justifyContent: 'center' },
  title: { color: colors.text, textAlign: 'center', fontSize: 22, fontWeight: '700', marginBottom: spacing(1) },
  subtitle: { color: colors.subtext, textAlign: 'center', marginBottom: spacing(2) },
  text: { color: colors.text, textAlign: 'center', marginBottom: spacing(1), fontSize: 16 },
});


