import { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase, User, Booking } from '@/lib/supabase';
import { colors, fonts } from '@/lib/theme';

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: userData } = await supabase.from('users').select('*').eq('id', authUser.id).single();
        if (userData) setUser(userData);
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select(`*, schedule:schedule_id(start_time, instructor_name, classes:class_id(name))`)
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false })
          .limit(20);
        if (bookingsData) setBookings(bookingsData as any);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HISTORY</Text>
          {bookings.length === 0 ? (
            <Text style={styles.emptyText}>No class history</Text>
          ) : (
            bookings.map((booking) => (
              <View key={booking.id} style={styles.historyRow}>
                <View>
                  <Text style={styles.historyClass}>{booking.schedule?.classes?.name}</Text>
                  <Text style={styles.historyDate}>{formatDate(booking.schedule?.start_time || '')}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{booking.status.toUpperCase()}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.footer}>
          <Pressable 
            onPress={handleSignOut} 
            style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}
          >
            <Text style={styles.signOutText}>SIGN OUT</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 48, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  title: { fontSize: 42, fontFamily: fonts.serif, color: colors.black, marginBottom: 8 },
  subtitle: { fontSize: 14, fontFamily: fonts.sans, color: 'rgba(0,0,0,0.5)' },
  section: { padding: 24 },
  sectionTitle: { fontSize: 12, fontFamily: fonts.sans, letterSpacing: 2, color: 'rgba(0,0,0,0.4)', marginBottom: 24 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  historyClass: { fontSize: 18, fontFamily: fonts.serif, color: colors.black, marginBottom: 4 },
  historyDate: { fontSize: 12, fontFamily: fonts.sans, color: 'rgba(0,0,0,0.5)' },
  statusBadge: { backgroundColor: 'rgba(0,0,0,0.05)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8 },
  statusText: { fontSize: 10, fontFamily: fonts.sans, letterSpacing: 1, color: colors.black },
  emptyText: { fontFamily: fonts.serif, fontStyle: 'italic', color: 'rgba(0,0,0,0.4)' },
  footer: { padding: 24 },
  signOutButton: { borderWidth: 1, borderColor: colors.black, paddingVertical: 16, alignItems: 'center', borderRadius: 8 },
  pressed: { opacity: 0.6, transform: [{ scale: 0.99 }] },
  signOutText: { color: colors.black, fontSize: 12, fontFamily: fonts.sans, letterSpacing: 1, fontWeight: '600' },
});
