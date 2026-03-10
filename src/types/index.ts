/**
 * 应用类型定义
 */

// ==================== 习惯相关类型 ====================

export interface Habit {
  id: number;
  name: string;
  icon: string;
  color: string;
  frequency: string;
  reminderTime?: string | null;
  reminderEnabled: number;
  category: string;
  createdAt: number;
  isActive: number;
}

export interface HabitInput {
  name: string;
  icon: string;
  color: string;
  frequency: string;
  category?: string;
  reminderEnabled?: number;
  reminderTime?: string | null;
}

// ==================== 打卡相关类型 ====================

export interface Checkin {
  id: number;
  habitId: number;
  checkinDate: number;
  note?: string;
  photos?: string;
  location?: string;
  createdAt: number;
}

export interface CheckinInput {
  habitId: number;
  checkinDate: number;
  note?: string;
  photos?: string[];
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

// ==================== 挑战相关类型 ====================

export interface Challenge {
  id: number;
  habitId: number;
  title: string;
  description?: string;
  targetDays: number;
  startDate: number;
  endDate?: number | null;
  status: 'active' | 'completed' | 'deleted';
  completedDays: number;
  createdAt: number;
  habitName?: string;
  habitIcon?: string;
  habitColor?: string;
}

export interface ChallengeInput {
  habitId: number;
  title: string;
  description?: string;
  targetDays: number;
  startDate: number;
}

// ==================== 设置相关类型 ====================

export interface Setting {
  key: string;
  value: string;
}

// ==================== 频率相关类型 ====================

export type FrequencyType = 'daily' | 'weekdays' | 'weekends' | 'weekly' | 'monthly';

export interface FrequencyConfig {
  type: FrequencyType;
  days?: number[]; // 对于 weekly: 0-6 (周日-周六), 对于 monthly: 1-31
  times?: number;
}

// ==================== 导航相关类型 ====================

export type RootStackParamList = {
  Main: undefined;
  AddHabit: undefined;
  EditHabit: { habit: Habit };
  ManageHabits: undefined;
  Checkin: { habit: Habit };
  DayDetail: { date: string; timestamp: number };
  ImageViewer: { photos: string[]; initialIndex: number };
  EditProfile: undefined;
  ShareCard: { checkin: Checkin; habit: Habit };
  Challenge: undefined;
  Backup: undefined;
  NotificationSettings: undefined;
};

export type MainTabParamList = {
  Today: undefined;
  Calendar: undefined;
  Stats: undefined;
  Profile: undefined;
};

// ==================== 统计数据类型 ====================

export interface HabitStats {
  habitId: number;
  totalCheckins: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  weeklyData: number[];
}

// ==================== 用户配置类型 ====================

export interface UserProfile {
  nickname: string;
  avatar?: string;
  signature: string;
}
