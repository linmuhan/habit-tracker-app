import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Image,
} from 'react-native';
import CustomDialog from '../components/CustomDialog';
import Toast from '../components/Toast';
import { useFocusEffect, useNavigation, NavigationProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getHabits, getAllCheckins, clearAllData } from '../database';
import { colors } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';

type RootStackParamList = {
  EditProfile: undefined;
  ManageHabits: undefined;
  ShareCard: undefined;
};

const AVATAR_STORAGE_KEY = '@habit_tracker_avatar';
const NICKNAME_STORAGE_KEY = '@habit_tracker_nickname';
const SIGNATURE_STORAGE_KEY = '@habit_tracker_signature';

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [habits, setHabits] = useState<any[]>([]);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [nickname, setNickname] = useState('打卡达人');
  const [signature, setSignature] = useState('坚持就是胜利');
  const [avatar, setAvatar] = useState('👤');
  const [customAvatarUri, setCustomAvatarUri] = useState<string | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '',
    type: 'default' as 'default' | 'danger',
    onConfirm: () => {},
  });
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  const showDialog = (title: string, message: string, onConfirm: () => void, type: 'default' | 'danger' = 'default') => {
    setDialogConfig({
      title,
      message,
      type,
      onConfirm,
    });
    setDialogVisible(true);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const loadData = async () => {
    setHabits(getHabits());
    setCheckins(getAllCheckins());
    
    // Load profile data
    try {
      const savedNickname = await AsyncStorage.getItem(NICKNAME_STORAGE_KEY);
      const savedSignature = await AsyncStorage.getItem(SIGNATURE_STORAGE_KEY);
      const savedAvatar = await AsyncStorage.getItem(AVATAR_STORAGE_KEY);
      
      if (savedNickname) setNickname(savedNickname);
      if (savedSignature) setSignature(savedSignature);
      if (savedAvatar) {
        if (savedAvatar.startsWith('http') || savedAvatar.startsWith('file')) {
          setCustomAvatarUri(savedAvatar);
          setAvatar('');
        } else {
          setAvatar(savedAvatar);
          setCustomAvatarUri(null);
        }
      }
    } catch (error) {
      console.log('加载个人资料失败', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const totalCheckins = checkins.length;
  const totalHabits = habits.length;
  
  // 计算连续打卡天数
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

  const handleShare = async () => {
    try {
      await Share.share({
        message: `我在打卡日记已坚持打卡${currentStreak}天，共完成${totalCheckins}次打卡！一起养成好习惯吧！`,
        title: '打卡日记',
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleClearData = () => {
    showDialog(
      '确认清除',
      '这将清除所有习惯和数据，此操作不可恢复，确定吗？',
      () => {
        clearAllData();
        loadData();
        setDialogVisible(false);
        showToast('所有数据已清除', 'success');
      },
      'danger'
    );
  };

  const menuItems = [
    { icon: '📋', title: '管理习惯', subtitle: `${totalHabits} 个习惯`, onPress: () => navigation.navigate('ManageHabits') },
    { icon: '🎨', title: '生成分享卡片', subtitle: '生成精美海报分享', onPress: () => navigation.navigate('ShareCard') },
    { icon: '📤', title: '文字分享', subtitle: '邀请好友一起打卡', onPress: handleShare },
    { icon: 'ℹ️', title: '关于应用', subtitle: '版本 1.0.0', onPress: () => {} },
    { icon: '🗑️', title: '清除数据', subtitle: '删除所有习惯和数据', onPress: handleClearData, danger: true },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomDialog
        visible={dialogVisible}
        title={dialogConfig.title}
        message={dialogConfig.message}
        onConfirm={dialogConfig.onConfirm}
        onCancel={() => setDialogVisible(false)}
        type={dialogConfig.type}
      />
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onClose={() => setToastVisible(false)}
      />
      <View style={styles.header}>
        <Text style={styles.title}>我的</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <TouchableOpacity style={styles.profileCard} onPress={() => navigation.navigate('EditProfile')}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.profileGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.avatarContainer}>
              {customAvatarUri ? (
                <Image source={{ uri: customAvatarUri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatar}>{avatar || '👤'}</Text>
              )}
            </View>
            <Text style={styles.username}>{nickname}</Text>
            <Text style={styles.subtitle}>{signature}</Text>
            
            <View style={styles.editHint}>
              <Text style={styles.editHintText}>点击编辑资料 ›</Text>
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalCheckins}</Text>
                <Text style={styles.statLabel}>总打卡</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalHabits}</Text>
                <Text style={styles.statLabel}>习惯数</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{currentStreak}</Text>
                <Text style={styles.statLabel}>连续天数</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.menuItemLast,
              ]}
              onPress={item.onPress}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, item.danger && styles.menuTitleDanger]}>
                  {item.title}
                </Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>打卡日记 v1.0.0</Text>
          <Text style={styles.footerSubtext}>养成好习惯，从今天开始</Text>
        </View>
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
  scrollView: {
    flex: 1,
  },
  profileCard: {
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  profileGradient: {
    padding: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatar: {
    fontSize: 40,
  },
  username: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  editHint: {
    marginBottom: 20,
  },
  editHintText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  menuSection: {
    marginTop: 24,
    marginHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  menuTitleDanger: {
    color: colors.error,
  },
  menuSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  menuArrow: {
    fontSize: 20,
    color: colors.textMuted,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
});
