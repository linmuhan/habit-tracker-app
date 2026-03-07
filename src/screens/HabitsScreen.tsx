import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation, NavigationProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getHabits, deleteHabit, getStreak, getCheckinsByHabit } from '../database';
import { colors, gradients } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';

type RootStackParamList = {
  AddHabit: undefined;
};

export default function HabitsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [habits, setHabits] = useState<any[]>([]);
  const [streaks, setStreaks] = useState<Record<number, number>>({});
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const habitsData = getHabits();
    setHabits(habitsData);

    const streaksData = {};
    const countsData = {};
    for (const habit of habitsData) {
      streaksData[habit.id] = getStreak(habit.id);
      countsData[habit.id] = getCheckinsByHabit(habit.id).length;
    }
    setStreaks(streaksData);
    setCounts(countsData);
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

  const handleDelete = (habit: any) => {
    Alert.alert(
      '删除习惯',
      `确定要删除 "${habit.name}" 吗？\n所有相关记录也会被删除。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            deleteHabit(habit.id);
            loadData();
          },
        },
      ]
    );
  };

  const getGradient = (color: string, index: number): [string, string] => {
    return (gradients.find(g => g[0] === color) || gradients[index % gradients.length]) as [string, string];
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>我的习惯</Text>
          <Text style={styles.subtitle}>共 {habits.length} 个习惯</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddHabit')}
        >
          <Text style={styles.addButtonText}>+ 新建</Text>
        </TouchableOpacity>
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
            <Text style={styles.emptySubtitle}>点击右上角新建习惯</Text>
          </View>
        ) : (
          <View style={styles.habitsList}>
            {habits.map((habit, index) => {
              const gradient = getGradient(habit.color, index);
              const streak = streaks[habit.id] || 0;
              const count = counts[habit.id] || 0;

              return (
                <View key={habit.id} style={styles.habitCard}>
                  <LinearGradient
                    colors={[gradient[0] + '15', gradient[1] + '08']}
                    style={styles.habitGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.habitHeader}>
                      <View style={[styles.iconBg, { backgroundColor: habit.color }]}>
                        <Text style={styles.icon}>{habit.icon}</Text>
                      </View>
                      <View style={styles.habitInfo}>
                        <Text style={styles.habitName}>{habit.name}</Text>
                        <Text style={styles.habitFrequency}>
                          {habit.frequency === 'daily' ? '每天' :
                           habit.frequency === 'weekdays' ? '工作日' :
                           habit.frequency === 'weekends' ? '周末' : '每周'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDelete(habit)}
                      >
                        <Text style={styles.deleteIcon}>🗑️</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{count}</Text>
                        <Text style={styles.statLabel}>总打卡</Text>
                      </View>
                      <View style={[styles.statDivider, { backgroundColor: habit.color + '30' }]} />
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: habit.color }]}>{streak}</Text>
                        <Text style={styles.statLabel}>连续天数</Text>
                      </View>
                      <View style={[styles.statDivider, { backgroundColor: habit.color + '30' }]} />
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>
                          {count > 0 ? Math.round((streak / count) * 100) : 0}%
                        </Text>
                        <Text style={styles.statLabel}>坚持率</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.tipsCard}>
          <Text style={styles.tipsIcon}>💡</Text>
          <Text style={styles.tipsTitle}>小贴士</Text>
          <Text style={styles.tipsText}>
            养成一个习惯平均需要66天。{'\n'}
            保持连续打卡，让好习惯成为本能！
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
  },
  habitsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  habitCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  habitGradient: {
    padding: 16,
  },
  habitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
  },
  habitInfo: {
    flex: 1,
    marginLeft: 12,
  },
  habitName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  habitFrequency: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  tipsCard: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipsIcon: {
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
    textAlign: 'center',
    lineHeight: 20,
  },
  spacer: {
    height: 32,
  },
});
