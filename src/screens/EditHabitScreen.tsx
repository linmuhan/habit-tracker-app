import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { updateHabit } from '../database';
import { colors, icons, gradients } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';

const frequencies = [
  { key: 'daily', label: '每天', icon: '📅' },
  { key: 'weekdays', label: '工作日', icon: '💼' },
  { key: 'weekends', label: '周末', icon: '🏖️' },
  { key: 'weekly', label: '每周', icon: '📆' },
];

export default function EditHabitScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { habit } = route.params as any;

  const [name, setName] = useState(habit.name);
  const [selectedIcon, setSelectedIcon] = useState(habit.icon);
  const [selectedGradient, setSelectedGradient] = useState<[string, string]>(
    gradients.find(g => g[0] === habit.color) || gradients[0]
  );
  const [selectedFrequency, setSelectedFrequency] = useState(habit.frequency);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('请输入习惯名称');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      updateHabit(habit.id, {
        name: name.trim(),
        icon: selectedIcon,
        color: selectedGradient[0],
        frequency: selectedFrequency,
      });

      Alert.alert('修改成功！', '习惯已更新 🎉', [
        { text: '好的', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('修改失败', '请重试');
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
        <Text style={styles.headerTitle}>编辑习惯</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Preview */}
        <View style={styles.previewSection}>
          <Text style={styles.previewLabel}>预览</Text>
          <View style={styles.previewCard}>
            <LinearGradient
              colors={selectedGradient}
              style={styles.previewGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.previewIcon}>{selectedIcon}</Text>
              <Text style={styles.previewName}>
                {name || '习惯名称'}
              </Text>
              <Text style={styles.previewFrequency}>
                {frequencies.find(f => f.key === selectedFrequency)?.label}
              </Text>
            </LinearGradient>
          </View>
        </View>

        {/* Name Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>习惯名称</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="例如：早起、阅读、运动..."
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              maxLength={20}
            />
            <Text style={styles.charCount}>{name.length}/20</Text>
          </View>
        </View>

        {/* Icon Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>选择图标</Text>
          <View style={styles.iconGrid}>
            {icons.map((icon) => (
              <TouchableOpacity
                key={icon}
                style={[
                  styles.iconButton,
                  selectedIcon === icon && styles.iconButtonSelected,
                ]}
                onPress={() => setSelectedIcon(icon)}
              >
                <Text style={styles.iconEmoji}>{icon}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Color Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>选择颜色</Text>
          <View style={styles.colorGrid}>
            {gradients.map((gradient, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.colorButton,
                  selectedGradient === gradient && styles.colorButtonSelected,
                ]}
                onPress={() => setSelectedGradient(gradient)}
              >
                <LinearGradient
                  colors={gradient}
                  style={styles.colorGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                {selectedGradient === gradient && (
                  <View style={styles.colorCheck}>
                    <Text style={styles.colorCheckText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Frequency Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>打卡频率</Text>
          <View style={styles.frequencyList}>
            {frequencies.map((freq) => (
              <TouchableOpacity
                key={freq.key}
                style={[
                  styles.frequencyButton,
                  selectedFrequency === freq.key && styles.frequencyButtonSelected,
                ]}
                onPress={() => setSelectedFrequency(freq.key)}
              >
                <Text style={styles.frequencyIcon}>{freq.icon}</Text>
                <Text style={[
                  styles.frequencyLabel,
                  selectedFrequency === freq.key && styles.frequencyLabelSelected,
                ]}>
                  {freq.label}
                </Text>
                {selectedFrequency === freq.key && (
                  <View style={styles.frequencyCheck}>
                    <Text style={styles.frequencyCheckText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.submitGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? '保存中...' : '✓ 保存修改'}
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
  previewSection: {
    marginBottom: 24,
  },
  previewLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  previewCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  previewGradient: {
    padding: 32,
    alignItems: 'center',
  },
  previewIcon: {
    fontSize: 56,
    marginBottom: 12,
  },
  previewName: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  previewFrequency: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
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
  charCount: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 8,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconButton: {
    width: 52,
    height: 52,
    backgroundColor: colors.surface,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  iconEmoji: {
    fontSize: 24,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorButtonSelected: {
    borderColor: colors.text,
  },
  colorGradient: {
    flex: 1,
    borderRadius: 21,
  },
  colorCheck: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 24,
  },
  colorCheckText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  frequencyList: {
    gap: 8,
  },
  frequencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  frequencyButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  frequencyIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  frequencyLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  frequencyLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  frequencyCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frequencyCheckText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
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
