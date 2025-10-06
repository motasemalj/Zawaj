import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import { colors, radii, spacing } from '../theme';
import Button from '../components/ui/Button';
import ErrorMessage from '../components/ui/ErrorMessage';
import { getClient } from '../api/client';

export default function OnboardingScreen({ navigation }: any) {
  const api = getClient();
  const [role, setRole] = useState<'male'|'female'|'mother'|null>(null);
  const [motherFor, setMotherFor] = useState<'son'|'daughter'|null>(null);
  const [displayName, setDisplayName] = useState('');
  const [dob, setDob] = useState('1998-01-01');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [education, setEducation] = useState('');
  const [profession, setProfession] = useState('');
  const [marital, setMarital] = useState('single');
  const [muslim, setMuslim] = useState(false);
  const [religiousness, setRel] = useState('3');
  const [prayer, setPrayer] = useState('often');
  const [hijab, setHijab] = useState('');
  const [beard, setBeard] = useState('');
  const [halal, setHalal] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function save() {
    try {
      setError(null);
      // Validations
      if (!role) { setError('يرجى اختيار الدور'); return; }
      if (role === 'mother' && !motherFor) { setError('يرجى اختيار ابني/ابنتي'); return; }
      if (!displayName.trim()) { setError('يرجى إدخال الاسم'); return; }
      if (displayName.trim().length < 2) { setError('الاسم يجب أن يكون حرفين على الأقل'); return; }
      if (!city.trim()) { setError('يرجى إدخال المدينة'); return; }
      if (!country.trim()) { setError('يرجى إدخال الدولة'); return; }
      if (!muslim) { setError('يجب الإقرار بأنك مسلم/مسلمة'); return; }
      
      // Date validation
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) { setError('تنسيق التاريخ غير صحيح (YYYY-MM-DD)'); return; }
      
      // Age check
      const birth = new Date(`${dob}T00:00:00Z`);
      const now = new Date();
      const age = now.getFullYear() - birth.getFullYear() - ((now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) ? 1 : 0);
      if (age < 18) { setError('يجب أن يكون العمر 18 سنة أو أكثر'); return; }
      if (age > 100) { setError('يرجى التحقق من تاريخ الميلاد'); return; }

      const data: any = {
        role,
        mother_for: role === 'mother' ? motherFor : null,
        display_name: displayName.trim(),
        dob: `${dob}T00:00:00Z`,
        city: city.trim(),
        country: country.trim(),
        education: education.trim() || undefined,
        profession: profession.trim() || undefined,
        marital_status: marital,
        muslim_affirmed: muslim,
        religiousness: Number(religiousness),
        prayer_freq: prayer,
        hijab: role === 'female' ? hijab : undefined,
        beard: role === 'male' ? beard : undefined,
        halal_diet: halal || undefined,
      };
      
      await api.put('/users/me', data);
      navigation.replace('Photos');
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء الحفظ');
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing(4) }} keyboardShouldPersistTaps="handled">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View>
      <Text style={styles.title}>الانضمام</Text>
      <Text style={styles.label}>أنا</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.choice, role==='male'&&styles.active]} onPress={()=>setRole('male')}><Text style={styles.choiceText}>ذكر</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.choice, role==='female'&&styles.active]} onPress={()=>setRole('female')}><Text style={styles.choiceText}>أنثى</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.choice, role==='mother'&&styles.active]} onPress={()=>setRole('mother')}><Text style={styles.choiceText}>أم</Text></TouchableOpacity>
      </View>
      {role==='mother' && (
        <>
          <Text style={styles.label}>أبحث لـ</Text>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.choice, motherFor==='son'&&styles.active]} onPress={()=>setMotherFor('son')}><Text style={styles.choiceText}>ابني</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.choice, motherFor==='daughter'&&styles.active]} onPress={()=>setMotherFor('daughter')}><Text style={styles.choiceText}>ابنتي</Text></TouchableOpacity>
          </View>
        </>
      )}
      <TextInput placeholder="الاسم" style={styles.input} value={displayName} onChangeText={setDisplayName} returnKeyType="next" />
      <TextInput placeholder="تاريخ الميلاد (YYYY-MM-DD)" style={styles.input} value={dob} onChangeText={setDob} returnKeyType="next" />
      <TextInput placeholder="المدينة" style={styles.input} value={city} onChangeText={setCity} returnKeyType="next" />
      <TextInput placeholder="الدولة" style={styles.input} value={country} onChangeText={setCountry} returnKeyType="next" />
      <TextInput placeholder="التعليم" style={styles.input} value={education} onChangeText={setEducation} returnKeyType="next" />
      <TextInput placeholder="المهنة" style={styles.input} value={profession} onChangeText={setProfession} returnKeyType="done" />
      <View style={styles.row}>
        <TouchableOpacity style={[styles.choice, muslim&&styles.active]} onPress={()=>setMuslim(!muslim)}><Text style={styles.choiceText}>أُقرّ أنني مسلم/مسلمة</Text></TouchableOpacity>
      </View>
      <ErrorMessage message={error} type="error" />
      <Button title="حفظ" onPress={save} />
        </View>
      </TouchableWithoutFeedback>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing(2) },
  title: { color: colors.text, fontSize: 22, textAlign: 'center', marginBottom: spacing(2) },
  label: { color: colors.text, marginTop: spacing(1), textAlign: 'right' },
  row: { flexDirection: 'row-reverse', gap: spacing(1), marginVertical: spacing(1) },
  choice: { backgroundColor: colors.chip, paddingHorizontal: spacing(2), paddingVertical: spacing(1), borderRadius: radii.md },
  active: { backgroundColor: colors.accent },
  choiceText: { color: colors.text, textAlign: 'center' },
  input: { backgroundColor: colors.surface, color: colors.text, borderRadius: radii.lg, height: 44, paddingHorizontal: spacing(1), marginBottom: spacing(1), textAlign: 'right' },
});

