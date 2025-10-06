import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { getClient, useApiState } from '../api/client';
import { colors, spacing } from '../theme';

export default function AuthPickerScreen() {
  const { setCurrentUserId, setBaseUrl, baseUrl } = useApiState();
  const [users, setUsers] = useState<{ id: string; display_name: string; role: string; mother_for: string | null }[]>([]);
  const [backend, setBackend] = useState(baseUrl || 'http://192.168.1.22:4000');

  async function loadUsers() {
    try {
      setBaseUrl(backend);
      const api = getClient();
      const res = await api.get('/dev/users');
      setUsers(res.data.users);
    } catch (e) {
      // noop for MVP
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>اختر حسابًا للتجربة</Text>
      <View style={styles.row}>
        <TextInput value={backend} onChangeText={setBackend} placeholder="http://192.168.1.22:4000" style={styles.input} />
        <TouchableOpacity onPress={loadUsers} style={styles.loadBtn}><Text style={styles.btnText}>تحديث</Text></TouchableOpacity>
      </View>
      {users.map(u => (
        <TouchableOpacity key={u.id} style={styles.user} onPress={() => setCurrentUserId(u.id)}>
          <Text style={styles.userText}>{u.display_name} • {u.role}{u.mother_for ? ` (${u.mother_for})` : ''}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing(2) },
  title: { color: colors.text, fontSize: 20, textAlign: 'center', marginBottom: spacing(2) },
  row: { flexDirection: 'row-reverse', gap: spacing(1), alignItems: 'center', marginBottom: spacing(2) },
  input: { flex: 1, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: spacing(1), height: 40 },
  loadBtn: { backgroundColor: colors.accent, paddingHorizontal: spacing(2), paddingVertical: spacing(1), borderRadius: 8 },
  btnText: { color: '#000', fontWeight: 'bold' },
  user: { backgroundColor: colors.card, padding: spacing(2), borderRadius: 10, marginBottom: spacing(1) },
  userText: { color: colors.text },
});

