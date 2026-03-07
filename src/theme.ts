export const colors = {
  primary: '#6366F1',
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  secondary: '#EC4899',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

export const gradients: [string, string][] = [
  ['#6366F1', '#8B5CF6'],
  ['#EC4899', '#F43F5E'],
  ['#10B981', '#34D399'],
  ['#F59E0B', '#FBBF24'],
  ['#3B82F6', '#06B6D4'],
  ['#8B5CF6', '#A855F7'],
  ['#F43F5E', '#FB7185'],
  ['#14B8A6', '#2DD4BF'],
];

export const icons = [
  '📚', '💪', '🏃', '💧', '🧘', '🎨', '🎵', '💊',
  '🥗', '💤', '✍️', '💻', '🌱', '☀️', '🦷', '🧹',
  '💰', '📱', '🚭', '🎯', '🎸', '📷', '🎮', '🚴',
];

export interface Habit {
  id: number;
  name: string;
  icon: string;
  color: string;
  frequency: string;
  reminderTime?: string;
  createdAt: number;
  isActive: number;
}

export interface Checkin {
  id: number;
  habitId: number;
  checkinDate: number;
  note?: string;
  photos?: string;
  createdAt: number;
  habitName?: string;
  habitIcon?: string;
  habitColor?: string;
}
