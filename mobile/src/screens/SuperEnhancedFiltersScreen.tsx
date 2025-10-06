import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { getClient } from '../api/client';
import { colors, spacing, radii, shadows } from '../theme';
import GradientBackground from '../components/ui/GradientBackground';
import Button from '../components/ui/Button';
import ErrorMessage from '../components/ui/ErrorMessage';

export default function SuperEnhancedFiltersScreen() {
  const api = getClient();
  const insets = useSafeAreaInsets();
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Basic Filters
  const [ageMin, setAgeMin] = useState(20);
  const [ageMax, setAgeMax] = useState(35);
  const [distanceKm, setDistanceKm] = useState(50);
  const [heightMin, setHeightMin] = useState(150);
  const [heightMax, setHeightMax] = useState(190);
  
  // Preferences
  const [selectedSects, setSelectedSects] = useState<string[]>([]);
  const [selectedEducation, setSelectedEducation] = useState<string[]>([]);
  const [selectedMaritalStatus, setSelectedMaritalStatus] = useState<string[]>([]);
  const [selectedSmoking, setSelectedSmoking] = useState<string[]>([]);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [selectedRelocate, setSelectedRelocate] = useState<string | null>(null); // 'yes' | 'no' | null (any)
  
  const [options, setOptions] = useState<any>({});

  useEffect(() => {
    loadFilters();
    loadOptions();
  }, []);

  async function loadOptions() {
    try {
      const res = await api.get('/onboarding/options');
      setOptions(res.data);
    } catch (err) {
      console.error('Failed to load options', err);
    }
  }

  async function loadFilters() {
    try {
      const res = await api.get('/users/me');
      const prefs = res.data.preferences;
      
      if (prefs) {
        setAgeMin(prefs.age_min || 20);
        setAgeMax(prefs.age_max || 35);
        setDistanceKm(prefs.distance_km || 50);
        setHeightMin(prefs.height_min_cm || 150);
        setHeightMax(prefs.height_max_cm || 190);
        
        // Parse JSON filters
        if (prefs.sect_preferences) {
          try {
            setSelectedSects(JSON.parse(prefs.sect_preferences));
          } catch {}
        }
        if (prefs.education_preferences) {
          try {
            setSelectedEducation(JSON.parse(prefs.education_preferences));
          } catch {}
        }
        if (prefs.marital_status_preferences) {
          try {
            setSelectedMaritalStatus(JSON.parse(prefs.marital_status_preferences));
          } catch {}
        }
        if (prefs.smoking_preferences) {
          try {
            setSelectedSmoking(JSON.parse(prefs.smoking_preferences));
          } catch {}
        }
        if (prefs.children_preferences) {
          try {
            setSelectedChildren(JSON.parse(prefs.children_preferences));
          } catch {}
        }
        if (prefs.relocate_preference !== undefined && prefs.relocate_preference !== null) {
          setSelectedRelocate(prefs.relocate_preference ? 'yes' : 'no');
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to load filters:', err);
      setError('فشل تحميل التفضيلات');
      setLoading(false);
    }
  }

  async function saveFilters() {
    try {
      setError(null);
      await api.put('/users/me/preferences', {
        age_min: ageMin,
        age_max: ageMax,
        distance_km: distanceKm,
        height_min_cm: heightMin,
        height_max_cm: heightMax,
        sect_preferences: JSON.stringify(selectedSects),
        education_preferences: JSON.stringify(selectedEducation),
        marital_status_preferences: JSON.stringify(selectedMaritalStatus),
        smoking_preferences: JSON.stringify(selectedSmoking),
        children_preferences: JSON.stringify(selectedChildren),
        relocate_preference: selectedRelocate === null ? null : selectedRelocate === 'yes',
      });
      
      setSuccess('✅ تم حفظ تفضيلاتك');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل حفظ التفضيلات');
    }
  }

  function toggleSelection(array: string[], setArray: (arr: string[]) => void, value: string) {
    if (array.includes(value)) {
      setArray(array.filter(v => v !== value));
    } else {
      setArray([...array, value]);
    }
  }

  function resetFilters() {
    setAgeMin(18);
    setAgeMax(100);
    setDistanceKm(100);
    setHeightMin(140);
    setHeightMax(210);
    setSelectedSects([]);
    setSelectedEducation([]);
    setSelectedMaritalStatus([]);
    setSelectedSmoking([]);
    setSelectedChildren([]);
    setSelectedRelocate(null);
  }

  if (loading) {
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center' }]}>
          <Text style={styles.loading}>جاري التحميل...</Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={{ paddingTop: insets.top + spacing(2), paddingBottom: spacing(6) }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>تفضيلات البحث</Text>
        <Text style={styles.subtitle}>قم بتخصيص معايير الاستكشاف للحصول على أفضل التوافقات</Text>

        <ErrorMessage message={error} type="error" />
        <ErrorMessage message={success} type="success" />

        {/* Age Range */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar" size={20} color={colors.accent} />
            <Text style={styles.sectionTitle}>نطاق العمر</Text>
          </View>
          <View style={styles.filterCard}>
            <View style={styles.rangeDisplay}>
              <View style={styles.rangeBox}>
                <Text style={styles.rangeValue}>{ageMin}</Text>
                <Text style={styles.rangeLabel}>من</Text>
              </View>
              <Ionicons name="remove" size={20} color={colors.muted} />
              <View style={styles.rangeBox}>
                <Text style={styles.rangeValue}>{ageMax}</Text>
                <Text style={styles.rangeLabel}>إلى</Text>
              </View>
            </View>
            
            <View style={styles.sliderGroup}>
              <Text style={styles.sliderLabel}>الحد الأدنى: {ageMin}</Text>
              <Slider
                style={styles.slider}
                minimumValue={18}
                maximumValue={100}
                step={1}
                value={ageMin}
                onValueChange={setAgeMin}
                minimumTrackTintColor={colors.accent}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.accent}
              />
            </View>

            <View style={styles.sliderGroup}>
              <Text style={styles.sliderLabel}>الحد الأقصى: {ageMax}</Text>
              <Slider
                style={styles.slider}
                minimumValue={18}
                maximumValue={100}
                step={1}
                value={ageMax}
                onValueChange={setAgeMax}
                minimumTrackTintColor={colors.accent}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.accent}
              />
            </View>
          </View>
        </View>

        {/* Height Range */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="resize" size={20} color={colors.accent} />
            <Text style={styles.sectionTitle}>نطاق الطول</Text>
          </View>
          <View style={styles.filterCard}>
            <View style={styles.rangeDisplay}>
              <View style={styles.rangeBox}>
                <Text style={styles.rangeValue}>{heightMin} سم</Text>
                <Text style={styles.rangeLabel}>من</Text>
              </View>
              <Ionicons name="remove" size={20} color={colors.muted} />
              <View style={styles.rangeBox}>
                <Text style={styles.rangeValue}>{heightMax} سم</Text>
                <Text style={styles.rangeLabel}>إلى</Text>
              </View>
            </View>
            
            <View style={styles.sliderGroup}>
              <Text style={styles.sliderLabel}>الحد الأدنى: {heightMin} سم ({Math.round(heightMin / 2.54)} بوصة)</Text>
              <Slider
                style={styles.slider}
                minimumValue={140}
                maximumValue={210}
                step={1}
                value={heightMin}
                onValueChange={setHeightMin}
                minimumTrackTintColor={colors.accent}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.accent}
              />
            </View>

            <View style={styles.sliderGroup}>
              <Text style={styles.sliderLabel}>الحد الأقصى: {heightMax} سم ({Math.round(heightMax / 2.54)} بوصة)</Text>
              <Slider
                style={styles.slider}
                minimumValue={140}
                maximumValue={210}
                step={1}
                value={heightMax}
                onValueChange={setHeightMax}
                minimumTrackTintColor={colors.accent}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.accent}
              />
            </View>
          </View>
        </View>

        {/* Distance */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={20} color={colors.accent} />
            <Text style={styles.sectionTitle}>نطاق المسافة</Text>
          </View>
          <View style={styles.filterCard}>
            <View style={styles.distanceDisplay}>
              <Text style={styles.distanceValue}>{distanceKm} كم</Text>
              <Text style={styles.distanceLabel}>المسافة القصوى</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={5}
              maximumValue={500}
              step={5}
              value={distanceKm}
              onValueChange={setDistanceKm}
              minimumTrackTintColor={colors.accent}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.accent}
            />
            <View style={styles.distanceHints}>
              <Text style={styles.distanceHint}>5 كم</Text>
              <Text style={styles.distanceHint}>100 كم</Text>
              <Text style={styles.distanceHint}>500 كم</Text>
            </View>
          </View>
        </View>

        {/* Sect Preferences */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="moon" size={20} color={colors.accent} />
            <Text style={styles.sectionTitle}>المذهب المفضل</Text>
          </View>
          <Text style={styles.hint}>اختر المذاهب المقبولة (فارغ = الكل)</Text>
          <View style={styles.chipContainer}>
            {(options.sects || []).map((sect: string) => (
              <TouchableOpacity
                key={sect}
                style={[styles.chip, selectedSects.includes(sect) && styles.chipActive]}
                onPress={() => toggleSelection(selectedSects, setSelectedSects, sect)}
              >
                <Text style={[styles.chipText, selectedSects.includes(sect) && styles.chipTextActive]}>
                  {sect}
                </Text>
                {selectedSects.includes(sect) && (
                  <Ionicons name="checkmark-circle" size={16} color="#000" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Education Preferences */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="school" size={20} color={colors.accent} />
            <Text style={styles.sectionTitle}>المستوى التعليمي المفضل</Text>
          </View>
          <Text style={styles.hint}>اختر المستويات التعليمية المقبولة (فارغ = الكل)</Text>
          <View style={styles.chipContainer}>
            {(options.education_levels || []).map((level: string) => (
              <TouchableOpacity
                key={level}
                style={[styles.chip, selectedEducation.includes(level) && styles.chipActive]}
                onPress={() => toggleSelection(selectedEducation, setSelectedEducation, level)}
              >
                <Text style={[styles.chipText, selectedEducation.includes(level) && styles.chipTextActive]}>
                  {level}
                </Text>
                {selectedEducation.includes(level) && (
                  <Ionicons name="checkmark-circle" size={16} color="#000" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Marital Status Preferences */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="heart" size={20} color={colors.accent} />
            <Text style={styles.sectionTitle}>الحالة الاجتماعية المفضلة</Text>
          </View>
          <Text style={styles.hint}>اختر الحالات المقبولة (فارغ = الكل)</Text>
          <View style={styles.chipContainer}>
            {(options.marital_status_options || []).map((status: string) => (
              <TouchableOpacity
                key={status}
                style={[styles.chip, selectedMaritalStatus.includes(status) && styles.chipActive]}
                onPress={() => toggleSelection(selectedMaritalStatus, setSelectedMaritalStatus, status)}
              >
                <Text style={[styles.chipText, selectedMaritalStatus.includes(status) && styles.chipTextActive]}>
                  {status}
                </Text>
                {selectedMaritalStatus.includes(status) && (
                  <Ionicons name="checkmark-circle" size={16} color="#000" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Smoking Preferences */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="ban" size={20} color={colors.accent} />
            <Text style={styles.sectionTitle}>التدخين</Text>
          </View>
          <Text style={styles.hint}>اختر الحالات المقبولة (فارغ = الكل)</Text>
          <View style={styles.chipContainer}>
            {(options.smoking_options || []).map((option: string) => (
              <TouchableOpacity
                key={option}
                style={[styles.chip, selectedSmoking.includes(option) && styles.chipActive]}
                onPress={() => toggleSelection(selectedSmoking, setSelectedSmoking, option)}
              >
                <Text style={[styles.chipText, selectedSmoking.includes(option) && styles.chipTextActive]}>
                  {option}
                </Text>
                {selectedSmoking.includes(option) && (
                  <Ionicons name="checkmark-circle" size={16} color="#000" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Children Preferences */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={20} color={colors.accent} />
            <Text style={styles.sectionTitle}>رغبة الأطفال</Text>
          </View>
          <Text style={styles.hint}>اختر التفضيلات المقبولة (فارغ = الكل)</Text>
          <View style={styles.chipContainer}>
            {(options.children_preferences || []).map((pref: string) => (
              <TouchableOpacity
                key={pref}
                style={[styles.chip, selectedChildren.includes(pref) && styles.chipActive]}
                onPress={() => toggleSelection(selectedChildren, setSelectedChildren, pref)}
              >
                <Text style={[styles.chipText, selectedChildren.includes(pref) && styles.chipTextActive]}>
                  {pref}
                </Text>
                {selectedChildren.includes(pref) && (
                  <Ionicons name="checkmark-circle" size={16} color="#000" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Relocation Preference */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="airplane" size={20} color={colors.accent} />
            <Text style={styles.sectionTitle}>الاستعداد للانتقال</Text>
          </View>
          <Text style={styles.hint}>هل تريد شخصاً مستعداً للانتقال للخارج؟</Text>
          <View style={styles.chipContainer}>
            <TouchableOpacity
              style={[styles.chip, selectedRelocate === null && styles.chipActive]}
              onPress={() => setSelectedRelocate(null)}
            >
              <Text style={[styles.chipText, selectedRelocate === null && styles.chipTextActive]}>
                لا يهم
              </Text>
              {selectedRelocate === null && (
                <Ionicons name="checkmark-circle" size={16} color="#000" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, selectedRelocate === 'yes' && styles.chipActive]}
              onPress={() => setSelectedRelocate('yes')}
            >
              <Text style={[styles.chipText, selectedRelocate === 'yes' && styles.chipTextActive]}>
                نعم، مستعد
              </Text>
              {selectedRelocate === 'yes' && (
                <Ionicons name="checkmark-circle" size={16} color="#000" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, selectedRelocate === 'no' && styles.chipActive]}
              onPress={() => setSelectedRelocate('no')}
            >
              <Text style={[styles.chipText, selectedRelocate === 'no' && styles.chipTextActive]}>
                لا، غير مستعد
              </Text>
              {selectedRelocate === 'no' && (
                <Ionicons name="checkmark-circle" size={16} color="#000" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <Button 
            title="💾 حفظ التفضيلات" 
            onPress={saveFilters}
          />
          <Button 
            title="🔄 إعادة التعيين" 
            variant="outline"
            onPress={resetFilters}
          />
        </View>

        {/* Info Note */}
        <View style={styles.infoNote}>
          <Ionicons name="information-circle" size={20} color={colors.accent} />
          <Text style={styles.infoText}>
            التفضيلات الفارغة تعني قبول جميع الخيارات. كلما كانت التفضيلات أكثر مرونة، زادت فرص التوافق.
          </Text>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing(2),
  },
  loading: {
    color: colors.text,
    textAlign: 'center',
    fontSize: 16,
  },
  header: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    marginBottom: spacing(0.5),
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    color: colors.subtext,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'right',
    marginBottom: spacing(3),
    writingDirection: 'rtl',
  },
  section: {
    marginBottom: spacing(3),
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing(1),
    marginBottom: spacing(1),
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
  },
  hint: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'right',
    marginBottom: spacing(1.5),
    lineHeight: 18,
  },

  // Filter Card
  filterCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing(2.5),
    ...shadows.soft,
  },
  
  // Range Display
  rangeDisplay: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(2),
    gap: spacing(2),
  },
  rangeBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing(1.5),
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  rangeValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing(0.5),
  },
  rangeLabel: {
    color: colors.subtext,
    fontSize: 12,
  },

  // Slider Group
  sliderGroup: {
    marginBottom: spacing(1.5),
  },
  sliderLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing(0.5),
    textAlign: 'right',
  },
  slider: {
    width: '100%',
    height: 40,
  },

  // Distance Display
  distanceDisplay: {
    alignItems: 'center',
    marginBottom: spacing(2),
  },
  distanceValue: {
    color: colors.accent,
    fontSize: 32,
    fontWeight: '800',
  },
  distanceLabel: {
    color: colors.subtext,
    fontSize: 14,
    marginTop: spacing(0.5),
  },
  distanceHints: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginTop: spacing(1),
  },
  distanceHint: {
    color: colors.muted,
    fontSize: 12,
  },

  // Chips
  chipContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing(1),
  },
  chip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing(0.5),
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#000',
    fontWeight: '700',
  },

  // Footer
  footer: {
    gap: spacing(1.5),
    marginTop: spacing(2),
  },

  // Info Note
  infoNote: {
    flexDirection: 'row-reverse',
    backgroundColor: colors.surface,
    padding: spacing(2),
    borderRadius: radii.md,
    marginTop: spacing(2),
    gap: spacing(1.5),
    borderWidth: 1,
    borderColor: colors.accent + '40',
  },
  infoText: {
    flex: 1,
    color: colors.subtext,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
  },
});

