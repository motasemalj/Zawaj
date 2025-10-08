import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, shadows } from '../theme';
import { feedback } from '../utils/haptics';
import { useCurrentUser, useOnboardingOptions, useUpdatePreferences } from '../api/hooks';

type Props = {
  visible: boolean;
  onClose: () => void;
  onFiltersChanged?: () => void;
};

export default function SearchFiltersModal({ visible, onClose, onFiltersChanged }: Props) {
  const insets = useSafeAreaInsets();
  
  // React Query hooks
  const { data: userData } = useCurrentUser();
  const { data: optionsData } = useOnboardingOptions();
  const updatePreferencesMutation = useUpdatePreferences();

  // Basic Filters
  const [ageMin, setAgeMin] = useState(20);
  const [ageMax, setAgeMax] = useState(35);
  const [distanceKm, setDistanceKm] = useState(50);
  const [heightMin, setHeightMin] = useState(150);
  const [heightMax, setHeightMax] = useState(190);

  // Advanced Filters
  const [selectedSects, setSelectedSects] = useState<string[]>([]);
  const [selectedEducation, setSelectedEducation] = useState<string[]>([]);
  const [selectedMaritalStatus, setSelectedMaritalStatus] = useState<string[]>([]);
  const [selectedSmoking, setSelectedSmoking] = useState<string[]>([]);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [selectedRelocate, setSelectedRelocate] = useState<string | null>(null);
  const [selectedOrigins, setSelectedOrigins] = useState<string[]>([]);

  // Enable toggles
  const [distanceEnabled, setDistanceEnabled] = useState(true);
  const [ageEnabled, setAgeEnabled] = useState(true);
  const [heightEnabled, setHeightEnabled] = useState(true);
  const [originEnabled, setOriginEnabled] = useState(true);
  const [sectEnabled, setSectEnabled] = useState(true);
  const [educationEnabled, setEducationEnabled] = useState(true);
  const [maritalEnabled, setMaritalEnabled] = useState(true);
  const [smokingEnabled, setSmokingEnabled] = useState(true);
  const [childrenEnabled, setChildrenEnabled] = useState(true);
  const [relocateEnabled, setRelocateEnabled] = useState(true);

  const options = optionsData || {};

  useEffect(() => {
    if (!visible || !userData) return;
    const prefs = userData?.preferences || {};
        setAgeMin(prefs.age_min || 20);
        setAgeMax(prefs.age_max || 35);
        setDistanceKm(typeof prefs.distance_km === 'number' ? prefs.distance_km : 50);
        setHeightMin(prefs.height_min_cm || 150);
        setHeightMax(prefs.height_max_cm || 190);
        try { if (prefs.sect_preferences) setSelectedSects(JSON.parse(prefs.sect_preferences)); } catch {}
        try { if (prefs.education_preferences) setSelectedEducation(JSON.parse(prefs.education_preferences)); } catch {}
        try { if (prefs.marital_status_preferences) setSelectedMaritalStatus(JSON.parse(prefs.marital_status_preferences)); } catch {}
        try { if (prefs.smoking_preferences) setSelectedSmoking(JSON.parse(prefs.smoking_preferences)); } catch {}
        try { if (prefs.children_preferences) setSelectedChildren(JSON.parse(prefs.children_preferences)); } catch {}
        try { if (prefs.origin_preferences) setSelectedOrigins(JSON.parse(prefs.origin_preferences)); } catch {}
        if (prefs.relocate_preference !== undefined && prefs.relocate_preference !== null) {
          setSelectedRelocate(prefs.relocate_preference ? 'yes' : 'no');
        } else {
          setSelectedRelocate(null);
        }

        // Initialize enables based on presence of values
        setDistanceEnabled(typeof prefs.distance_km === 'number');
        setAgeEnabled(!!(prefs.age_min || prefs.age_max));
        setHeightEnabled(!!(prefs.height_min_cm || prefs.height_max_cm));
        setOriginEnabled(!!(prefs.origin_preferences && JSON.parse(prefs.origin_preferences || '[]').length));
        setSectEnabled(!!(prefs.sect_preferences && JSON.parse(prefs.sect_preferences || '[]').length));
        setEducationEnabled(!!(prefs.education_preferences && JSON.parse(prefs.education_preferences || '[]').length));
        setMaritalEnabled(!!(prefs.marital_status_preferences && JSON.parse(prefs.marital_status_preferences || '[]').length));
        setSmokingEnabled(!!(prefs.smoking_preferences && JSON.parse(prefs.smoking_preferences || '[]').length));
        setChildrenEnabled(!!(prefs.children_preferences && JSON.parse(prefs.children_preferences || '[]').length));
        setRelocateEnabled(prefs.relocate_preference !== undefined && prefs.relocate_preference !== null);
  }, [visible, userData]);

  useEffect(() => {
    if (!visible || !userData) return;
    const timer = setTimeout(() => {
      updatePreferencesMutation.mutate({
        age_min: ageEnabled ? ageMin : null,
        age_max: ageEnabled ? ageMax : null,
        distance_km: distanceEnabled ? distanceKm : null,
        height_min_cm: heightEnabled ? heightMin : null,
        height_max_cm: heightEnabled ? heightMax : null,
        sect_preferences: sectEnabled ? JSON.stringify(selectedSects) : JSON.stringify([]),
        education_preferences: educationEnabled ? JSON.stringify(selectedEducation) : JSON.stringify([]),
        marital_status_preferences: maritalEnabled ? JSON.stringify(selectedMaritalStatus) : JSON.stringify([]),
        smoking_preferences: smokingEnabled ? JSON.stringify(selectedSmoking) : JSON.stringify([]),
        children_preferences: childrenEnabled ? JSON.stringify(selectedChildren) : JSON.stringify([]),
        origin_preferences: originEnabled ? JSON.stringify(selectedOrigins) : JSON.stringify([]),
        relocate_preference: relocateEnabled ? (selectedRelocate === null ? null : selectedRelocate === 'yes') : null,
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [ageMin, ageMax, distanceKm, heightMin, heightMax, selectedSects, selectedEducation, selectedMaritalStatus, selectedSmoking, selectedChildren, selectedRelocate, selectedOrigins, ageEnabled, heightEnabled, distanceEnabled, originEnabled, sectEnabled, educationEnabled, maritalEnabled, smokingEnabled, childrenEnabled, relocateEnabled, visible, userData]);

  function buildPreferencesPayload() {
    return {
      age_min: ageEnabled ? ageMin : null,
      age_max: ageEnabled ? ageMax : null,
      distance_km: distanceEnabled ? distanceKm : null,
      height_min_cm: heightEnabled ? heightMin : null,
      height_max_cm: heightEnabled ? heightMax : null,
      sect_preferences: sectEnabled ? JSON.stringify(selectedSects) : JSON.stringify([]),
      education_preferences: educationEnabled ? JSON.stringify(selectedEducation) : JSON.stringify([]),
      marital_status_preferences: maritalEnabled ? JSON.stringify(selectedMaritalStatus) : JSON.stringify([]),
      smoking_preferences: smokingEnabled ? JSON.stringify(selectedSmoking) : JSON.stringify([]),
      children_preferences: childrenEnabled ? JSON.stringify(selectedChildren) : JSON.stringify([]),
      origin_preferences: originEnabled ? JSON.stringify(selectedOrigins) : JSON.stringify([]),
      relocate_preference: relocateEnabled ? (selectedRelocate === null ? null : selectedRelocate === 'yes') : null,
    } as const;
  }

  function applyAndClose() {
    // Apply immediately to avoid debounce race, then notify parent and close
    updatePreferencesMutation.mutate(buildPreferencesPayload(), {
      onSuccess: () => {
        onFiltersChanged?.();
      },
      onSettled: () => {
        onClose();
      },
    });
  }

  function toggleSelection(array: string[], setArray: (arr: string[]) => void, value: string) {
    if (array.includes(value)) setArray(array.filter(v => v !== value)); else setArray([...array, value]);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { paddingTop: insets.top + spacing(1), paddingBottom: Math.max(insets.bottom, spacing(2)) }]}> 
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { feedback.buttonPress(); applyAndClose(); }} style={styles.closeBtn}>
            <Ionicons name="chevron-down" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>فلاتر البحث</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Distance */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="location" size={20} color={colors.accent} />
              <Text style={styles.cardTitle}>نطاق المسافة</Text>
              <View style={styles.headerSpacer} />
              <View style={styles.rtlSwitchContainer}>
                <Switch value={distanceEnabled} onValueChange={setDistanceEnabled} trackColor={{ true: colors.accent, false: colors.border }} thumbColor="#fff" />
              </View>
            </View>
            <View style={styles.distanceControlSettingsMatch}>
              <Text style={styles.distanceValueSettingsMatch}>{distanceKm} كم</Text>
              <View style={styles.rtlSliderContainerSettingsMatch}>
                <Slider
                  style={styles.sliderSettingsMatch}
                  minimumValue={5}
                  maximumValue={500}
                  step={5}
                  value={distanceKm}
                  onValueChange={setDistanceKm}
                  minimumTrackTintColor={colors.accent}
                  maximumTrackTintColor={colors.border}
                  thumbTintColor={colors.accent}
                  disabled={!distanceEnabled}
                />
              </View>
              <View style={styles.distanceLabelsSettingsMatch}>
                <Text style={styles.distanceLabel}>5</Text>
                <Text style={styles.distanceLabel}>100</Text>
                <Text style={styles.distanceLabel}>500</Text>
              </View>
            </View>
          </View>

          {/* Age Range */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="calendar" size={20} color={colors.accent} />
              <Text style={styles.cardTitle}>نطاق العمر</Text>
              <View style={styles.headerSpacer} />
              <View style={styles.rtlSwitchContainer}>
                <Switch value={ageEnabled} onValueChange={setAgeEnabled} trackColor={{ true: colors.accent, false: colors.border }} thumbColor="#fff" />
              </View>
            </View>
            <View style={styles.sliderContainer}>
              <Text style={styles.rangeDisplay}>
                {ageMin} - {ageMax} سنة
              </Text>
              <View style={styles.multiSliderWrapper}>
                <MultiSlider
                  values={[ageMin, ageMax]}
                  min={18}
                  max={100}
                  step={1}
                  onValuesChange={(values) => {
                    setAgeMin(values[0]);
                    setAgeMax(values[1]);
                  }}
                  selectedStyle={{ backgroundColor: colors.accent }}
                  unselectedStyle={{ backgroundColor: colors.border }}
                  markerStyle={{
                    backgroundColor: colors.accent,
                    height: 24,
                    width: 24,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: '#fff',
                  }}
                  pressedMarkerStyle={{
                    backgroundColor: colors.accent,
                    height: 28,
                    width: 28,
                    borderRadius: 14,
                  }}
                  containerStyle={{ height: 40 }}
                  trackStyle={{ height: 4, borderRadius: 2 }}
                  enabledOne={ageEnabled}
                  enabledTwo={ageEnabled}
                />
              </View>
              <View style={styles.rangeLabels}>
                <Text style={styles.rangeLabelText}>18</Text>
                <Text style={styles.rangeLabelText}>100</Text>
              </View>
            </View>
          </View>

          {/* Height Range */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="resize" size={20} color={colors.accent} />
              <Text style={styles.cardTitle}>نطاق الطول</Text>
              <View style={styles.headerSpacer} />
              <View style={styles.rtlSwitchContainer}>
                <Switch value={heightEnabled} onValueChange={setHeightEnabled} trackColor={{ true: colors.accent, false: colors.border }} thumbColor="#fff" />
              </View>
            </View>
            <View style={styles.sliderContainer}>
              <Text style={styles.rangeDisplay}>
                {heightMin === 140 && heightMax === 220 ? 'أي طول' : `${heightMin} - ${heightMax === 220 ? 'بلا حد' : heightMax} سم`}
              </Text>
              <View style={styles.multiSliderWrapper}>
                <MultiSlider
                  values={[heightMin, heightMax]}
                  min={140}
                  max={220}
                  step={1}
                  onValuesChange={(values) => {
                    setHeightMin(values[0]);
                    setHeightMax(values[1]);
                  }}
                  selectedStyle={{ backgroundColor: colors.accent }}
                  unselectedStyle={{ backgroundColor: colors.border }}
                  markerStyle={{
                    backgroundColor: colors.accent,
                    height: 24,
                    width: 24,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: '#fff',
                  }}
                  pressedMarkerStyle={{
                    backgroundColor: colors.accent,
                    height: 28,
                    width: 28,
                    borderRadius: 14,
                  }}
                  containerStyle={{ height: 40 }}
                  trackStyle={{ height: 4, borderRadius: 2 }}
                  enabledOne={heightEnabled}
                  enabledTwo={heightEnabled}
                />
              </View>
              <View style={styles.rangeLabels}>
                <Text style={styles.rangeLabelText}>140</Text>
                <Text style={styles.rangeLabelText}>بلا حد</Text>
              </View>
            </View>
          </View>

          {/* Origin */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="flag" size={20} color={colors.accent} />
              <Text style={styles.cardTitle}>الأصل</Text>
              <View style={styles.headerSpacer} />
              <View style={styles.rtlSwitchContainer}>
                <Switch value={originEnabled} onValueChange={setOriginEnabled} trackColor={{ true: colors.accent, false: colors.border }} thumbColor="#fff" />
              </View>
            </View>
            <Text style={styles.hint}>فارغ = الكل</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.originScrollContent}>
              {(options.arabic_origins || []).map((country: any) => (
                <TouchableOpacity key={country.code} style={[styles.originChip, selectedOrigins.includes(country.name) && styles.originChipActive]} onPress={() => { if (!originEnabled) return; feedback.selection(); toggleSelection(selectedOrigins, setSelectedOrigins, country.name); }}>
                  <Text style={[styles.originName, selectedOrigins.includes(country.name) && styles.originNameActive]}>
                    {country.name} {country.flag}
                  </Text>
                  {selectedOrigins.includes(country.name) && (
                    <View style={styles.originCheckmark}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Sect */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="moon" size={20} color={colors.accent} />
              <Text style={styles.cardTitle}>المذهب</Text>
              <View style={styles.headerSpacer} />
              <View style={styles.rtlSwitchContainer}>
                <Switch value={sectEnabled} onValueChange={setSectEnabled} trackColor={{ true: colors.accent, false: colors.border }} thumbColor="#fff" />
              </View>
            </View>
            <Text style={styles.hint}>فارغ = الكل</Text>
            <View style={styles.chipsContainer}>
              {(options.sects || []).map((sect: string) => (
                <TouchableOpacity key={sect} style={[styles.filterChip, selectedSects.includes(sect) && styles.filterChipActive]} onPress={() => { if (!sectEnabled) return; toggleSelection(selectedSects, setSelectedSects, sect); }}>
                  <Text style={[styles.filterChipText, selectedSects.includes(sect) && styles.filterChipTextActive]}>{sect}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Education */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="school" size={20} color={colors.accent} />
              <Text style={styles.cardTitle}>التعليم</Text>
              <View style={styles.headerSpacer} />
              <View style={styles.rtlSwitchContainer}>
                <Switch value={educationEnabled} onValueChange={setEducationEnabled} trackColor={{ true: colors.accent, false: colors.border }} thumbColor="#fff" />
              </View>
            </View>
            <Text style={styles.hint}>فارغ = الكل</Text>
            <View style={styles.chipsContainer}>
              {(options.education_levels || []).map((level: string) => (
                <TouchableOpacity key={level} style={[styles.filterChip, selectedEducation.includes(level) && styles.filterChipActive]} onPress={() => { if (!educationEnabled) return; toggleSelection(selectedEducation, setSelectedEducation, level); }}>
                  <Text style={[styles.filterChipText, selectedEducation.includes(level) && styles.filterChipTextActive]}>{level}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Marital Status */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="heart" size={20} color={colors.accent} />
              <Text style={styles.cardTitle}>الحالة الاجتماعية</Text>
              <View style={styles.headerSpacer} />
              <View style={styles.rtlSwitchContainer}>
                <Switch value={maritalEnabled} onValueChange={setMaritalEnabled} trackColor={{ true: colors.accent, false: colors.border }} thumbColor="#fff" />
              </View>
            </View>
            <Text style={styles.hint}>فارغ = الكل</Text>
            <View style={styles.chipsContainer}>
              {(options.marital_status_options || []).map((status: string) => (
                <TouchableOpacity key={status} style={[styles.filterChip, selectedMaritalStatus.includes(status) && styles.filterChipActive]} onPress={() => { if (!maritalEnabled) return; toggleSelection(selectedMaritalStatus, setSelectedMaritalStatus, status); }}>
                  <Text style={[styles.filterChipText, selectedMaritalStatus.includes(status) && styles.filterChipTextActive]}>{status}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Smoking */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="ban" size={20} color={colors.accent} />
              <Text style={styles.cardTitle}>التدخين</Text>
              <View style={styles.headerSpacer} />
              <View style={styles.rtlSwitchContainer}>
                <Switch value={smokingEnabled} onValueChange={setSmokingEnabled} trackColor={{ true: colors.accent, false: colors.border }} thumbColor="#fff" />
              </View>
            </View>
            <Text style={styles.hint}>فارغ = الكل</Text>
            <View style={styles.chipsContainer}>
              {(options.smoking_options || []).map((option: string) => (
                <TouchableOpacity key={option} style={[styles.filterChip, selectedSmoking.includes(option) && styles.filterChipActive]} onPress={() => { if (!smokingEnabled) return; toggleSelection(selectedSmoking, setSelectedSmoking, option); }}>
                  <Text style={[styles.filterChipText, selectedSmoking.includes(option) && styles.filterChipTextActive]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Children */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="people" size={20} color={colors.accent} />
              <Text style={styles.cardTitle}>رغبة الأطفال</Text>
              <View style={styles.headerSpacer} />
              <View style={styles.rtlSwitchContainer}>
                <Switch value={childrenEnabled} onValueChange={setChildrenEnabled} trackColor={{ true: colors.accent, false: colors.border }} thumbColor="#fff" />
              </View>
            </View>
            <Text style={styles.hint}>فارغ = الكل</Text>
            <View style={styles.chipsContainer}>
              {(options.children_preferences || []).map((pref: string) => (
                <TouchableOpacity key={pref} style={[styles.filterChip, selectedChildren.includes(pref) && styles.filterChipActive]} onPress={() => { if (!childrenEnabled) return; toggleSelection(selectedChildren, setSelectedChildren, pref); }}>
                  <Text style={[styles.filterChipText, selectedChildren.includes(pref) && styles.filterChipTextActive]}>{pref}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Relocation */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="airplane" size={20} color={colors.accent} />
              <Text style={styles.cardTitle}>الاستعداد للانتقال</Text>
              <View style={styles.headerSpacer} />
              <View style={styles.rtlSwitchContainer}>
                <Switch value={relocateEnabled} onValueChange={setRelocateEnabled} trackColor={{ true: colors.accent, false: colors.border }} thumbColor="#fff" />
              </View>
            </View>
            <Text style={styles.hint}>اختر واحد</Text>
            <View style={styles.chipsContainer}>
              <TouchableOpacity style={[styles.filterChip, selectedRelocate === null && styles.filterChipActive]} onPress={() => relocateEnabled && setSelectedRelocate(null)}>
                <Text style={[styles.filterChipText, selectedRelocate === null && styles.filterChipTextActive]}>لا يهم</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.filterChip, selectedRelocate === 'yes' && styles.filterChipActive]} onPress={() => relocateEnabled && setSelectedRelocate('yes')}>
                <Text style={[styles.filterChipText, selectedRelocate === 'yes' && styles.filterChipTextActive]}>نعم</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.filterChip, selectedRelocate === 'no' && styles.filterChipActive]} onPress={() => relocateEnabled && setSelectedRelocate('no')}>
                <Text style={[styles.filterChipText, selectedRelocate === 'no' && styles.filterChipTextActive]}>لا</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(2),
    marginBottom: spacing(1),
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: spacing(2),
    paddingBottom: spacing(2),
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing(2),
    marginBottom: spacing(1.5),
    ...shadows.soft,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: spacing(1),
    gap: spacing(1),
  },
  headerSpacer: {
    flex: 1,
  },
  rtlSwitchContainer: {
    flexDirection: 'row-reverse',
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right',
  },
  distanceControl: {
    alignItems: 'stretch',
    gap: spacing(1),
  },
  distanceValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  rtlSliderContainer: {
    transform: [{ scaleX: -1 }],
  },
  slider: {
    width: '100%',
    height: 40,
    transform: [{ scaleX: -1 }],
  },
  // Settings screen matched variants for distance UI
  distanceControlSettingsMatch: {
    alignItems: 'center',
  },
  distanceValueSettingsMatch: {
    color: colors.accent,
    fontSize: 32,
    fontWeight: '800',
    marginBottom: spacing(1),
    textAlign: 'right',
    width: '100%',
  },
  rtlSliderContainerSettingsMatch: {
    flexDirection: 'row-reverse',
    transform: [{ scaleX: -1 }],
  },
  sliderSettingsMatch: {
    width: '100%',
    height: 40,
  },
  distanceLabelsSettingsMatch: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing(0.5),
  },
  distanceLabels: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  distanceLabel: {
    color: colors.subtext,
  },
  rangeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing(2),
  },
  rangeCol: {
    flex: 1,
  },
  rangeLabel: {
    color: colors.subtext,
    marginBottom: spacing(0.5),
    textAlign: 'right',
  },
  numberControl: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing(1),
  },
  controlBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  rangeNumber: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'center',
  },
  rangeDivider: {
    width: 1,
    backgroundColor: colors.border,
    height: '100%',
    opacity: 0.5,
  },
  heightDisplay: {
    flexDirection: 'row-reverse',
    alignItems: 'baseline',
    gap: spacing(0.5),
  },
  unitText: {
    color: colors.subtext,
    fontSize: 12,
  },
  hint: {
    color: colors.subtext,
    fontSize: 12,
    marginBottom: spacing(1),
    textAlign: 'right',
  },
  originScrollContent: {
    flexDirection: 'row-reverse',
    gap: spacing(1),
  },
  originChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
  },
  originChipActive: {
    borderColor: colors.accent,
  },
  originName: {
    color: colors.text,
  },
  originNameActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  originCheckmark: {
    position: 'absolute',
    left: -8,
    top: -8,
  },
  chipsContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing(1),
  },
  filterChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: radii.pill,
  },
  filterChipActive: {
    borderColor: colors.accent,
  },
  filterChipText: {
    color: colors.text,
  },
  filterChipTextActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  sliderContainer: {
    alignItems: 'stretch',
    gap: spacing(1),
  },
  rangeDisplay: {
    color: colors.accent,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing(1),
  },
  multiSliderWrapper: {
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
  },
  rangeLabels: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(1),
  },
  rangeLabelText: {
    color: colors.subtext,
    fontSize: 12,
  },
});


