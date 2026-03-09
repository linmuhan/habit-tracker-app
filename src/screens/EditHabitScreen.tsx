import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import CustomDialog from '../components/CustomDialog';
import Toast from '../components/Toast';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { updateHabit, parseFrequency, FrequencyConfig, FrequencyType, getFrequencyLabel } from '../database';
import { colors, icons, gradients } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';

const frequencyOptions = [
  { type: 'daily', label: '每天', icon: '📅', desc: '每天都打卡' },
  { type: 'weekdays', label: '工作日', icon: '💼', desc: '周一到周五' },
  { type: 'weekends', label: '周末', icon: '🏖️', desc: '周六和周日' },
  { type: 'weekly', label: '每周', icon: '📆', desc: '选择每周哪几天' },
  { type: 'monthly', label: '每月', icon: '🗓️', desc: '选择每月哪几天' },
];

const weekDays = [
  { key: 1, label: '一', short: '周一' },
  { key: 2, label: '二', short: '周二' },
  { key: 3, label: '三', short: '周三' },
  { key: 4, label: '四', short: '周四' },
  { key: 5, label: '五', short: '周五' },
  { key: 6, label: '六', short: '周六' },
  { key: 0, label: '日', short: '周日' },
];

export default function EditHabitScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { habit } = route.params as any;

  // Parse existing frequency
  const existingFreq = parseFrequency(habit.frequency);

  const [name, setName] = useState(habit.name);
  const [selectedIcon, setSelectedIcon] = useState(habit.icon);
  const [selectedGradient, setSelectedGradient] = useState<[string, string]>(
    gradients.find(g => g[0] === habit.color) || gradients[0]
  );
  const [selectedFreqType, setSelectedFreqType] = useState<string>(existingFreq.type);
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>(existingFreq.days || [1, 2, 3, 4, 5]);
  const [selectedMonthDays, setSelectedMonthDays] = useState<number[]>(existingFreq.days || [1]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '',
    type: 'default' as 'default' | 'danger',
    onConfirm: () => {},
  });
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  const showDialog = (title: string, message: string, onConfirm: () => void, type: 'default' | 'danger' = 'default') => {
    setDialogConfig({
      title,
      message,
      type,
      onConfirm,
    });
    setDialogVisible(true);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const toggleWeekDay = (day: number) => {
    if (selectedWeekDays.includes(day)) {
      setSelectedWeekDays(selectedWeekDays.filter(d => d !== day));
    } else {
      setSelectedWeekDays([...selectedWeekDays, day].sort());
    }
  };

  const toggleMonthDay = (day: number) => {
    if (selectedMonthDays.includes(day)) {
      if (selectedMonthDays.length > 1) {
        setSelectedMonthDays(selectedMonthDays.filter(d => d !== day));
      }
    } else {
      if (selectedMonthDays.length < 5) {
        setSelectedMonthDays([...selectedMonthDays, day].sort((a, b) => a - b));
      } else {
        showToast('最多选择5天', 'warning');
      }
    }
  };

  const getFrequencyLabel = () => {
    const option = frequencyOptions.find(f => f.type === selectedFreqType);
    if (selectedFreqType === 'weekly' && selectedWeekDays.length > 0) {
      const days = selectedWeekDays.map(d => weekDays.find(w => w.key === d)?.label).join('、');
      return `每周 ${days}`;
    }
    if (selectedFreqType === 'monthly' && selectedMonthDays.length > 0) {
      return `每月 ${selectedMonthDays.join('、')} 号`;
    }
    return option?.label || '每天';
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast('请输入习惯名称', 'warning');
      return;
    }

    if (selectedFreqType === 'weekly' && selectedWeekDays.length === 0) {
      showToast('请至少选择一天', 'warning');
      return;
    }

    if (selectedFreqType === 'monthly' && selectedMonthDays.length === 0) {
      showToast('请至少选择一天', 'warning');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const freqConfig: FrequencyConfig = {
        type: selectedFreqType as FrequencyType,
      };
      if (selectedFreqType === 'weekly') {
        freqConfig.days = selectedWeekDays;
      }
      if (selectedFreqType === 'monthly') {
        freqConfig.days = selectedMonthDays;
      }

      updateHabit(habit.id, {
        name: name.trim(),
        icon: selectedIcon,
        color: selectedGradient[0],
        frequency: JSON.stringify(freqConfig),
      });

      showToast('习惯已更新 🎉', 'success');
      setTimeout(() => navigation.goBack(), 1500);
    } catch (error) {
      showToast('修改失败，请重试', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomDialog
        visible={dialogVisible}
        title={dialogConfig.title}
        message={dialogConfig.message}
        onConfirm={dialogConfig.onConfirm}
        onCancel={() => setDialogVisible(false)}
        type={dialogConfig.type}
      />
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onClose={() => setToastVisible(false)}
      />
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
                {getFrequencyLabel()}
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
            {frequencyOptions.map((freq) => (
              <TouchableOpacity
                key={freq.type}
                style={[
                  styles.frequencyButton,
                  selectedFreqType === freq.type && styles.frequencyButtonSelected,
                ]}
                onPress={() => setSelectedFreqType(freq.type)}
              >
                <Text style={styles.frequencyIcon}>{freq.icon}</Text>
                <View style={styles.frequencyContent}>
                  <Text style={[
                    styles.frequencyLabel,
                    selectedFreqType === freq.type && styles.frequencyLabelSelected,
                  ]}>
                    {freq.label}
                  </Text>
                  <Text style={styles.frequencyDesc}>{freq.desc}</Text>
                </View>
                {selectedFreqType === freq.type && (
                  <View style={styles.frequencyCheck}>
                    <Text style={styles.frequencyCheckText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Weekly Day Selector */}
          {selectedFreqType === 'weekly' && (
            <View style={styles.daySelector}>
              <Text style={styles.daySelectorTitle}>选择每周打卡日</Text>
              <View style={styles.weekDayGrid}>
                {weekDays.map((day) => (
                  <TouchableOpacity
                    key={day.key}
                    style={[
                      styles.weekDayButton,
                      selectedWeekDays.includes(day.key) && styles.weekDayButtonSelected,
                    ]}
                    onPress={() => toggleWeekDay(day.key)}
                  >
                    <Text style={[
                      styles.weekDayText,
                      selectedWeekDays.includes(day.key) && styles.weekDayTextSelected,
                    ]}>
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {selectedWeekDays.length > 0 && (
                <Text style={styles.selectedDaysText}>
                  已选择：{selectedWeekDays.map(d => weekDays.find(w => w.key === d)?.short).join('、')}
                </Text>
              )}
            </View>
          )}

          {/* Monthly Day Selector */}
          {selectedFreqType === 'monthly' && (
            <View style={styles.daySelector}>
              <Text style={styles.daySelectorTitle}>选择每月打卡日（最多5天）</Text>
              <View style={styles.monthDayGrid}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.monthDayButton,
                      selectedMonthDays.includes(day) && styles.monthDayButtonSelected,
                    ]}
                    onPress={() => toggleMonthDay(day)}
                  >
                    <Text style={[
                      styles.monthDayText,
                      selectedMonthDays.includes(day) && styles.monthDayTextSelected,
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {selectedMonthDays.length > 0 && (
                <Text style={styles.selectedDaysText}>
                  已选择：{selectedMonthDays.join('、')} 号
                </Text>
              )}
            </View>
          )}
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
  frequencyContent: {
    flex: 1,
  },
  frequencyDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  daySelector: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  daySelectorTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  weekDayGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  weekDayButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  weekDayText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  weekDayTextSelected: {
    color: 'white',
  },
  monthDayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  monthDayButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  monthDayButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  monthDayText: {
    fontSize: 14,
    color: colors.text,
  },
  monthDayTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  selectedDaysText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 12,
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
