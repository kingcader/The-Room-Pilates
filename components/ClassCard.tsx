import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ScheduleItem } from '@/lib/supabase';
import { colors, fonts } from '@/lib/theme';

interface ClassCardProps {
  scheduleItem: ScheduleItem & { classes?: { name: string; description: string | null } };
  onBook: () => void;
  isBookable: boolean;
  isBooked?: boolean;
}

export default function ClassCard({
  scheduleItem,
  onBook,
  isBookable,
  isBooked = false,
}: ClassCardProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}.${minutesStr}${ampm}`;
  };

  return (
    <View style={styles.card}>
      <View style={styles.leftContent}>
        <Text style={styles.className}>{scheduleItem.classes?.name || 'Class'}</Text>
        <Text style={styles.instructor}>with {scheduleItem.instructor_name}</Text>
        <Text style={styles.time}>{formatTime(scheduleItem.start_time)}</Text>
      </View>

      <Pressable
        onPress={onBook}
        disabled={!isBookable || isBooked}
        style={({ pressed }) => [
          styles.button,
          isBooked && styles.buttonBooked,
          (!isBookable && !isBooked) && styles.buttonDisabled,
          pressed && styles.buttonPressed
        ]}
      >
        <Text style={[
          styles.buttonText,
          (isBooked || !isBookable) && styles.buttonTextDisabled
        ]}>
          {isBooked ? 'BOOKED' : isBookable ? 'BOOK' : 'NO CREDITS'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 12,
    backgroundColor: colors.white,
    borderRadius: 16, // More rounded
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  leftContent: { flex: 1 },
  className: { fontSize: 24, color: colors.black, fontFamily: fonts.serif, marginBottom: 4, letterSpacing: -0.5 },
  instructor: { fontSize: 14, color: 'rgba(0,0,0,0.5)', fontFamily: fonts.sans, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  time: { fontSize: 16, color: colors.black, fontFamily: fonts.sans, fontWeight: '500' },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.black,
    borderRadius: 8, // Soft button
    minWidth: 100,
    alignItems: 'center',
  },
  buttonPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  buttonBooked: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(0,0,0,0.2)' },
  buttonDisabled: { backgroundColor: 'rgba(0,0,0,0.1)' },
  buttonText: { fontSize: 12, fontWeight: '600', color: colors.white, fontFamily: fonts.sans, letterSpacing: 1 },
  buttonTextDisabled: { color: 'rgba(0,0,0,0.3)' },
});
