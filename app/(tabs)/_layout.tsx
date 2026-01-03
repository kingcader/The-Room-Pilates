import { Tabs } from 'expo-router';
import { Text, View, StyleSheet, Platform } from 'react-native';
import { colors, fonts } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

function TabLabel({ name, focused }: { name: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[
        styles.tabText, 
        focused ? styles.tabTextActive : styles.tabTextInactive
      ]}>
        {name}
      </Text>
      {focused && <View style={styles.activeDot} />}
    </View>
  );
}

export default function TabLayout() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => checkAdmin());
    return () => subscription.unsubscribe();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('users').select('is_admin').eq('id', user.id).single();
      setIsAdmin(data?.is_admin || false);
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // Hide default labels to use custom component
        tabBarStyle: {
          backgroundColor: colors.cream,
          borderTopColor: 'rgba(0,0,0,0.05)',
          borderTopWidth: 1,
          height: 80, // Taller for elegance
          paddingHorizontal: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabLabel name="HOME" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          tabBarIcon: ({ focused }) => <TabLabel name="SCHEDULE" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          tabBarIcon: ({ focused }) => <TabLabel name="SHOP" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabLabel name="PROFILE" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ focused }) => <TabLabel name="ADMIN" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingTop: 12,
  },
  tabText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.black,
    fontWeight: '700',
  },
  tabTextInactive: {
    color: 'rgba(0,0,0,0.4)',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.black,
    marginTop: 6,
  },
});
