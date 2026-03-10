import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../theme';

interface LifeTreeProps {
  streak: number; // 连续打卡天数
  size?: number;
}

// 根据连续天数获取树的阶段
const getTreeStage = (streak: number) => {
  if (streak >= 100) return { emoji: '🌳', label: '参天大树', stage: 5 };
  if (streak >= 30) return { emoji: '🌲', label: '茁壮成长', stage: 4 };
  if (streak >= 14) return { emoji: '🌴', label: '枝繁叶茂', stage: 3 };
  if (streak >= 7) return { emoji: '🌿', label: '生机勃勃', stage: 2 };
  if (streak >= 3) return { emoji: '🌱', label: '破土而出', stage: 1 };
  return { emoji: '🌰', label: '种子阶段', stage: 0 };
};

// 获取成长进度
const getGrowthProgress = (streak: number) => {
  if (streak >= 100) return 100;
  if (streak >= 30) return 80 + ((streak - 30) / 70) * 20;
  if (streak >= 14) return 60 + ((streak - 14) / 16) * 20;
  if (streak >= 7) return 40 + ((streak - 7) / 7) * 20;
  if (streak >= 3) return 20 + ((streak - 3) / 4) * 20;
  return (streak / 3) * 20;
};

export default function LifeTree({ streak, size = 120 }: LifeTreeProps) {
  const stage = getTreeStage(streak);
  const progress = getGrowthProgress(streak);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    // 生长动画
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [streak]);

  return (
    <View style={[styles.container, { width: size, height: size + 40 }]}>
      {/* 地面 */}
      <View style={styles.ground} />
      
      {/* 树 */}
      <Animated.View style={[styles.treeContainer, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={[styles.treeEmoji, { fontSize: size * 0.6 }]}>
          {stage.emoji}
        </Text>
      </Animated.View>

      {/* 阶段标签 */}
      <View style={styles.labelContainer}>
        <Text style={styles.stageLabel}>{stage.label}</Text>
        <Text style={styles.streakText}>连续 {streak} 天</Text>
      </View>

      {/* 进度条 */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      {/* 成长提示 */}
      {streak < 100 && (
        <Text style={styles.hint}>
          再坚持 {stage.stage === 0 ? 3 - streak : stage.stage === 1 ? 7 - streak : stage.stage === 2 ? 14 - streak : stage.stage === 3 ? 30 - streak : 100 - streak} 天进入下一阶段
        </Text>
      )}
      {streak >= 100 && (
        <Text style={styles.congrats}>🎉 已达到最高阶段！</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 10,
  },
  ground: {
    position: 'absolute',
    bottom: 40,
    width: '80%',
    height: 8,
    backgroundColor: '#8B7355',
    borderRadius: 4,
  },
  treeContainer: {
    marginBottom: 8,
  },
  treeEmoji: {
    textAlign: 'center',
  },
  labelContainer: {
    alignItems: 'center',
  },
  stageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
  },
  streakText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressContainer: {
    width: '80%',
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 2,
  },
  hint: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
  },
  congrats: {
    fontSize: 10,
    color: colors.success,
    marginTop: 6,
    fontWeight: '600',
  },
});
