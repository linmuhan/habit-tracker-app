import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getHabits, getChallenges, createChallenge, deleteChallenge, getCheckinsByHabit } from '../database';
import { colors } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
import CustomDialog from '../components/CustomDialog';
import Toast from '../components/Toast';

const { width } = Dimensions.get('window');

const PRESET_DURATIONS = [
  { days: 7, name: '7天', desc: '新手挑战', emoji: '🌱' },
  { days: 21, name: '21天', desc: '习惯养成', emoji: '🌿' },
  { days: 60, name: '60天', desc: '进阶挑战', emoji: '🌲' },
  { days: 100, name: '100天', desc: '大师挑战', emoji: '👑' },
];

export default function ChallengeScreen() {
  const navigation = useNavigation();
  const [habits, setHabits] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<any>(null);
  const [selectedDuration, setSelectedDuration] = useState(PRESET_DURATIONS[1]);
  const [customDays, setCustomDays] = useState('');
  const [isCustom, setIsCustom] = useState(false);
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

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = () => {
    setHabits(getHabits());
    const challengesData = getChallenges();

    // 计算每个挑战的实际完成天数
    const challengesWithProgress = challengesData.map((challenge) => {
      const checkins = getCheckinsByHabit(challenge.habitId);
      const startDate = new Date(challenge.startDate);
      startDate.setHours(0, 0, 0, 0);

      // 计算从挑战开始到今天的打卡天数
      const completedDays = checkins.filter((checkin: any) => {
        const checkinDate = new Date(checkin.checkinDate);
        checkinDate.setHours(0, 0, 0, 0);
        return checkinDate >= startDate;
      }).length;

      return { ...challenge, completedDays };
    });

    setChallenges(challengesWithProgress);
  };

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

  const handleCreateChallenge = () => {
    if (!selectedHabit) {
      showToast('请选择一个习惯', 'warning');
      return;
    }

    const targetDays = isCustom ? parseInt(customDays) : selectedDuration.days;
    if (isCustom && (!targetDays || targetDays < 1)) {
      showToast('请输入有效的天数', 'warning');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    createChallenge({
      habitId: selectedHabit.id,
      title: `${selectedHabit.name} ${targetDays}天挑战`,
      description: `坚持${targetDays}天完成${selectedHabit.name}`,
      targetDays,
      startDate: today.getTime(),
    });

    setShowCreateModal(false);
    setSelectedHabit(null);
    setCustomDays('');
    setIsCustom(false);
    loadData();
    showToast('挑战创建成功！加油 💪', 'success');
  };

  const handleDelete = (challenge: any) => {
    showDialog(
      '放弃挑战',
      `确定要放弃「${challenge.title}」挑战吗？`,
      () => {
        deleteChallenge(challenge.id);
        loadData();
        setDialogVisible(false);
        showToast('已放弃挑战', 'info');
      },
      'danger'
    );
  };

  const getProgressPercentage = (completed: number, target: number) => {
    return Math.min((completed / target) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return ['#10B981', '#34D399'];
    if (percentage >= 50) return ['#F59E0B', '#FBBF24'];
    return ['#4A90E2', '#7BB7F0'];
  };

  const getMotivationalQuote = (percentage: number) => {
    if (percentage >= 100) return '太棒了！你完成了挑战！🎉';
    if (percentage >= 75) return '冲刺阶段，坚持就是胜利！🔥';
    if (percentage >= 50) return '已经完成一半了，继续加油！💪';
    if (percentage >= 25) return '良好的开始，保持节奏！🌟';
    return '刚刚开始，你一定可以的！🌱';
  };

  if (showCreateModal) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Toast visible={toastVisible} message={toastMessage} type={toastType} onClose={() => setToastVisible(false)} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowCreateModal(false)} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>创建挑战</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Step 1: Select Habit */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. 选择习惯</Text>
            {habits.length === 0 ? (
              <View style={styles.emptyHabits}>
                <Text style={styles.emptyText}>还没有习惯，先去创建一个吧</Text>
              </View>
            ) : (
              <View style={styles.habitsGrid}>
                {habits.map((habit) => (
                  <TouchableOpacity
                    key={habit.id}
                    style={[
                      styles.habitButton,
                      selectedHabit?.id === habit.id && styles.habitButtonSelected,
                    ]}
                    onPress={() => setSelectedHabit(habit)}
                  >
                    <LinearGradient
                      colors={[habit.color, habit.color + 'DD']}
                      style={styles.habitIconBg}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.habitIcon}>{habit.icon}</Text>
                    </LinearGradient>
                    <Text style={styles.habitName}>{habit.name}</Text>
                    {selectedHabit?.id === habit.id && (
                      <View style={styles.checkMark}>
                        <Text style={styles.checkMarkText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Step 2: Select Duration */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. 选择挑战天数</Text>
            <View style={styles.durationGrid}>
              {PRESET_DURATIONS.map((duration) => (
                <TouchableOpacity
                  key={duration.days}
                  style={[
                    styles.durationCard,
                    !isCustom && selectedDuration.days === duration.days && styles.durationCardSelected,
                  ]}
                  onPress={() => {
                    setSelectedDuration(duration);
                    setIsCustom(false);
                  }}
                >
                  <Text style={styles.durationEmoji}>{duration.emoji}</Text>
                  <Text style={styles.durationName}>{duration.name}</Text>
                  <Text style={styles.durationDesc}>{duration.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Duration */}
            <TouchableOpacity
              style={[styles.customDuration, isCustom && styles.customDurationSelected]}
              onPress={() => setIsCustom(true)}
            >
              <Text style={styles.customDurationLabel}>自定义天数</Text>
              <View style={styles.customInputContainer}>
                <TextInput
                  style={styles.customInput}
                  placeholder="输入天数"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  value={customDays}
                  onChangeText={setCustomDays}
                  onFocus={() => setIsCustom(true)}
                  maxLength={3}
                />
                <Text style={styles.customUnit}>天</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Create Button */}
          <View style={styles.createButtonContainer}>
            <TouchableOpacity
              style={[styles.createButton, !selectedHabit && styles.createButtonDisabled]}
              onPress={handleCreateChallenge}
              disabled={!selectedHabit}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.createGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.createButtonText}>
                  {isCustom && customDays ? `开启 ${customDays} 天挑战` : `开启 ${selectedDuration.name}挑战`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.spacer} />
        </ScrollView>
      </SafeAreaView>
    );
  }

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
      <Toast visible={toastVisible} message={toastMessage} type={toastType} onClose={() => setToastVisible(false)} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>习惯挑战</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Active Challenges */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>进行中的挑战</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setShowCreateModal(true)}>
              <Text style={styles.addButtonText}>+ 新建</Text>
            </TouchableOpacity>
          </View>

          {challenges.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🎯</Text>
              <Text style={styles.emptyTitle}>还没有挑战</Text>
              <Text style={styles.emptySubtitle}>创建挑战，让习惯养成更有趣！</Text>
              <TouchableOpacity style={styles.startButton} onPress={() => setShowCreateModal(true)}>
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  style={styles.startGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.startButtonText}>创建第一个挑战</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.challengesList}>
              {challenges.map((challenge) => {
                const progress = getProgressPercentage(challenge.completedDays, challenge.targetDays);
                const progressColors = getProgressColor(progress);

                return (
                  <View key={challenge.id} style={styles.challengeCard}>
                    {/* Challenge Header */}
                    <View style={styles.challengeHeader}>
                      <View style={[styles.habitIconSmall, { backgroundColor: challenge.habitColor }]}>
                        <Text style={styles.habitIconText}>{challenge.habitIcon}</Text>
                      </View>
                      <View style={styles.challengeInfo}>
                        <Text style={styles.challengeTitle}>{challenge.title}</Text>
                        <Text style={styles.challengeDesc}>{challenge.description}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.giveUpButton}
                        onPress={() => handleDelete(challenge)}
                      >
                        <Text style={styles.giveUpText}>放弃</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Progress Section */}
                    <View style={styles.progressSection}>
                      <View style={styles.progressHeader}>
                        <Text style={styles.progressText}>
                          已完成 <Text style={styles.progressHighlight}>{challenge.completedDays}</Text> / {challenge.targetDays} 天
                        </Text>
                        <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
                      </View>

                      {/* Progress Bar */}
                      <View style={styles.progressBarBg}>
                        <LinearGradient
                          colors={progressColors as [string, string]}
                          style={[styles.progressBar, { width: `${progress}%` }]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        />
                      </View>

                      {/* Days Grid */}
                      <View style={styles.daysGrid}>
                        {Array.from({ length: Math.min(challenge.targetDays, 14) }).map((_, idx) => {
                          const isCompleted = idx < challenge.completedDays;
                          return (
                            <View
                              key={idx}
                              style={[
                                styles.dayDot,
                                isCompleted && { backgroundColor: challenge.habitColor },
                              ]}
                            >
                              {isCompleted && <Text style={styles.dayDotCheck}>✓</Text>}
                            </View>
                          );
                        })}
                        {challenge.targetDays > 14 && (
                          <Text style={styles.moreDays}>+{challenge.targetDays - 14}</Text>
                        )}
                      </View>
                    </View>

                    {/* Motivational Quote */}
                    <View style={styles.quoteBox}>
                      <Text style={styles.quoteText}>{getMotivationalQuote(progress)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsEmoji}>💡</Text>
          <Text style={styles.tipsTitle}>挑战小贴士</Text>
          <Text style={styles.tipsText}>
            • 21天是养成习惯的关键期{'\n'}
            • 完成100天挑战可获得大师称号{'\n'}
            • 中途断签不影响继续挑战
          </Text>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
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
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginTop: 8,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  startButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  startGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  challengesList: {
    gap: 16,
  },
  challengeCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  habitIconSmall: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitIconText: {
    fontSize: 22,
  },
  challengeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  challengeTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  challengeDesc: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  giveUpButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.error + '15',
  },
  giveUpText: {
    fontSize: 13,
    color: colors.error,
    fontWeight: '500',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  progressHighlight: {
    color: colors.primary,
    fontWeight: '700',
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayDotCheck: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  moreDays: {
    fontSize: 12,
    color: colors.textMuted,
    alignSelf: 'center',
  },
  quoteBox: {
    backgroundColor: colors.primary + '08',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  quoteText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  tipsCard: {
    marginHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  tipsEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  spacer: {
    height: 32,
  },
  // Create Modal Styles
  habitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  habitButton: {
    width: (width - 56) / 3,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  habitButtonSelected: {
    borderColor: colors.primary,
  },
  habitIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  habitIcon: {
    fontSize: 24,
  },
  habitName: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  checkMark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMarkText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyHabits: {
    padding: 24,
    backgroundColor: colors.surface,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  durationCard: {
    width: (width - 56) / 2,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  durationCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  durationEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  durationName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  durationDesc: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  customDuration: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  customDurationSelected: {
    borderColor: colors.primary,
  },
  customDurationLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    padding: 0,
  },
  customUnit: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  createButtonContainer: {
    paddingHorizontal: 16,
    marginTop: 32,
  },
  createButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
});
