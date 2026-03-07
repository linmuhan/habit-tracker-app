import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { useFocusEffect, useNavigation, NavigationProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getHabits, getStreak, isCheckedInToday, getAllCheckins } from '../database';
import { colors, gradients } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';

type RootStackParamList = {
  AddHabit: undefined;
  Checkin: { habit: any };
};

export default function TodayScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [habits, setHabits] = useState<any[]>([]);
  const [streaks, setStreaks] = useState<Record<number, number>>({});
  const [checkedIn, setCheckedIn] = useState<Record<number, boolean>>({});
  const [recentCheckins, setRecentCheckins] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const habitsData = getHabits();
    setHabits(habitsData);

    const streaksData = {};
    const checkedData = {};
    for (const habit of habitsData) {
      streaksData[habit.id] = getStreak(habit.id);
      checkedData[habit.id] = isCheckedInToday(habit.id);
    }
    setStreaks(streaksData);
    setCheckedIn(checkedData);

    const checkins = getAllCheckins();
    setRecentCheckins(checkins.slice(0, 5));
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getGradient = (index: number): [string, string] => {
    return gradients[index % gradients.length];
  };

  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`;
  const weekStr = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][today.getDay()];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.dateText}>{dateStr} {weekStr}</Text>
          <Text style={styles.greeting}>
            {habits.filter(h => checkedIn[h.id]).length === habits.length && habits.length > 0
              ? '太棒了！今日全部完成 🎉'
              : `今日已打卡 ${habits.filter(h => checkedIn[h.id]).length}/${habits.length}`}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {habits.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>还没有习惯</Text>
            <Text style={styles.emptySubtitle}>添加你的第一个习惯，开始打卡之旅</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('AddHabit')}
            >
              <Text style={styles.addButtonText}>+ 添加习惯</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.habitsGrid}>
              {habits.map((habit, index) => {
                const isChecked = checkedIn[habit.id];
                const gradient = getGradient(index);

                return (
                  <TouchableOpacity
                    key={habit.id}
                    style={styles.habitCard}
                    onPress={() => navigation.navigate('Checkin', { habit })}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={isChecked ? ['#10B981', '#34D399'] : gradient}
                      style={styles.habitGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.habitContent}>
                        <Text style={styles.habitIcon}>{habit.icon}</Text>
                        <Text style={styles.habitName} numberOfLines={1}>{habit.name}</Text>
                        <View style={styles.habitFooter}>
                          <Text style={styles.streakText}>
                            🔥 {streaks[habit.id] || 0} 天
                          </Text>
                          {isChecked && (
                            <View style={styles.checkBadge}>
                              <Text style={styles.checkBadgeText}>✓</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.floatingAddButton}
              onPress={() => navigation.navigate('AddHabit')}
            >
              <Text style={styles.floatingAddButtonText}>+ 添加习惯</Text>
            </TouchableOpacity>

            {recentCheckins.length > 0 && (
              <View style={styles.recentSection}>
                <Text style={styles.sectionTitle}>最近打卡</Text>
                {recentCheckins.map((checkin) => (
                  <View key={checkin.id} style={styles.recentItem}>
                    <View style={[styles.recentIconBg, { backgroundColor: checkin.habitColor + '20' }]}>
                      <Text style={styles.recentIcon}>{checkin.habitIcon}</Text>
                    </View>
                    <View style={styles.recentContent}>
                      <Text style={styles.recentHabitName}>{checkin.habitName}</Text>
                      <Text style={styles.recentNote} numberOfLines={1}>
                        {checkin.note || '无备注'}
                      </Text>
                    </View>
                    {checkin.photos && (
                      <Image
                        source={{ uri: JSON.parse(checkin.photos)[0] }}
                        style={styles.recentThumbnail}
                      />
                    )}
                  </View>
                ))}
              </View>
            )}
          </>
        )}
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
  dateText: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 4,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyIcon: {
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
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  habitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  habitCard: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  habitGradient: {
    flex: 1,
    padding: 16,
  },
  habitContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  habitIcon: {
    fontSize: 32,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginTop: 8,
  },
  habitFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  streakText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  floatingAddButton: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: colors.surface,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  floatingAddButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  recentSection: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  recentIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentIcon: {
    fontSize: 20,
  },
  recentContent: {
    flex: 1,
    marginLeft: 12,
  },
  recentHabitName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  recentNote: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  recentThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginLeft: 8,
  },
});
