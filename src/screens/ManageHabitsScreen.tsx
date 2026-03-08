import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation, NavigationProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getHabits, deleteHabit } from '../database';
import { colors } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';

type RootStackParamList = {
  EditHabit: { habit: any };
};

export default function ManageHabitsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [habits, setHabits] = useState<any[]>([]);

  const loadData = () => {
    setHabits(getHabits());
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleDelete = (habit: any) => {
    Alert.alert(
      '确认删除',
      `确定要删除习惯「${habit.name}」吗？相关的打卡记录也会被删除。`,
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

  const handleEdit = (habit: any) => {
    navigation.navigate('EditHabit', { habit });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>管理习惯</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {habits.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>还没有习惯</Text>
            <Text style={styles.emptySubtitle}>去添加你的第一个习惯吧</Text>
          </View>
        ) : (
          <View style={styles.habitsList}>
            {habits.map((habit, index) => (
              <View key={habit.id} style={styles.habitItem}>
                <View style={styles.habitNumber}>
                  <Text style={styles.habitNumberText}>{index + 1}</Text>
                </View>
                
                <LinearGradient
                  colors={[habit.color, habit.color + 'DD']}
                  style={styles.habitIconBg}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.habitIcon}>{habit.icon}</Text>
                </LinearGradient>
                
                <View style={styles.habitInfo}>
                  <Text style={styles.habitName}>{habit.name}</Text>
                  <Text style={styles.habitFrequency}>
                    {habit.frequency === 'daily' && '每天'}
                    {habit.frequency === 'weekdays' && '工作日'}
                    {habit.frequency === 'weekends' && '周末'}
                    {habit.frequency === 'weekly' && '每周'}
                  </Text>
                </View>
                
                <View style={styles.habitActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleEdit(habit)}
                  >
                    <Text style={styles.actionButtonText}>编辑</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(habit)}
                  >
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>删除</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
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
  },
  habitsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  habitNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  habitNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  habitIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  habitIcon: {
    fontSize: 24,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  habitFrequency: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  habitActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  editButton: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  deleteButton: {
    borderColor: colors.error,
    backgroundColor: colors.error + '10',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary,
  },
  deleteButtonText: {
    color: colors.error,
  },
});
