import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';

const AVATAR_STORAGE_KEY = '@habit_tracker_avatar';
const NICKNAME_STORAGE_KEY = '@habit_tracker_nickname';
const SIGNATURE_STORAGE_KEY = '@habit_tracker_signature';

const defaultAvatars = ['👤', '😊', '🤠', '🥳', '🤩', '🐱', '🐶', '🐼', '🦊', '🦁'];

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const [nickname, setNickname] = useState('打卡达人');
  const [signature, setSignature] = useState('坚持就是胜利');
  const [avatar, setAvatar] = useState('👤');
  const [customAvatarUri, setCustomAvatarUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const savedNickname = await AsyncStorage.getItem(NICKNAME_STORAGE_KEY);
      const savedSignature = await AsyncStorage.getItem(SIGNATURE_STORAGE_KEY);
      const savedAvatar = await AsyncStorage.getItem(AVATAR_STORAGE_KEY);
      
      if (savedNickname) setNickname(savedNickname);
      if (savedSignature) setSignature(savedSignature);
      if (savedAvatar) {
        if (savedAvatar.startsWith('http') || savedAvatar.startsWith('file')) {
          setCustomAvatarUri(savedAvatar);
        } else {
          setAvatar(savedAvatar);
        }
      }
    } catch (error) {
      console.log('加载个人资料失败', error);
    }
  };

  const pickAvatarImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('权限需要', '需要访问相册权限来选择头像');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setCustomAvatarUri(result.assets[0].uri);
      setAvatar(''); // Clear emoji avatar
    }
  };

  const handleSave = async () => {
    if (!nickname.trim()) {
      Alert.alert('请输入昵称');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await AsyncStorage.setItem(NICKNAME_STORAGE_KEY, nickname.trim());
      await AsyncStorage.setItem(SIGNATURE_STORAGE_KEY, signature.trim());
      
      const avatarToSave = customAvatarUri || avatar;
      await AsyncStorage.setItem(AVATAR_STORAGE_KEY, avatarToSave);

      Alert.alert('保存成功！', '个人资料已更新 🎉', [
        { text: '好的', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('保存失败', '请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>编辑资料</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={pickAvatarImage}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.avatarGradient}
            >
              {customAvatarUri ? (
                <Image source={{ uri: customAvatarUri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarEmoji}>{avatar || '👤'}</Text>
              )}
            </LinearGradient>
            <View style={styles.cameraIcon}>
              <Text style={styles.cameraIconText}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>点击更换头像</Text>
        </View>

        {/* Default Avatars */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>选择默认头像</Text>
          <View style={styles.avatarGrid}>
            {defaultAvatars.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[
                  styles.avatarButton,
                  avatar === emoji && !customAvatarUri && styles.avatarButtonSelected,
                ]}
                onPress={() => {
                  setAvatar(emoji);
                  setCustomAvatarUri(null);
                }}
              >
                <Text style={styles.avatarButtonEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Nickname Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>昵称</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="输入你的昵称"
              placeholderTextColor={colors.textMuted}
              value={nickname}
              onChangeText={setNickname}
              maxLength={20}
            />
            <Text style={styles.charCount}>{nickname.length}/20</Text>
          </View>
        </View>

        {/* Signature Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>个性签名</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="写一句个性签名..."
              placeholderTextColor={colors.textMuted}
              value={signature}
              onChangeText={setSignature}
              multiline
              numberOfLines={3}
              maxLength={50}
              textAlignVertical="top"
            />
          </View>
          <Text style={styles.signatureCount}>{signature.length}/50</Text>
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSave}
          disabled={isSubmitting}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.submitGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? '保存中...' : '✓ 保存资料'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  avatarSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarEmoji: {
    fontSize: 50,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  cameraIconText: {
    fontSize: 16,
  },
  avatarHint: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
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
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  avatarButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  avatarButtonEmoji: {
    fontSize: 28,
  },
  inputContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 80,
    lineHeight: 22,
  },
  charCount: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 8,
  },
  signatureCount: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: 8,
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
