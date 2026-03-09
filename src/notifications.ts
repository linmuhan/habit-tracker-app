import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getHabits, getSetting, setSetting, shouldCheckInToday, isCheckedInToday } from './database';

// 配置通知行为
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  } as any),
});

// 请求通知权限
export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (!Device.isDevice) {
    console.log('通知功能需要在真机上测试');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
};

// 检查权限状态
export const checkNotificationPermissions = async (): Promise<boolean> => {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
};

// 取消所有通知
export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

// 取消特定习惯的通知
export const cancelHabitNotifications = async (habitId: number) => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.content.data?.habitId === habitId) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
};

// 调度单个习惯的提醒
export const scheduleHabitReminder = async (habit: any) => {
  if (!habit.reminderEnabled || !habit.reminderTime) return;

  // 先取消该习惯现有的通知
  await cancelHabitNotifications(habit.id);

  // 解析提醒时间 (格式: "HH:MM")
  const [hours, minutes] = habit.reminderTime.split(':').map(Number);

  // 获取免打扰设置
  const dndStart = getSetting('dndStartTime', '22:00');
  const dndEnd = getSetting('dndEndTime', '08:00');
  const [dndStartHour, dndStartMin] = dndStart.split(':').map(Number);
  const [dndEndHour, dndEndMin] = dndEnd.split(':').map(Number);

  // 检查提醒时间是否在免打扰时段内
  const reminderMinutes = hours * 60 + minutes;
  const dndStartMinutes = dndStartHour * 60 + dndStartMin;
  const dndEndMinutes = dndEndHour * 60 + dndEndMin;

  let isDND = false;
  if (dndStartMinutes < dndEndMinutes) {
    // 免打扰时段不跨天 (如 22:00-08:00 跨天了)
    isDND = reminderMinutes >= dndStartMinutes && reminderMinutes < dndEndMinutes;
  } else {
    // 免打扰时段跨天
    isDND = reminderMinutes >= dndStartMinutes || reminderMinutes < dndEndMinutes;
  }

  // 如果提醒时间在免打扰时段，调整到免打扰结束时间
  let scheduledHour = hours;
  let scheduledMinute = minutes;
  if (isDND) {
    scheduledHour = dndEndHour;
    scheduledMinute = dndEndMin;
  }

  // 根据频率设置触发器
  const freq = JSON.parse(habit.frequency || '{"type":"daily"}');
  let trigger: any;

  switch (freq.type) {
    case 'daily':
      trigger = {
        hour: scheduledHour,
        minute: scheduledMinute,
        repeats: true,
      };
      break;
    case 'weekdays':
      // 为每个工作日单独创建通知
      for (let day of [2, 3, 4, 5, 6]) { // 周一到周五
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🎯 习惯提醒',
            body: `该完成「${habit.name}」了！坚持就是胜利 💪`,
            data: { habitId: habit.id },
          },
          trigger: {
            type: 'calendar',
            weekday: day,
            hour: scheduledHour,
            minute: scheduledMinute,
            repeats: true,
          } as any,
        });
      }
      return;
    case 'weekends':
      for (let day of [1, 7]) { // 周六和周日
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🎯 习惯提醒',
            body: `该完成「${habit.name}」了！坚持就是胜利 💪`,
            data: { habitId: habit.id },
          },
          trigger: {
            type: 'calendar',
            weekday: day,
            hour: scheduledHour,
            minute: scheduledMinute,
            repeats: true,
          } as any,
        });
      }
      return;
    case 'weekly':
      if (freq.days && freq.days.length > 0) {
        for (let day of freq.days) {
          // JavaScript: 0=周日, 1=周一... 6=周六
          // iOS notification: 1=周日, 2=周一... 7=周六
          const notificationDay = day === 0 ? 1 : day + 1;
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '🎯 习惯提醒',
              body: `该完成「${habit.name}」了！坚持就是胜利 💪`,
              data: { habitId: habit.id },
            },
            trigger: {
              type: 'calendar',
              weekday: notificationDay,
              hour: scheduledHour,
              minute: scheduledMinute,
              repeats: true,
            } as any,
          });
        }
      }
      return;
    case 'monthly':
      // 每月的通知需要特殊处理，这里简化处理为每天检查
      trigger = {
        hour: scheduledHour,
        minute: scheduledMinute,
        repeats: true,
      };
      break;
    default:
      trigger = {
        hour: scheduledHour,
        minute: scheduledMinute,
        repeats: true,
      };
  }

  // 创建通知
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎯 习惯提醒',
      body: `该完成「${habit.name}」了！坚持就是胜利 💪`,
      data: { habitId: habit.id },
    },
    trigger,
  });
};

// 重新调度所有启用提醒的习惯
export const rescheduleAllReminders = async () => {
  await cancelAllNotifications();

  const habits = getHabits();
  for (const habit of habits) {
    if (habit.reminderEnabled && habit.reminderTime) {
      await scheduleHabitReminder(habit);
    }
  }
};

// 检查是否需要发送复活提醒
export const checkRevivalReminder = async () => {
  const lastCheckin = getSetting('lastCheckinDate');
  if (!lastCheckin) return;

  const lastDate = new Date(parseInt(lastCheckin));
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  // 断签3天以上才发送复活提醒
  if (diffDays >= 3) {
    const revivalSent = getSetting('revivalReminderSent');
    if (revivalSent !== today.toDateString()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '😢 好久不见',
          body: `已经${diffDays}天没有打卡了，回来继续你的习惯之旅吧！`,
        },
        trigger: null, // 立即发送
      });
      setSetting('revivalReminderSent', today.toDateString());
    }
  }
};

// 更新习惯的提醒设置
export const updateHabitReminder = async (habitId: number, enabled: boolean, time?: string) => {
  const { updateHabit } = require('./database');
  updateHabit(habitId, {
    reminderEnabled: enabled ? 1 : 0,
    reminderTime: time,
  });

  if (enabled && time) {
    const habits = getHabits();
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
      await scheduleHabitReminder({ ...habit, reminderEnabled: 1, reminderTime: time });
    }
  } else {
    await cancelHabitNotifications(habitId);
  }
};

// 获取免打扰设置
export interface DNDSettings {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

export const getDNDSettings = (): DNDSettings => {
  return {
    enabled: getSetting('dndEnabled', 'false') === 'true',
    startTime: getSetting('dndStartTime', '22:00'),
    endTime: getSetting('dndEndTime', '08:00'),
  };
};

export const setDNDSettings = (settings: DNDSettings) => {
  setSetting('dndEnabled', settings.enabled.toString());
  setSetting('dndStartTime', settings.startTime);
  setSetting('dndEndTime', settings.endTime);

  // 重新调度所有提醒以应用新的免打扰设置
  rescheduleAllReminders();
};
