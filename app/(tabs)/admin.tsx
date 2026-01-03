import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase, User } from '@/lib/supabase';
import { colors, fonts } from '@/lib/theme';

type AdminTab = 'users' | 'schedule' | 'bookings';

export default function AdminScreen() {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'users') loadUsers();
      if (activeTab === 'schedule') loadSchedule();
      if (activeTab === 'bookings') loadBookings();
    }
  }, [activeTab, isAdmin]);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('users').select('is_admin').eq('id', user.id).single();
      setIsAdmin(data?.is_admin || false);
    }
    setLoading(false);
  };

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  const loadSchedule = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('schedule')
      .select('*, classes(name)')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(50);
    setSchedule(data || []);
    setLoading(false);
  };

  const loadBookings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('bookings')
      .select('*, users(full_name, email), schedule(start_time, classes(name))')
      .order('created_at', { ascending: false })
      .limit(50);
    setBookings(data || []);
    setLoading(false);
  };

  const updateCredits = async (userId: string, newCredits: number) => {
    const { error } = await supabase.from('users').update({ credits_remaining: newCredits }).eq('id', userId);
    if (error) Alert.alert('Error', error.message);
    else loadUsers();
  };

  const toggleAdmin = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase.from('users').update({ is_admin: !currentStatus }).eq('id', userId);
    if (error) Alert.alert('Error', error.message);
    else loadUsers();
  };

  const deleteScheduleItem = async (id: string) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('schedule').delete().eq('id', id);
        loadSchedule();
      }}
    ]);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  };

  if (loading && !isAdmin) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.black} />
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={styles.accessDenied}>Access Denied</Text>
        <Text style={styles.accessDeniedSub}>Admin privileges required</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin</Text>
      </View>

      <View style={styles.tabs}>
        {(['users', 'schedule', 'bookings'] as AdminTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.black} style={{ marginTop: 40 }} />
        ) : activeTab === 'users' ? (
          users.map((user) => (
            <View key={user.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{user.full_name || 'No Name'}</Text>
                {user.is_admin && <Text style={styles.adminBadge}>ADMIN</Text>}
              </View>
              <Text style={styles.cardSubtitle}>{user.email}</Text>
              <View style={styles.cardRow}>
                <Text style={styles.label}>Credits:</Text>
                <View style={styles.creditsInput}>
                  <TouchableOpacity 
                    style={styles.creditBtn}
                    onPress={() => updateCredits(user.id, Math.max(0, user.credits_remaining - 1))}
                  >
                    <Text style={styles.creditBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.creditsValue}>{user.credits_remaining}</Text>
                  <TouchableOpacity 
                    style={styles.creditBtn}
                    onPress={() => updateCredits(user.id, user.credits_remaining + 1)}
                  >
                    <Text style={styles.creditBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.label}>Membership:</Text>
                <Text style={styles.value}>{user.membership_type}</Text>
              </View>
              <TouchableOpacity 
                style={styles.toggleBtn}
                onPress={() => toggleAdmin(user.id, user.is_admin)}
              >
                <Text style={styles.toggleBtnText}>
                  {user.is_admin ? 'REMOVE ADMIN' : 'MAKE ADMIN'}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        ) : activeTab === 'schedule' ? (
          schedule.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.cardTitle}>{item.classes?.name}</Text>
              <Text style={styles.cardSubtitle}>{formatDateTime(item.start_time)}</Text>
              <Text style={styles.cardDetail}>Instructor: {item.instructor_name}</Text>
              <TouchableOpacity 
                style={styles.deleteBtn}
                onPress={() => deleteScheduleItem(item.id)}
              >
                <Text style={styles.deleteBtnText}>DELETE</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          bookings.map((booking) => (
            <View key={booking.id} style={styles.card}>
              <Text style={styles.cardTitle}>{booking.users?.full_name || booking.users?.email}</Text>
              <Text style={styles.cardSubtitle}>
                {booking.schedule?.classes?.name} - {formatDateTime(booking.schedule?.start_time)}
              </Text>
              <View style={[styles.statusBadge, booking.status === 'confirmed' && styles.statusConfirmed]}>
                <Text style={styles.statusText}>{booking.status.toUpperCase()}</Text>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 42,
    fontFamily: fonts.serif,
    color: colors.black,
  },
  accessDenied: {
    fontSize: 24,
    fontFamily: fonts.serif,
    color: colors.black,
    marginBottom: 8,
  },
  accessDeniedSub: {
    fontSize: 14,
    fontFamily: fonts.sans,
    color: 'rgba(0,0,0,0.5)',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.black,
  },
  tabText: {
    fontSize: 12,
    fontFamily: fonts.sans,
    letterSpacing: 1,
    color: 'rgba(0,0,0,0.4)',
  },
  tabTextActive: {
    color: colors.black,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  card: {
    backgroundColor: colors.white,
    padding: 20,
    marginBottom: 12,
    borderRadius: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: fonts.serif,
    color: colors.black,
    flex: 1,
  },
  adminBadge: {
    fontSize: 10,
    fontFamily: fonts.sans,
    letterSpacing: 1,
    color: colors.white,
    backgroundColor: colors.black,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: fonts.sans,
    color: 'rgba(0,0,0,0.5)',
    marginBottom: 12,
  },
  cardDetail: {
    fontSize: 12,
    fontFamily: fonts.sans,
    color: 'rgba(0,0,0,0.6)',
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontFamily: fonts.sans,
    color: 'rgba(0,0,0,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    fontSize: 14,
    fontFamily: fonts.sans,
    color: colors.black,
  },
  creditsInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creditBtn: {
    width: 32,
    height: 32,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditBtnText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  creditsValue: {
    fontSize: 18,
    fontFamily: fonts.sans,
    fontWeight: '600',
    color: colors.black,
    paddingHorizontal: 16,
  },
  toggleBtn: {
    borderWidth: 1,
    borderColor: colors.black,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  toggleBtnText: {
    fontSize: 11,
    fontFamily: fonts.sans,
    letterSpacing: 1,
    color: colors.black,
  },
  deleteBtn: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    paddingVertical: 10,
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: 11,
    fontFamily: fonts.sans,
    letterSpacing: 1,
    color: 'rgb(220, 38, 38)',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
  },
  statusConfirmed: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  statusText: {
    fontSize: 10,
    fontFamily: fonts.sans,
    letterSpacing: 1,
    color: colors.black,
  },
});

