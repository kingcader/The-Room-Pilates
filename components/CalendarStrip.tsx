import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts } from '@/lib/theme';

interface CalendarStripProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export default function CalendarStrip({ selectedDate, onDateSelect }: CalendarStripProps) {
  const today = new Date();
  const dates: Date[] = [];

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }

  const formatDayName = (date: Date): string => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  const formatDayNumber = (date: Date): string => {
    return date.getDate().toString();
  };

  const isSelected = (date: Date): boolean => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
        style={styles.scrollView}
      >
        {dates.map((date, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => onDateSelect(date)}
            style={styles.dateItem}
          >
            <Text
              style={[
                styles.dayName,
                isSelected(date) && styles.dayNameSelected,
              ]}
            >
              {formatDayName(date)}
            </Text>
            <Text
              style={[
                styles.dayNumber,
                isSelected(date) && styles.dayNumberSelected,
              ]}
            >
              {formatDayNumber(date)}
            </Text>
            {isSelected(date) && <View style={styles.indicator} />}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.cream,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  scrollView: {
    flexGrow: 0,
    flexShrink: 0,
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateItem: {
    marginHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
  },
  dayName: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.4)',
    fontFamily: fonts.sans,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  dayNameSelected: {
    color: colors.black,
    fontWeight: '700',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '400',
    color: 'rgba(0,0,0,0.4)',
    fontFamily: fonts.serif,
  },
  dayNumberSelected: {
    color: colors.black,
    fontWeight: '600',
  },
  indicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.black,
    marginTop: 4,
  },
});
