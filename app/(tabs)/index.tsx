import { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase, User, Booking } from '@/lib/supabase';
import { colors, fonts } from '@/lib/theme';

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [nextReservation, setNextReservation] = useState<Booking | null>(null);
  const [classesCompleted, setClassesCompleted] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error:', authError);
        setLoading(false);
        return;
      }

      if (authUser) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
        
        if (userError) {
          console.error('Error loading user:', userError);
        } else if (userData) {
          setUser(userData);
        }

        const { data: nextBooking, error: bookingError } = await supabase
          .from('bookings')
          .select(`*, schedule:schedule_id (start_time, instructor_name, classes:class_id (name))`)
          .eq('user_id', authUser.id)
          .eq('status', 'confirmed')
          .gte('schedule.start_time', new Date().toISOString())
          .order('schedule(start_time)', { ascending: true })
          .limit(1)
          .maybeSingle();
        
        if (!bookingError && nextBooking) {
          setNextReservation(nextBooking as any);
        }

        const { count, error: countError } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', authUser.id)
          .eq('status', 'completed');
        
        if (!countError) {
          setClassesCompleted(count || 0);
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNextClassTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.black} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.welcomeSubtitle}>WELCOME BACK</Text>
          <Text style={styles.welcomeTitle}>{user?.full_name?.split(' ')[0] || 'GUEST'}</Text>
        </View>

        <View style={styles.statsRow}>
          <Pressable style={({ pressed }) => [styles.statBox, pressed && styles.pressed]}>
            <Text style={styles.statNumber}>{classesCompleted}</Text>
            <Text style={styles.statLabel}>CLASSES{'\n'}COMPLETED</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.statBox, pressed && styles.pressed]}>
            <Text style={styles.statNumber}>{user?.credits_remaining || 0}</Text>
            <Text style={styles.statLabel}>CREDITS{'\n'}REMAINING</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>UPCOMING</Text>
          {nextReservation ? (
            <Pressable style={({ pressed }) => [styles.reservationCard, pressed && styles.pressed]}>
              <Text style={styles.reservationClass}>{nextReservation.schedule?.classes?.name}</Text>
              <Text style={styles.reservationTime}>{formatNextClassTime(nextReservation.schedule?.start_time || '')}</Text>
              <Text style={styles.reservationInstructor}>with {nextReservation.schedule?.instructor_name}</Text>
            </Pressable>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No upcoming classes</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  centered: { alignItems: 'center', justifyContent: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  header: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 32 },
  welcomeSubtitle: { color: 'rgba(0,0,0,0.5)', fontSize: 12, fontFamily: fonts.sans, letterSpacing: 2, marginBottom: 8 },
  welcomeTitle: { color: colors.black, fontSize: 48, fontFamily: fonts.serif },
  statsRow: { flexDirection: 'row', paddingHorizontal: 24, marginBottom: 48, gap: 16 },
  statBox: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 24,
    borderRadius: 16, // More rounded
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] }, // Interaction effect
  statNumber: { fontSize: 42, fontFamily: fonts.serif, color: colors.black, marginBottom: 8 },
  statLabel: { fontSize: 10, fontFamily: fonts.sans, color: 'rgba(0,0,0,0.5)', textAlign: 'center', letterSpacing: 1, lineHeight: 14 },
  section: { paddingHorizontal: 24 },
  sectionTitle: { fontSize: 12, fontFamily: fonts.sans, letterSpacing: 2, color: 'rgba(0,0,0,0.5)', marginBottom: 16 },
  reservationCard: {
    backgroundColor: colors.black,
    padding: 32,
    borderRadius: 16, // More rounded
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  reservationClass: { color: colors.white, fontSize: 32, fontFamily: fonts.serif, marginBottom: 8 },
  reservationTime: { color: 'rgba(255,255,255,0.8)', fontSize: 16, fontFamily: fonts.sans, marginBottom: 4 },
  reservationInstructor: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontFamily: fonts.sans, textTransform: 'uppercase', letterSpacing: 1 },
  emptyCard: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
    borderRadius: 16, // More rounded
  },
  emptyText: { color: 'rgba(0,0,0,0.4)', fontFamily: fonts.serif, fontSize: 16, fontStyle: 'italic' },
});
