import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// These MUST be set in Vercel environment variables for the app to work
// Using placeholder values to allow build to complete - will be overridden by env vars
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database Types
export type User = {
  id: string;
  email: string;
  full_name: string | null;
  credits_remaining: number;
  membership_type: 'unlimited' | '3_times_weekly' | '2_times_weekly' | 'none';
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

export type Class = {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  created_at: string;
};

export type ScheduleItem = {
  id: string;
  class_id: string;
  start_time: string;
  instructor_name: string;
  created_at: string;
  classes?: Class;
};

export type Booking = {
  id: string;
  user_id: string;
  schedule_id: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  created_at: string;
  schedule?: ScheduleItem & { classes?: Class };
};

export type Product = {
  id: string;
  name: string;
  price: number;
  type: 'subscription' | 'pack' | 'drop_in';
  description: string | null;
  credits_included: number;
  created_at: string;
};

