import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { getAllCheckins, getHabits } from '../database';
import { colors } from '../theme';

const { width } = Dimensions.get('window');

export default function CalendarScreen() {
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});
  const [habits, setHabits] = useState<any[]>([]);

  const loadData = () => {
    const habitsData = getHabits();
    setHabits(habitsData);

    const checkinsData = getAllCheckins();
    setCheckins(checkinsData);

    // 构建标记日期
    const marks = {};
    checkinsData.forEach((checkin) => {
      const date = new Date(checkin.checkinDate);
      const dateStr = date.toISOString().split('T')[0];
      
      if (!marks[dateStr]) {
        marks[dateStr] = {
          dots: [],
          customStyles: {
            container: { backgroundColor: checkin.habitColor + '20' },
            text: { color: checkin.habitColor, fontWeight: '600' },
          },
        };
      }
      
      marks[dateStr].dots.push({
        color: checkin.habitColor,
        selectedColor: checkin.habitColor,
      });
    });
    
    setMarkedDates(marks);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const getCheckinsForDate = (dateStr: string) => {
    return checkins.filter((checkin) => {
      const checkinDate = new Date(checkin.checkinDate);
      return checkinDate.toISOString().split('T')[0] === dateStr;
    });
  };

  const selectedCheckins = getCheckinsForDate(selectedDate);
  const selectedDateObj = new Date(selectedDate);
  const dateDisplay = `${selectedDateObj.getMonth() + 1}月${selectedDateObj.getDate()}日`;

  // 获取该日期所有打卡图片
  const getDatePhotos = (dateStr: string) => {
    const dayCheckins = getCheckinsForDate(dateStr);
    const photos = [];
    dayCheckins.forEach((checkin) => {
      if (checkin.photos) {
        try {
          const parsed = JSON.parse(checkin.photos);
          parsed.forEach((photo) => {
            photos.push({
              uri: photo,
              habitName: checkin.habitName,
              habitIcon: checkin.habitIcon,
              habitColor: checkin.habitColor,
            });
          });
        } catch (e) {}
      }
    });
    return photos;
  };

  const renderDay = (date: any, state: string) => {
    const dateStr = date.dateString;
    const dayCheckins = getCheckinsForDate(dateStr);
    const photos = getDatePhotos(dateStr);
    const isSelected = dateStr === selectedDate;
    const hasCheckin = dayCheckins.length > 0;

    return (
      <TouchableOpacity
        onPress={() => setSelectedDate(dateStr)}
        style={[styles.dayContainer, isSelected && styles.daySelected]}
      >
        <Text style={[
          styles.dayText,
          state === 'disabled' && styles.dayDisabled,
          isSelected && styles.dayTextSelected,
          hasCheckin && !isSelected && styles.dayTextActive,
        ]}>
          {date.day}
        </Text>
        
        {photos.length > 0 ? (
          <View style={styles.thumbnailContainer}>
            <Image
              source={{ uri: photos[0].uri }}
              style={styles.dayThumbnail}
            />
            {photos.length > 1 && (
              <View style={styles.photoCountBadge}>
                <Text style={styles.photoCountText}>+{photos.length - 1}</Text>
              </View>
            )}
          </View>
        ) : hasCheckin ? (
          <View style={styles.dotsContainer}>
            {dayCheckins.slice(0, 3).map((checkin, idx) => (
              <View
                key={idx}
                style={[styles.dot, { backgroundColor: checkin.habitColor }]}
              />
            ))}
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>打卡日历</Text>
        <Text style={styles.subtitle}>记录每一天的成长</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.calendarContainer}>
          <Calendar
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={{
              ...markedDates,
              [selectedDate]: {
                ...markedDates[selectedDate],
                selected: true,
                selectedColor: colors.primary,
              },
            }}
            markingType="custom"
            dayComponent={({ date, state }) => renderDay(date, state)}
            theme={{
              backgroundColor: colors.surface,
              calendarBackground: colors.surface,
              textSectionTitleColor: colors.textSecondary,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: 'white',
              todayTextColor: colors.primary,
              dayTextColor: colors.text,
              textDisabledColor: colors.textMuted,
              dotColor: colors.primary,
              selectedDotColor: 'white',
              arrowColor: colors.primary,
              monthTextColor: colors.text,
              textMonthFontWeight: '600',
              textDayFontSize: 14,
              textMonthFontSize: 16,
            }}
            style={styles.calendar}
          />
        </View>

        <View style={styles.detailSection}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailDate}>{dateDisplay}</Text>
            <Text style={styles.detailCount}>
              {selectedCheckins.length} 个打卡
            </Text>
          </View>

          {selectedCheckins.length === 0 ? (
            <View style={styles.emptyDetail}>
              <Text style={styles.emptyDetailIcon}>📭</Text>
              <Text style={styles.emptyDetailText}>这一天还没有打卡</Text>
            </View>
          ) : (
            <View style={styles.checkinList}>
              {selectedCheckins.map((checkin) => (
                <View key={checkin.id} style={styles.checkinCard}>
                  <View style={styles.checkinHeader}>
                    <View style={[styles.iconBg, { backgroundColor: checkin.habitColor + '20' }]}>
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
                  </View>

                  {checkin.note && (
                    <Text style={styles.note}>{checkin.note}</Text>
                  )}

                  {checkin.photos && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.photosScroll}
                    >
                      {JSON.parse(checkin.photos).map((photo: string, idx: number) => (
                        <Image
                          key={idx}
                          source={{ uri: photo }}
                          style={styles.photo}
                        />
                      ))}
                    </ScrollView>
                  )}
                </View>
              ))}
            </View>
          )}
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
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  calendarContainer: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 12,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  calendar: {
    borderRadius: 12,
  },
  dayContainer: {
    width: 40,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  daySelected: {
    backgroundColor: colors.primary + '15',
  },
  dayText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  dayDisabled: {
    color: colors.textMuted,
  },
  dayTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  dayTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  thumbnailContainer: {
    position: 'relative',
    marginTop: 2,
  },
  dayThumbnail: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  photoCountBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    backgroundColor: colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  photoCountText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '700',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  detailSection: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailDate: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  detailCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyDetail: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyDetailIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyDetailText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  checkinList: {
    gap: 12,
  },
  checkinCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  checkinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    marginLeft: 12,
    flex: 1,
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
  note: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  photosScroll: {
    flexDirection: 'row',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 8,
  },
});
