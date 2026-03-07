import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getHabits, getAllCheckins } from '../database';
import { colors } from '../theme';

export default function StatsScreen() {
  const [habits, setHabits] = useState<any[]>([]);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = () => {
    setHabits(getHabits());
    setCheckins(getAllCheckins());
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  };

  // 计算统计数据
  const totalCheckins = checkins.length;
  const totalHabits = habits.length;
  
  // 本周打卡数
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const thisWeekCheckins = checkins.filter(c => new Date(c.checkinDate) >= weekStart).length;

  // 本月打卡数
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthCheckins = checkins.filter(c => new Date(c.checkinDate) >= monthStart).length;

  // 连续打卡天数
  const uniqueDates = [...new Set(checkins.map(c => c.checkinDate))].sort((a, b) => b - a);
  let currentStreak = 0;
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

  // 最爱打卡的习惯
  const habitCounts = {};
  checkins.forEach(c => {
    habitCounts[c.habitId] = (habitCounts[c.habitId] || 0) + 1;
  });
  const favoriteHabit = habits.reduce((max, h) => 
    (habitCounts[h.id] || 0) > (habitCounts[max?.id] || 0) ? h : max
  , habits[0]);

  // 最近7天打卡趋势
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const count = checkins.filter(c => new Date(c.checkinDate).getTime() === date.getTime()).length;
    last7Days.push({
      date: date,
      count,
      label: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
    });
  }

  const maxCount = Math.max(...last7Days.map(d => d.count), 1);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>统计</Text>
        <Text style={styles.subtitle}>记录你的成长轨迹</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{totalCheckins}</Text>
            <Text style={styles.summaryLabel}>总打卡</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{totalHabits}</Text>
            <Text style={styles.summaryLabel}>习惯数</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>{currentStreak}</Text>
            <Text style={styles.summaryLabel}>连续天数</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{thisWeekCheckins}</Text>
            <Text style={styles.summaryLabel}>本周打卡</Text>
          </View>
        </View>

        {/* Weekly Trend */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>近7天打卡趋势</Text>
          <View style={styles.trendCard}>
            <View style={styles.trendBars}>
              {last7Days.map((day, index) => (
                <View key={index} style={styles.trendBarContainer}>
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.trendBar,
                        {
                          height: `${(day.count / maxCount) * 100}%`,
                          backgroundColor: day.count > 0 ? colors.primary : colors.border,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[
                    styles.trendLabel,
                    day.date.getTime() === today.getTime() && styles.trendLabelToday
                  ]}>
                    {day.label}
                  </Text>
                  <Text style={styles.trendCount}>{day.count}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Monthly Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>本月概览</Text>
          <View style={styles.monthCard}>
            <View style={styles.monthStat}>
              <Text style={styles.monthValue}>{thisMonthCheckins}</Text>
              <Text style={styles.monthLabel}>本月打卡次数</Text>
            </View>
            <View style={styles.monthDivider} />
            <View style={styles.monthStat}>
              <Text style={styles.monthValue}>
                {checkins.length > 0 ? Math.round(thisMonthCheckins / checkins.length * 100) : 0}%
              </Text>
              <Text style={styles.monthLabel}>占总数比例</Text>
            </View>
          </View>
        </View>

        {/* Favorite Habit */}
        {favoriteHabit && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>最爱打卡</Text>
            <View style={styles.favoriteCard}>
              <View style={[styles.favoriteIconBg, { backgroundColor: favoriteHabit.color }]}>
                <Text style={styles.favoriteIcon}>{favoriteHabit.icon}</Text>
              </View>
              <View style={styles.favoriteInfo}>
                <Text style={styles.favoriteName}>{favoriteHabit.name}</Text>
                <Text style={styles.favoriteCount}>
                  已打卡 {habitCounts[favoriteHabit.id] || 0} 次
                </Text>
              </View>
              <Text style={styles.favoriteBadge}>🏆</Text>
            </View>
          </View>
        )}

        {/* Motivation */}
        <View style={styles.motivationCard}>
          <Text style={styles.motivationIcon}>🌟</Text>
          <Text style={styles.motivationText}>
            {currentStreak >= 7 
              ? '太棒了！你已经坚持一周以上，继续保持！' 
              : currentStreak >= 3 
              ? '很好！连续打卡习惯正在养成中'
              : '开始行动，每天进步一点点！'}
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  summaryCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  trendCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  trendBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
  },
  trendBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    width: 24,
    height: 100,
    backgroundColor: colors.background,
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  trendBar: {
    width: '100%',
    borderRadius: 12,
    minHeight: 4,
  },
  trendLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
  trendLabelToday: {
    color: colors.primary,
    fontWeight: '600',
  },
  trendCount: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  monthCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  monthStat: {
    flex: 1,
    alignItems: 'center',
  },
  monthValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  monthLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  monthDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  favoriteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  favoriteIconBg: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIcon: {
    fontSize: 26,
  },
  favoriteInfo: {
    flex: 1,
    marginLeft: 16,
  },
  favoriteName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  favoriteCount: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  favoriteBadge: {
    fontSize: 28,
  },
  motivationCard: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: colors.primary + '10',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  motivationIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  motivationText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  spacer: {
    height: 32,
  },
});
