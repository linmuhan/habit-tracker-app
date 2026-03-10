import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { checkin, getStreak } from '../database';
import { colors } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
import CustomDialog from '../components/CustomDialog';
import LifeTree from '../components/LifeTree';
import CelebrationOverlay from '../components/CelebrationOverlay';

export default function CheckinScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { habit } = route.params as any;

  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [location, setLocation] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [useLocation, setUseLocation] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '',
    type: 'default' as 'default' | 'danger',
    onConfirm: () => {},
  });
  const [streak, setStreak] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    // 加载当前连续天数
    const currentStreak = getStreak(habit.id);
    setStreak(currentStreak);
  }, [habit.id]);

  const toggleLocation = async () => {
    if (!useLocation) {
      // 开启定位
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showDialog('权限被拒绝', '无法获取位置权限，打卡将不记录位置');
        return;
      }
      setUseLocation(true);
      getCurrentLocation();
    } else {
      // 关闭定位
      setUseLocation(false);
      setLocation(null);
      setLocationError(false);
    }
  };

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    setLocationError(false);
    try {
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        
        if (address) {
          const locationStr = [
            address.city,
            address.district,
            address.street,
          ].filter(Boolean).join(' ') || `${coords.latitude.toFixed(2)}, ${coords.longitude.toFixed(2)}`;
          setLocation(locationStr);
        } else {
          setLocation(`${coords.latitude.toFixed(2)}, ${coords.longitude.toFixed(2)}`);
        }
      } catch (error) {
        setLocation(`${coords.latitude.toFixed(2)}, ${coords.longitude.toFixed(2)}`);
      }
    } catch (error) {
      console.log('获取位置失败', error);
      setLocationError(true);
      setLocation(null);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showDialog('权限需要', '需要访问相册权限来选择图片');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled) {
      const newPhotos = result.assets.map((asset) => asset.uri);
      setPhotos([...photos, ...newPhotos].slice(0, 5));
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showDialog('权限需要', '需要相机权限来拍照');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled) {
      setPhotos([...photos, result.assets[0].uri].slice(0, 5));
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const showDialog = (title: string, message: string, onConfirm?: () => void, type: 'default' | 'danger' = 'default') => {
    setDialogConfig({
      title,
      message,
      type,
      onConfirm: onConfirm || (() => setDialogVisible(false)),
    });
    setDialogVisible(true);
  };

  const handleCheckin = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const checkinId = checkin({
        habitId: habit.id,
        note: note.trim() || undefined,
        photos: photos.length > 0 ? photos : undefined,
        location: location || undefined,
      });

      if (checkinId === -1) {
        showDialog('打卡失败', '数据库操作失败，请重试');
        setIsSubmitting(false);
        return;
      }

      // 打卡成功，更新连续天数并显示庆祝动画
      const newStreak = streak + 1;
      setStreak(newStreak);
      setShowCelebration(true);
    } catch (error) {
      console.error('Checkin error:', error);
      showDialog('打卡失败', error instanceof Error ? error.message : '请重试');
      setIsSubmitting(false);
    }
  };

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
    setIsSubmitting(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomDialog
        visible={dialogVisible}
        title={dialogConfig.title}
        message={dialogConfig.message}
        onConfirm={dialogConfig.onConfirm}
        onCancel={() => setDialogVisible(false)}
        showCancel={false}
        type={dialogConfig.type}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>打卡</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Habit Card */}
          <View style={styles.habitCard}>
            <LinearGradient
              colors={[habit.color, habit.color + 'DD']}
              style={styles.habitGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.habitIcon}>{habit.icon}</Text>
              <Text style={styles.habitName}>{habit.name}</Text>
              <Text style={styles.habitTime}>
                {new Date().toLocaleDateString('zh-CN', {
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                })}
              </Text>
            </LinearGradient>
          </View>

          {/* Life Tree - 生命树成长 */}
          <View style={styles.lifeTreeSection}>
            <Text style={styles.sectionTitle}>🌱 习惯成长</Text>
            <View style={styles.lifeTreeContainer}>
              <LifeTree streak={streak} size={140} />
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <View style={styles.locationHeader}>
              <Text style={styles.sectionTitle}>📍 打卡位置</Text>
              <TouchableOpacity
                style={[styles.toggleButton, useLocation && styles.toggleButtonActive]}
                onPress={toggleLocation}
              >
                <View style={[styles.toggleCircle, useLocation && styles.toggleCircleActive]} />
              </TouchableOpacity>
            </View>
            {useLocation && (
              <View style={styles.locationContainer}>
                <View style={styles.locationIcon}>
                  <Text style={styles.locationIconText}>📍</Text>
                </View>
                <View style={styles.locationContent}>
                  <Text style={[styles.locationText, locationError && styles.locationErrorText]} numberOfLines={1}>
                    {isGettingLocation ? '正在获取位置...' : 
                     locationError ? '获取位置失败，可点击重试' : 
                     location || '未能获取位置'}
                  </Text>
                </View>
                <TouchableOpacity style={styles.refreshButton} onPress={getCurrentLocation}>
                  <Text style={styles.refreshButtonText}>↻</Text>
                </TouchableOpacity>
              </View>
            )}
            {!useLocation && (
              <Text style={styles.locationHint}>开启后将记录打卡位置</Text>
            )}
          </View>

          {/* Note Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 记录一下</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="今天的感觉如何？写点什么..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                value={note}
                onChangeText={setNote}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Photos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📸 添加照片 ({photos.length}/5)</Text>
            
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.photosScroll}
            >
              {/* Add Photo Buttons */}
              <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
                <Text style={styles.addPhotoIcon}>🖼️</Text>
                <Text style={styles.addPhotoText}>相册</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.addPhotoButton} onPress={takePhoto}>
                <Text style={styles.addPhotoIcon}>📷</Text>
                <Text style={styles.addPhotoText}>拍照</Text>
              </TouchableOpacity>

              {/* Photo Previews */}
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoContainer}>
                  <Image source={{ uri: photo }} style={styles.photoPreview} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removePhoto(index)}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Spacer */}
          <View style={styles.spacer} />
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleCheckin}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.submitGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? '打卡中...' : '✓ 确认打卡'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Celebration Overlay - 仪式感庆祝动画 */}
      <CelebrationOverlay
        visible={showCelebration}
        habitName={habit.name}
        streak={streak + 1}
        onComplete={handleCelebrationComplete}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: colors.text,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  habitCard: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  habitGradient: {
    padding: 24,
    alignItems: 'center',
  },
  habitIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  habitName: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  habitTime: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  lifeTreeSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  lifeTreeContainer: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleButton: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    padding: 2,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    transform: [{ translateX: 0 }],
  },
  toggleCircleActive: {
    transform: [{ translateX: 22 }],
  },
  locationHint: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  locationErrorText: {
    color: colors.error,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationIconText: {
    fontSize: 18,
  },
  locationContent: {
    flex: 1,
    marginLeft: 12,
  },
  locationText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonText: {
    fontSize: 18,
    color: colors.primary,
  },
  inputContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textInput: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    minHeight: 100,
  },
  photosScroll: {
    flexDirection: 'row',
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    backgroundColor: colors.surface,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  addPhotoIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  addPhotoText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  photoContainer: {
    width: 80,
    height: 80,
    marginRight: 12,
    position: 'relative',
  },
  photoPreview: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  spacer: {
    height: 100,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
});
