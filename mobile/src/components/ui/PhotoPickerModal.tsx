import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, radii, shadows } from '../../theme';

interface PhotoPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onImageSelected: (uri: string) => void;
  maxPhotos?: number;
  currentPhotoCount?: number;
}

export default function PhotoPickerModal({ 
  visible, 
  onClose, 
  onImageSelected, 
  maxPhotos = 5,
  currentPhotoCount = 0 
}: PhotoPickerModalProps) {
  
  const handleCameraRoll = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { 
        Alert.alert('إذن مطلوب', 'يرجى السماح بالوصول لمكتبة الصور'); 
        return; 
      }
      
      if (currentPhotoCount >= maxPhotos) {
        Alert.alert('الحد الأقصى', `يمكنك تحميل ${maxPhotos} صور كحد أقصى`);
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({ 
        allowsMultipleSelection: false, 
        quality: 0.8,
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
      });
      
      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
        onClose();
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في اختيار الصورة');
    }
  };

  const handleCamera = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { 
        Alert.alert('إذن مطلوب', 'يرجى السماح بالوصول للكاميرا'); 
        return; 
      }
      
      if (currentPhotoCount >= maxPhotos) {
        Alert.alert('الحد الأقصى', `يمكنك تحميل ${maxPhotos} صور كحد أقصى`);
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({ 
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });
      
      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
        onClose();
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في التقاط الصورة');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>اختر مصدر الصورة</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.options}>
            <TouchableOpacity style={styles.option} onPress={handleCameraRoll}>
              <View style={styles.optionIcon}>
                <Ionicons name="images" size={32} color={colors.accent} />
              </View>
              <Text style={styles.optionText}>مكتبة الصور</Text>
              <Text style={styles.optionSubtext}>اختر من الصور المحفوظة</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.option} onPress={handleCamera}>
              <View style={styles.optionIcon}>
                <Ionicons name="camera" size={32} color={colors.accent} />
              </View>
              <Text style={styles.optionText}>الكاميرا</Text>
              <Text style={styles.optionSubtext}>التقاط صورة جديدة</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing(3),
  },
  modal: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    width: '100%',
    maxWidth: 400,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing(2.5),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'right',
  },
  closeButton: {
    padding: spacing(0.5),
  },
  options: {
    padding: spacing(2),
  },
  option: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: spacing(2),
    borderRadius: radii.lg,
    marginBottom: spacing(1),
    backgroundColor: colors.surface,
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing(2),
  },
  optionText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  optionSubtext: {
    color: colors.subtext,
    fontSize: 13,
    textAlign: 'right',
    marginTop: spacing(0.25),
  },
});
