import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import DateTimePicker from '@react-native-community/datetimepicker'; // 暂时不需要，使用简单的时间输入
import { getSetting, setSetting } from '../database';
import { colors } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from '../components/Toast';
import {
  requestNotificationPermissions,
  checkNotificationPermissions,
  getDNDSettings,
  setDNDSettings,
  rescheduleAllReminders,
  DNDSettings,
} from '../notifications';

export default function NotificationSettingsScreen() {
  const navigation = useNavigation();
  const [hasPermission, setHasPermission] = useState(false);
  const [masterEnabled, setMasterEnabled] = useState(false);
  const [dndSettings, setDndSettings] = useState<DNDSettings>({
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
  });
  const [editingTime, setEditingTime] = useState<'start' | 'end' | null>(null);
  const [tempTime, setTempTime] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const permission = await checkNotificationPermissions();
    setHasPermission(permission);

    const master = getSetting('masterReminderEnabled', 'false') === 'true';
    setMasterEnabled(master);

    setDndSettings(getDNDSettings());
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermissions();
    setHasPermission(granted);
    if (granted) {
      showToast('通知权限已开启', 'success');
    } else {
      showToast('需要通知权限才能使用提醒功能', 'error');
    }
  };

  const toggleMasterSwitch = async (value: boolean) => {
    if (value && !hasPermission) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        showToast('请先开启通知权限', 'error');
        return;
      }
      setHasPermission(true);
    }

    setMasterEnabled(value);
    setSetting('masterReminderEnabled', value.toString());

    if (value) {
      await rescheduleAllReminders();
      showToast('提醒已开启', 'success');
    } else {
      const { cancelAllNotifications } = require('../notifications');
      await cancelAllNotifications();
      showToast('所有提醒已关闭', 'info');
    }
  };

  const toggleDND = (value: boolean) => {
    const newSettings = { ...dndSettings, enabled: value };
    setDndSettings(newSettings);
    setDNDSettings(newSettings);
    showToast(value ? '免打扰已开启' : '免打扰已关闭', 'success');
  };

  const validateTime = (time: string): boolean => {
    const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
  };

  const saveTime = () => {
    if (!validateTime(tempTime)) {
      showToast('请输入有效的时间格式 (如: 22:00)', 'error');
      return;
    }

    if (editingTime === 'start') {
      const newSettings = { ...dndSettings, startTime: tempTime };
      setDndSettings(newSettings);
      setDNDSettings(newSettings);
    } else {
      const newSettings = { ...dndSettings, endTime: tempTime };
      setDndSettings(newSettings);
      setDNDSettings(newSettings);
    }
    setEditingTime(null);
    showToast('时间已保存', 'success');
  };

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
        <Text style={styles.headerTitle}>提醒设置</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Permission Warning */}
        {!hasPermission && (
          <View style={styles.permissionCard}>
            <Text style={styles.permissionIcon}>🔔</Text>
            <Text style={styles.permissionTitle}>需要通知权限</Text>
            <Text style={styles.permissionText}>
              开启通知权限后，我们可以在您设定的时间提醒您打卡
            </Text>
            <TouchableOpacity style={styles.permissionButton} onPress={handleRequestPermission}>
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.permissionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.permissionButtonText}>开启通知权限</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Master Switch */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>习惯提醒</Text>
              <Text style={styles.sectionDesc}>在设定的时间提醒您打卡</Text>
            </View>
            <Switch
              value={masterEnabled}
              onValueChange={toggleMasterSwitch}
              trackColor={{ false: '#D1D5DB', true: colors.primary }}
              thumbColor="white"
            />
          </View>
        </View>

        {/* DND Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>免打扰时段</Text>
              <Text style={styles.sectionDesc}>此时间段内不会发送提醒</Text>
            </View>
            <Switch
              value={dndSettings.enabled}
              onValueChange={toggleDND}
              trackColor={{ false: '#D1D5DB', true: colors.primary }}
              thumbColor="white"
              disabled={!masterEnabled}
            />
          </View>

          {dndSettings.enabled && (
            <View style={styles.dndTimeContainer}>
              {editingTime === 'start' ? (
                <View style={styles.timeEditContainer}>
                  <TextInput
                    style={styles.timeInput}
                    value={tempTime}
                    onChangeText={setTempTime}
                    placeholder="22:00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numbers-and-punctuation"
                    maxLength={5}
                    autoFocus
                  />
                  <TouchableOpacity style={styles.timeSaveButton} onPress={saveTime}>
                    <Text style={styles.timeSaveText}>保存</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => {
                    setTempTime(dndSettings.startTime);
                    setEditingTime('start');
                  }}
                  disabled={!masterEnabled}
                >
                  <Text style={styles.timeLabel}>开始时间</Text>
                  <Text style={[styles.timeValue, !masterEnabled && styles.timeValueDisabled]}>
                    {dndSettings.startTime}
                  </Text>
                </TouchableOpacity>
              )}

              <Text style={styles.timeSeparator}>至</Text>

              {editingTime === 'end' ? (
                <View style={styles.timeEditContainer}>
                  <TextInput
                    style={styles.timeInput}
                    value={tempTime}
                    onChangeText={setTempTime}
                    placeholder="08:00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numbers-and-punctuation"
                    maxLength={5}
                    autoFocus
                  />
                  <TouchableOpacity style={styles.timeSaveButton} onPress={saveTime}>
                    <Text style={styles.timeSaveText}>保存</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => {
                    setTempTime(dndSettings.endTime);
                    setEditingTime('end');
                  }}
                  disabled={!masterEnabled}
                >
                  <Text style={styles.timeLabel}>结束时间</Text>
                  <Text style={[styles.timeValue, !masterEnabled && styles.timeValueDisabled]}>
                    {dndSettings.endTime}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsEmoji}>💡</Text>
          <Text style={styles.tipsTitle}>提醒规则</Text>
          <Text style={styles.tipsText}>
            • 每天最多提醒一次{'\n'}
            • 已打卡当天不再提醒{'\n'}
            • 断签3天后会发送复活提醒{'\n'}
            • 免打扰时段内不会发送提醒
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
  permissionCard: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  permissionIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  permissionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  permissionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  permissionGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  section: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  dndTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  timeButton: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  timeValueDisabled: {
    color: colors.textMuted,
  },
  timeEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  timeInput: {
    width: 60,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  timeSaveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  timeSaveText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  timeSeparator: {
    fontSize: 14,
    color: colors.textSecondary,
    marginHorizontal: 16,
  },
  tipsCard: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  tipsEmoji: {
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
    lineHeight: 24,
  },
  spacer: {
    height: 32,
  },
});
