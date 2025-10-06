import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import Button from '../components/ui/Button';
import { colors, radii, spacing } from '../theme';
import { getClient } from '../api/client';

export default function DetailsScreen({ navigation }: any) {
  const api = getClient();
  const [education, setEducation] = useState('');
  const [profession, setProfession] = useState('');
  const [income, setIncome] = useState('');
  const [languages, setLanguages] = useState('');
  const [bio, setBio] = useState('');

  async function save() {
    await api.put('/users/me', {
      education,
      profession,
      income_range: income,
      languages: languages ? languages.split(',').map(s => s.trim()) : [],
      bio,
    });
    navigation.replace('Tabs');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing(4) }} keyboardShouldPersistTaps="handled">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View>
          <Text style={styles.title}>معلومات تفصيلية</Text>
          <TextInput style={styles.input} placeholder="التعليم" value={education} onChangeText={setEducation} returnKeyType="next" />
          <TextInput style={styles.input} placeholder="المهنة" value={profession} onChangeText={setProfession} returnKeyType="next" />
          <TextInput style={styles.input} placeholder="الدخل (اختياري)" value={income} onChangeText={setIncome} returnKeyType="next" />
          <TextInput style={styles.input} placeholder="اللغات (مثال: العربية, الإنجليزية)" value={languages} onChangeText={setLanguages} returnKeyType="next" />
          <TextInput style={styles.inputArea} placeholder="نبذة عني" value={bio} onChangeText={setBio} multiline returnKeyType="done" />
          <Button title="متابعة" onPress={save} />
        </View>
      </TouchableWithoutFeedback>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing(2) },
  title: { color: colors.text, textAlign: 'center', fontSize: 20, marginBottom: spacing(2) },
  input: { backgroundColor: colors.surface, color: colors.text, borderRadius: radii.lg, height: 44, paddingHorizontal: spacing(2), marginBottom: spacing(1), textAlign: 'right' },
  inputArea: { backgroundColor: colors.surface, color: colors.text, borderRadius: radii.lg, minHeight: 100, paddingHorizontal: spacing(2), paddingVertical: spacing(1), marginBottom: spacing(2), textAlignVertical: 'top', textAlign: 'right' },
});


