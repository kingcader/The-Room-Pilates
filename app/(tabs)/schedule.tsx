import { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase, ScheduleItem, User } from '@/lib/supabase';
import { colors, fonts } from '@/lib/theme';
import CalendarStrip from '@/components/CalendarStrip';
import ClassCard from '@/components/ClassCard';

export default function ScheduleScreen() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [classes, setClasses] = useState<(ScheduleItem & { classes?: { name: string; description: string | null } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    loadClasses();
  }, [selectedDate]);

  const loadUser = async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error:', authError);
        return;
      }

      if (authUser) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (error) {
          console.error('Error loading user:', error);
        } else if (data) {
          setUser(data);
        }
      }
    } catch (error) {
      console.error('Unexpected error loading user:', error);
    }
  };

  const loadClasses = async () => {
    setLoading(true);
    try {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('schedule')
        .select(`
          *,
          classes (
            name,
            description
          )
        `)
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;
      setClasses(data || []);

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        const scheduleIds = (data || []).map((item) => item.id);
        if (scheduleIds.length > 0) {
          const { data: bookingsData, error: bookingsError } = await supabase
            .from('bookings')
            .select('schedule_id')
            .eq('user_id', authUser.id)
            .eq('status', 'confirmed')
            .in('schedule_id', scheduleIds);

          if (!bookingsError && bookingsData) {
            setBookings(new Set(bookingsData.map((b) => b.schedule_id)));
          }
        }
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      Alert.alert('Error', 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (scheduleId: string) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { Alert.alert('Error', 'Please sign in'); return; }
      if (!user) { Alert.alert('Error', 'User data not loaded'); return; }

      const hasCredits = user.membership_type === 'unlimited' || user.credits_remaining > 0;
      if (!hasCredits) {
        Alert.alert('No Credits', 'Please purchase a membership or class pack.');
        return;
      }

      const { error: bookingError } = await supabase.from('bookings').insert({
        user_id: authUser.id,
        schedule_id: scheduleId,
        status: 'confirmed',
      });

      if (bookingError) {
        if (bookingError.code === '23505') Alert.alert('Already Booked', 'You have already booked this class.');
        else throw bookingError;
        return;
      }

      if (user.membership_type !== 'unlimited' && user.credits_remaining > 0) {
        await supabase.from('users').update({ credits_remaining: user.credits_remaining - 1 }).eq('id', authUser.id);
        loadUser();
      }

      loadClasses();
      Alert.alert('Success', 'Class booked successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to book class');
    }
  };

  const formatDateHeader = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const canBook = (): boolean => {
    if (!user) return false;
    return user.membership_type === 'unlimited' || user.credits_remaining > 0;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Schedule</Text>
          <Text style={styles.subtitle}>{formatDateHeader(selectedDate)}</Text>
        </View>

        <CalendarStrip selectedDate={selectedDate} onDateSelect={setSelectedDate} />

        <ScrollView
          style={styles.classList}
          contentContainerStyle={styles.classListContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.black} />
            </View>
          ) : classes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No classes scheduled</Text>
            </View>
          ) : (
            classes.map((scheduleItem) => (
              <ClassCard
                key={scheduleItem.id}
                scheduleItem={scheduleItem}
                onBook={() => handleBook(scheduleItem.id)}
                isBookable={canBook()}
                isBooked={bookings.has(scheduleItem.id)}
              />
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: colors.cream,
  },
  title: {
    color: colors.black,
    fontSize: 42,
    fontFamily: fonts.serif,
    letterSpacing: -1,
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgba(0,0,0,0.5)',
    fontSize: 16,
    fontFamily: fonts.serif,
    fontStyle: 'italic',
  },
  classList: {
    flex: 1,
    paddingHorizontal: 16, // Tighter padding for cards
  },
  classListContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: 'rgba(0,0,0,0.4)',
    fontSize: 16,
    fontFamily: fonts.serif,
    fontStyle: 'italic',
  },
});
