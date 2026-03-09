import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import CustomDialog from '../components/CustomDialog';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCheckinsByDate, deleteCheckin } from '../database';
import { colors } from '../theme';

export default function DayDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { date } = route.params as any;

  const [checkins, setCheckins] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '',
    type: 'default' as 'default' | 'danger',
    onConfirm: () => {},
  });

  const loadData = () => {
    const dateObj = new Date(date);
    const checkinsData = getCheckinsByDate(dateObj);
    setCheckins(checkinsData);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [date])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  };

  const showDialog = (title: string, message: string, onConfirm: () => void, type: 'default' | 'danger' = 'default') => {
    setDialogConfig({
      title,
      message,
      type,
      onConfirm,
    });
    setDialogVisible(true);
  };

  const handleDelete = (checkin: any) => {
    showDialog(
      '删除记录',
      '确定要删除这条打卡记录吗？此操作不可恢复。',
      () => {
        deleteCheckin(checkin.id);
        loadData();
        setDialogVisible(false);
      },
      'danger'
    );
  };

  const dateObj = new Date(date);
  const dateStr = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
  const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][dateObj.getDay()];
  const isToday = new Date().toDateString() === dateObj.toDateString();

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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{dateStr}</Text>
          <Text style={styles.headerSubtitle}>{weekDay} {isToday && '· 今天'}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{checkins.length}</Text>
            <Text style={styles.summaryLabel}>打卡次数</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>
              {checkins.filter(c => c.photos).length}
            </Text>
            <Text style={styles.summaryLabel}>带照片</Text>
          </View>
        </View>

        {/* Checkins List */}
        {checkins.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>这一天还没有打卡</Text>
            <Text style={styles.emptySubtitle}>去今天页面添加习惯打卡吧</Text>
          </View>
        ) : (
          <View style={styles.checkinsList}>
            <Text style={styles.sectionTitle}>打卡记录</Text>
            
            {checkins.map((checkin, index) => (
              <View key={checkin.id} style={styles.checkinCard}>
                {/* Header */}
                <View style={styles.checkinHeader}>
                  <View style={[styles.iconBg, { backgroundColor: checkin.habitColor }]}>
                    <Text style={styles.icon}>{checkin.habitIcon}</Text>
                  </View>
                  <View style={styles.checkinInfo}>
                    <Text style={styles.habitName}>{checkin.habitName}</Text>
                    <Text style={styles.checkinTime}>
                      {new Date(checkin.createdAt).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(checkin)}
                  >
                    <Text style={styles.deleteIcon}>🗑️</Text>
                  </TouchableOpacity>
                </View>

                {/* Note */}
                {checkin.note && (
                  <View style={styles.noteContainer}>
                    <Text style={styles.noteText}>{checkin.note}</Text>
                  </View>
                )}

                {/* Photos */}
                {checkin.photos && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.photosScroll}
                  >
                    {JSON.parse(checkin.photos).map((photo: string, idx: number) => (
                      <TouchableOpacity key={idx} activeOpacity={0.9}>
                        <Image source={{ uri: photo }} style={styles.photo} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Quote */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteIcon}>💭</Text>
          <Text style={styles.quoteText}>
            "坚持不是因为看到希望才坚持，而是坚持了才看到希望。"
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
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  checkinsList: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  checkinCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  checkinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 22,
  },
  checkinInfo: {
    flex: 1,
    marginLeft: 12,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  checkinTime: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.error + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 16,
  },
  noteContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  noteText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  photosScroll: {
    marginTop: 12,
    marginHorizontal: -4,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  quoteCard: {
    marginTop: 20,
    backgroundColor: colors.primary + '08',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  quoteIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quoteText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  spacer: {
    height: 32,
  },
});
