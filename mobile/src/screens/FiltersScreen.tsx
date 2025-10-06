import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { colors, spacing } from '../theme';
import { getClient } from '../api/client';

export default function FiltersScreen() {
  const api = getClient();
  const [ageMin, setAgeMin] = useState('20');
  const [ageMax, setAgeMax] = useState('35');
  const [relMin, setRelMin] = useState('3');

  useEffect(() => {
    api.get('/users/me').then(res => {
      const p = res.data.preferences;
      if (p?.age_min) setAgeMin(String(p.age_min));
      if (p?.age_max) setAgeMax(String(p.age_max));
      if (p?.religiousness_min) setRelMin(String(p.religiousness_min));
    }).catch(()=>{});
  }, []);

  async function save() {
    await api.put('/users/me/preferences', {
      age_min: Number(ageMin) || undefined,
      age_max: Number(ageMax) || undefined,
      religiousness_min: Number(relMin) || undefined,
    });
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.row}><Text style={styles.label}>السن الأدنى</Text><TextInput value={ageMin} onChangeText={setAgeMin} keyboardType="numeric" style={styles.input} returnKeyType="next" /></View>
        <View style={styles.row}><Text style={styles.label}>السن الأقصى</Text><TextInput value={ageMax} onChangeText={setAgeMax} keyboardType="numeric" style={styles.input} returnKeyType="next" /></View>
        <View style={styles.row}><Text style={styles.label}>الالتزام الأدنى</Text><TextInput value={relMin} onChangeText={setRelMin} keyboardType="numeric" style={styles.input} returnKeyType="done" /></View>
        <TouchableOpacity onPress={save} style={styles.save}><Text style={styles.saveText}>حفظ</Text></TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing(2) },
  row: { backgroundColor: colors.card, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', padding: spacing(2), borderRadius: 10, marginBottom: spacing(1) },
  label: { color: colors.text, textAlign: 'right' },
  input: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: spacing(1), width: 100, height: 36, textAlign: 'right' },
  save: { marginTop: spacing(2), backgroundColor: colors.accent, alignSelf: 'center', paddingHorizontal: spacing(4), paddingVertical: spacing(1.5), borderRadius: 10 },
  saveText: { color: '#000', fontWeight: '700', textAlign: 'center' },
});

