import React, { useState, useEffect } from 'react';
import { View, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { getClient, useApiState } from '../api/client';
import { colors } from '../theme';
import { feedback } from '../utils/haptics';

// Import all step screens
import Step1NameRole from './onboarding/Step1NameRole';
import Step2DateOfBirth from './onboarding/Step2DateOfBirth';
import Step3ProfilePhotos from './onboarding/Step3ProfilePhotos';
import Step4Demographics from './onboarding/Step4Demographics';
import Step5AboutMe from './onboarding/Step5AboutMe';
import Step6InterestsTraits from './onboarding/Step6InterestsTraits';
import Step7Icebreakers from './onboarding/Step7Icebreakers';
import Step8Preferences from './onboarding/Step8Preferences';

export default function NewOnboardingScreen({ navigation }: any) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const api = getClient();
  const { setCurrentUserId, currentUserId } = useApiState();

  useEffect(() => {
    loadOnboardingStatus();
  }, []);

  const loadOnboardingStatus = async () => {
    try {
      const res = await api.get('/onboarding/status');
      if (res.data.completed) {
        navigation.replace('Tabs');
      } else {
        setCurrentStep((res.data.current_step || 0) + 1);
      }
      // Load user data for pre-filling forms
      await loadUserData();
    } catch (e) {
      // Start from step 1 if status unavailable
      setCurrentStep(1);
    }
  };

  const loadUserData = async () => {
    try {
      const res = await api.get('/users/me');
      const data = res.data;
      
      // Parse JSON fields
      if (data.ethnicity && typeof data.ethnicity === 'string') {
        try {
          data.ethnicity = JSON.parse(data.ethnicity);
        } catch {
          // If parsing fails, convert to array
          data.ethnicity = [data.ethnicity];
        }
      }
      
      setUserData(data);
    } catch (e) {
      console.error('Failed to load user data', e);
    }
  };

  const handleStep1Complete = async (data: any) => {
    try {
      setLoading(true);
      await api.post('/onboarding/step1', data);
      feedback.success();
      setCurrentStep(2);
    } catch (e: any) {
      feedback.error();
      Alert.alert('خطأ', e.response?.data?.error || 'فشل الحفظ');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Complete = async (data: any) => {
    try {
      setLoading(true);
      await api.post('/onboarding/step2', data);
      feedback.success();
      setCurrentStep(3);
    } catch (e: any) {
      feedback.error();
      Alert.alert('خطأ', e.response?.data?.error || 'فشل الحفظ');
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Complete = async (images: string[]) => {
    try {
      setLoading(true);
      
      // Upload all photos
      for (let i = 0; i < images.length; i++) {
        const formData = new FormData();
        formData.append('photo', {
          uri: images[i],
          type: 'image/jpeg',
          name: `photo-${i}.jpg`,
        } as any);
        formData.append('ordering', i.toString());

        await api.post('/photos', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      // Mark step 3 as complete
      await api.post('/onboarding/step3');
      
      feedback.success();
      setCurrentStep(4);
    } catch (e: any) {
      feedback.error();
      Alert.alert('خطأ', e.response?.data?.error || 'فشل رفع الصور');
    } finally {
      setLoading(false);
    }
  };

  const handleStep4Complete = async (data: any) => {
    try {
      setLoading(true);
      await api.post('/onboarding/step4', data);
      feedback.success();
      setCurrentStep(5);
    } catch (e: any) {
      feedback.error();
      Alert.alert('خطأ', e.response?.data?.error || 'فشل الحفظ');
    } finally {
      setLoading(false);
    }
  };

  const handleStep5Complete = async (data: any) => {
    try {
      setLoading(true);
      await api.post('/onboarding/step5', data);
      feedback.success();
      setCurrentStep(6);
    } catch (e: any) {
      feedback.error();
      Alert.alert('خطأ', e.response?.data?.error || 'فشل الحفظ');
    } finally {
      setLoading(false);
    }
  };

  const handleStep6Complete = async (data: any) => {
    try {
      setLoading(true);
      await api.post('/onboarding/step6', data);
      feedback.success();
      setCurrentStep(7);
    } catch (e: any) {
      feedback.error();
      Alert.alert('خطأ', e.response?.data?.error || 'فشل الحفظ');
    } finally {
      setLoading(false);
    }
  };

  const handleStep7Complete = async (data: any) => {
    try {
      setLoading(true);
      await api.post('/onboarding/step7', data);
      feedback.success();
      setCurrentStep(8);
    } catch (e: any) {
      feedback.error();
      Alert.alert('خطأ', e.response?.data?.error || 'فشل الحفظ');
    } finally {
      setLoading(false);
    }
  };

  const handleStep8Complete = async (data: any) => {
    try {
      setLoading(true);
      // Combine preferences and terms into final step
      await api.post('/onboarding/step8', {
        age_min: data.age_min,
        age_max: data.age_max,
        distance_km: data.distance_km,
        accept_terms: data.accept_terms,
      });
      
      // Mark onboarding as complete
      feedback.match(); // Special celebration for completing onboarding
      Alert.alert(
        '🎉 مرحباً بك في زواج!',
        'ملفك الشخصي مكتمل الآن. ابدأ في اكتشاف تطابقاتك!',
        [
          {
            text: 'ابدأ',
            onPress: () => navigation.replace('Tabs'),
          },
        ]
      );
    } catch (e: any) {
      feedback.error();
      Alert.alert('خطأ', e.response?.data?.error || 'فشل إكمال التسجيل');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const handleCancelOnboarding = () => {
    Alert.alert(
      'إلغاء التسجيل',
      'هل أنت متأكد أنك تريد إلغاء التسجيل؟ سيتم حذف حسابك.',
      [
        { text: 'الاستمرار في التسجيل', style: 'cancel' },
        { 
          text: 'نعم، إلغاء', 
          style: 'destructive', 
          onPress: async () => {
            try {
              setLoading(true);
              // Delete the incomplete account
              if (currentUserId) {
                await api.delete(`/users/me`);
              }
              // Log out
              setCurrentUserId(null);
              // Navigation will automatically go back to Welcome screen
            } catch (error) {
              console.error('Error deleting account:', error);
              // Still log out even if delete fails
              setCurrentUserId(null);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  switch (currentStep) {
    case 1:
      return <Step1NameRole onComplete={handleStep1Complete} onBack={handleCancelOnboarding} showBackButton={true} />;
    case 2:
      return <Step2DateOfBirth onComplete={handleStep2Complete} onBack={() => setCurrentStep(1)} />;
    case 3:
      return <Step3ProfilePhotos onComplete={handleStep3Complete} onBack={() => setCurrentStep(2)} />;
    case 4:
      return <Step4Demographics onComplete={handleStep4Complete} onBack={() => setCurrentStep(3)} />;
    case 5:
      return <Step5AboutMe onComplete={handleStep5Complete} onBack={() => setCurrentStep(4)} initialData={userData} />;
    case 6:
      return <Step6InterestsTraits onComplete={handleStep6Complete} onBack={() => setCurrentStep(5)} />;
    case 7:
      return <Step7Icebreakers onComplete={handleStep7Complete} onBack={() => setCurrentStep(6)} />;
    case 8:
      return <Step8Preferences onComplete={handleStep8Complete} onBack={() => setCurrentStep(7)} />;
    default:
      return <Step1NameRole onComplete={handleStep1Complete} onBack={handleCancelOnboarding} showBackButton={true} />;
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
});

