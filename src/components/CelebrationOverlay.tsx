import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions,
  Vibration,
  Easing
} from 'react-native';
import { Audio } from 'expo-av';
import { colors } from '../theme';

const { width, height } = Dimensions.get('window');

interface CelebrationOverlayProps {
  visible: boolean;
  habitName: string;
  streak: number;
  onComplete?: () => void;
}

// 预定义的庆祝语句
const celebrationQuotes = [
  '太棒了！继续保持！',
  '又向目标迈进了一步！',
  '习惯的力量正在积累！',
  '今天的你很棒！',
  '坚持就是胜利！',
  '你正在变成更好的自己！',
  '每一小步都很重要！',
  '优秀已经成为习惯！',
];

// 根据连续天数获取特殊语句
const getSpecialQuote = (streak: number) => {
  if (streak === 1) return '好的开始是成功的一半！';
  if (streak === 7) return '🎉 一周达成！继续保持！';
  if (streak === 21) return '🔥 21天养成习惯！你做到了！';
  if (streak === 30) return '🏆 一个月坚持！太厉害了！';
  if (streak === 100) return '👑 百日成就！你是传奇！';
  if (streak % 10 === 0) return `🎯 ${streak}天里程碑！`;
  return celebrationQuotes[Math.floor(Math.random() * celebrationQuotes.length)];
};

export default function CelebrationOverlay({ 
  visible, 
  habitName, 
  streak,
  onComplete 
}: CelebrationOverlayProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  const particles = useRef(Array(20).fill(0).map(() => ({
    x: new Animated.Value(Math.random() * width),
    y: new Animated.Value(height),
    scale: new Animated.Value(Math.random() * 0.5 + 0.5),
    rotate: new Animated.Value(Math.random() * 360),
  }))).current;

  useEffect(() => {
    if (visible) {
      playCelebration();
    }
  }, [visible]);

  const playCelebration = async () => {
    // 震动反馈（如果支持）
    Vibration.vibrate([0, 100, 50, 100]);

    // 播放音效（使用系统音效或简单提示音）
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/success.mp3'),
        { shouldPlay: true }
      );
      await sound.playAsync();
    } catch (error) {
      // 如果没有音效文件，静默处理
      console.log('音效播放失败:', error);
    }

    // 动画序列
    Animated.parallel([
      // 背景淡入
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // 内容缩放
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      // 内容上移
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // 粒子动画
    particles.forEach((particle, index) => {
      const delay = index * 50;
      Animated.parallel([
        Animated.timing(particle.y, {
          toValue: -100,
          duration: 1500 + Math.random() * 1000,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(particle.x, {
          toValue: Math.random() * width,
          duration: 1500,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(particle.rotate, {
          toValue: Math.random() * 720,
          duration: 1500,
          delay,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // 3秒后自动消失
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onComplete?.();
      });
    }, 3000);
  };

  if (!visible) return null;

  const quote = getSpecialQuote(streak);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* 粒子效果 */}
      {particles.map((particle, index) => (
        <Animated.Text
          key={index}
          style={[
            styles.particle,
            {
              left: particle.x,
              top: particle.y,
              transform: [
                { scale: particle.scale },
                { rotate: particle.rotate.interpolate({
                  inputRange: [0, 360],
                  outputRange: ['0deg', '360deg'],
                }) },
              ],
            },
          ]}
        >
          {['✨', '🌟', '💫', '⭐', '🎯', '🔥'][index % 6]}
        </Animated.Text>
      ))}

      {/* 主要内容 */}
      <Animated.View 
        style={[
          styles.content,
          {
            transform: [
              { scale: scaleAnim },
              { translateY },
            ],
          },
        ]}
      >
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.congratsText}>打卡成功！</Text>
        <Text style={styles.habitName}>{habitName}</Text>
        <View style={styles.streakContainer}>
          <Text style={styles.streakNumber}>{streak}</Text>
          <Text style={styles.streakLabel}>天连续打卡</Text>
        </View>
        <Text style={styles.quote}>{quote}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  particle: {
    position: 'absolute',
    fontSize: 24,
    opacity: 0.8,
  },
  content: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    minWidth: 280,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  congratsText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.success,
    marginBottom: 8,
  },
  habitName: {
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.primary,
  },
  streakLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  quote: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
