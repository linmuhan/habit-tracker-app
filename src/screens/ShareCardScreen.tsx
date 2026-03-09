import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Share,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import { getHabits, getAllCheckins, getStreak } from '../database';
import { colors } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from '../components/Toast';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - 48;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

const templates = [
  { id: 'minimal', name: '极简白', gradient: ['#FFFFFF', '#F8FAFC'] as [string, string] },
  { id: 'sunset', name: '日落橙', gradient: ['#FF6B6B', '#FFA07A'] as [string, string] },
  { id: 'ocean', name: '海洋蓝', gradient: ['#4A90E2', '#7BB7F0'] as [string, string] },
  { id: 'forest', name: '森林绿', gradient: ['#10B981', '#34D399'] as [string, string] },
  { id: 'purple', name: '梦幻紫', gradient: ['#8B5CF6', '#A78BFA'] as [string, string] },
];

export default function ShareCardScreen() {
  const navigation = useNavigation();
  const viewShotRef = useRef<ViewShot>(null);
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
  const [stats, setStats] = useState({
    totalCheckins: 0,
    totalHabits: 0,
    currentStreak: 0,
    bestStreak: 0,
  });
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const loadStats = () => {
    const habits = getHabits();
    const checkins = getAllCheckins();

    // 计算连续天数
    const uniqueDates = [...new Set(checkins.map(c => c.checkinDate))].sort((a, b) => b - a);
    let currentStreak = 0;
    let bestStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < uniqueDates.length; i++) {
      const checkinDate = new Date(uniqueDates[i]);
      checkinDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === i || (i === 0 && diffDays === 1)) {
        currentStreak++;
      } else {
        break;
      }
    }

    // 计算最佳连续
    let tempStreak = 0;
    let maxStreak = 0;
    for (let i = 0; i < uniqueDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(uniqueDates[i - 1]);
        const currDate = new Date(uniqueDates[i]);
        const diff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
          tempStreak++;
        } else {
          maxStreak = Math.max(maxStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    bestStreak = Math.max(maxStreak, tempStreak);

    setStats({
      totalCheckins: checkins.length,
      totalHabits: habits.length,
      currentStreak,
      bestStreak: bestStreak || currentStreak,
    });
  };

  const captureAndShare = async () => {
    try {
      const uri = await viewShotRef.current?.capture?.();
      if (uri) {
        await Share.share({
          message: `我在打卡日记已坚持${stats.currentStreak}天！一起养成好习惯 💪`,
          url: uri,
          title: '打卡成就',
        });
      }
    } catch (error) {
      showToast('分享失败，请重试', 'error');
    }
  };

  const saveToGallery = async () => {
    try {
      const uri = await viewShotRef.current?.capture?.();
      if (uri) {
        // 在真实设备上可以使用 expo-media-library 保存
        showToast('卡片已生成！', 'success');
      }
    } catch (error) {
      showToast('保存失败', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const isLight = selectedTemplate.id === 'minimal';
  const textColor = isLight ? '#1F2937' : '#FFFFFF';
  const subTextColor = isLight ? '#6B7280' : 'rgba(255,255,255,0.8)';
  const cardBgColor = isLight ? '#FFFFFF' : 'rgba(255,255,255,0.15)';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
        <Text style={styles.headerTitle}>生成分享卡片</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Card Preview */}
        <View style={styles.cardContainer}>
          <ViewShot
            ref={viewShotRef}
            options={{ format: 'png', quality: 1 }}
            style={styles.viewShot}
          >
            <LinearGradient
              colors={selectedTemplate.gradient}
              style={styles.card}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* App Logo */}
              <View style={styles.logoContainer}>
                <Text style={[styles.logoEmoji, { color: textColor }]}>🎯</Text>
                <Text style={[styles.logoText, { color: textColor }]}>打卡日记</Text>
              </View>

              {/* Main Stats */}
              <View style={styles.mainStats}>
                <Text style={[styles.streakNumber, { color: textColor }]}>
                  {stats.currentStreak}
                </Text>
                <Text style={[styles.streakLabel, { color: subTextColor }]}>
                  连续打卡天数
                </Text>
              </View>

              {/* Stats Grid */}
              <View style={[styles.statsGrid, { backgroundColor: cardBgColor }]}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: textColor }]}>
                    {stats.totalCheckins}
                  </Text>
                  <Text style={[styles.statLabel, { color: subTextColor }]}>
                    总打卡
                  </Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: isLight ? '#E5E7EB' : 'rgba(255,255,255,0.2)' }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: textColor }]}>
                    {stats.totalHabits}
                  </Text>
                  <Text style={[styles.statLabel, { color: subTextColor }]}>
                    习惯数
                  </Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: isLight ? '#E5E7EB' : 'rgba(255,255,255,0.2)' }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: textColor }]}>
                    {stats.bestStreak}
                  </Text>
                  <Text style={[styles.statLabel, { color: subTextColor }]}>
                    最佳连续
                  </Text>
                </View>
              </View>

              {/* Quote */}
              <View style={styles.quoteContainer}>
                <Text style={[styles.quoteText, { color: subTextColor }]}>
                  "坚持不是因为看到希望才坚持，
                  而是坚持了才看到希望。"
                </Text>
              </View>

              {/* Footer */}
              <View style={styles.cardFooter}>
                <Text style={[styles.footerText, { color: subTextColor }]}>
                  扫码下载打卡日记，一起养成好习惯
                </Text>
                <View style={[styles.qrPlaceholder, { backgroundColor: isLight ? '#F3F4F6' : 'rgba(255,255,255,0.2)' }]}>
                  <Text style={{ fontSize: 24 }}>📱</Text>
                </View>
              </View>
            </LinearGradient>
          </ViewShot>
        </View>

        {/* Template Selection */}
        <Text style={styles.sectionTitle}>选择模板</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.templateScroll}
          contentContainerStyle={styles.templateContainer}
        >
          {templates.map((template) => (
            <TouchableOpacity
              key={template.id}
              style={[
                styles.templateButton,
                selectedTemplate.id === template.id && styles.templateButtonActive,
              ]}
              onPress={() => setSelectedTemplate(template)}
            >
              <LinearGradient
                colors={template.gradient}
                style={styles.templatePreview}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Text style={[
                styles.templateName,
                selectedTemplate.id === template.id && styles.templateNameActive,
              ]}>
                {template.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.shareButton} onPress={captureAndShare}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.shareGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.shareButtonText}>📤 分享卡片</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButton} onPress={saveToGallery}>
            <Text style={styles.saveButtonText}>💾 保存到相册</Text>
          </TouchableOpacity>
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
  cardContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  viewShot: {
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    padding: 24,
    justifyContent: 'space-between',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
  },
  mainStats: {
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 80,
    fontWeight: '800',
  },
  streakLabel: {
    fontSize: 16,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
  },
  quoteContainer: {
    alignItems: 'center',
  },
  quoteText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  cardFooter: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    marginBottom: 8,
  },
  qrPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  templateScroll: {
    marginBottom: 24,
  },
  templateContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  templateButton: {
    alignItems: 'center',
  },
  templateButtonActive: {
    transform: [{ scale: 1.05 }],
  },
  templatePreview: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  templateName: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  templateNameActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  actionButtons: {
    paddingHorizontal: 16,
    gap: 12,
  },
  shareButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  shareGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  shareButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButtonText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
  spacer: {
    height: 32,
  },
});
