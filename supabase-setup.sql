-- ============================================
-- THE ROOM - Supabase Database Setup Script
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    credits_remaining INTEGER DEFAULT 0,
    membership_type TEXT CHECK (membership_type IN ('unlimited', '3_times_weekly', '2_times_weekly', 'none')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Classes table
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    capacity INTEGER DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Schedule table (specific class instances)
CREATE TABLE public.schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    instructor_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Bookings table
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    schedule_id UUID NOT NULL REFERENCES public.schedule(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, schedule_id)
);

-- Products table (memberships and class packs)
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('subscription', 'pack', 'drop_in')),
    description TEXT,
    credits_included INTEGER DEFAULT 0, -- For packs, how many credits
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_schedule_start_time ON public.schedule(start_time);
CREATE INDEX idx_schedule_class_id ON public.schedule(class_id);
CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_schedule_id ON public.bookings(schedule_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Users: Users can read/update their own data
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Classes: Everyone can read
CREATE POLICY "Anyone can view classes" ON public.classes
    FOR SELECT USING (true);

-- Schedule: Everyone can read
CREATE POLICY "Anyone can view schedule" ON public.schedule
    FOR SELECT USING (true);

-- Bookings: Users can manage their own bookings
CREATE POLICY "Users can view own bookings" ON public.bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings" ON public.bookings
    FOR UPDATE USING (auth.uid() = user_id);

-- Products: Everyone can read
CREATE POLICY "Anyone can view products" ON public.products
    FOR SELECT USING (true);

-- ============================================
-- SEED DATA
-- ============================================

-- Insert Classes
INSERT INTO public.classes (name, description, capacity) VALUES
    ('Sculpt Pilates', 'Intensive strength-building Pilates class focusing on toning and sculpting.', 15),
    ('Mat Pilates', 'Traditional mat-based Pilates focusing on core strength and flexibility.', 15),
    ('Red Light Pilates', 'Pilates session with red light therapy for recovery and enhanced performance.', 12);

-- Insert Products (Memberships & Packs)
INSERT INTO public.products (name, price, type, description, credits_included) VALUES
    ('Unlimited', 100.00, 'subscription', 'Unlimited monthly classes', 999),
    ('3 Times Weekly', 85.00, 'subscription', 'Up to 12 classes per month', 12),
    ('2 Times Weekly', 75.00, 'subscription', 'Up to 8 classes per month', 8),
    ('Drop In', 20.00, 'drop_in', 'Single class pass', 1),
    ('5 Class Pack', 60.00, 'pack', '5 class credits', 5),
    ('10 Class Pack', 110.00, 'pack', '10 class credits', 10);

-- ============================================
-- FUNCTION: Generate Weekly Schedule
-- ============================================
-- This function generates schedule entries for the next 4 weeks
-- Run this function after inserting classes

CREATE OR REPLACE FUNCTION generate_weekly_schedule(start_date DATE DEFAULT CURRENT_DATE)
RETURNS void AS $$
DECLARE
    sculpt_class_id UUID;
    mat_class_id UUID;
    red_light_class_id UUID;
    loop_date DATE;
    class_time TIMESTAMP WITH TIME ZONE;
    day_of_week INTEGER;
BEGIN
    -- Get class IDs
    SELECT id INTO sculpt_class_id FROM public.classes WHERE name = 'Sculpt Pilates';
    SELECT id INTO mat_class_id FROM public.classes WHERE name = 'Mat Pilates';
    SELECT id INTO red_light_class_id FROM public.classes WHERE name = 'Red Light Pilates';

    -- Generate schedule for the next 4 weeks (28 days)
    FOR i IN 0..27 LOOP
        loop_date := start_date + (i * INTERVAL '1 day');
        day_of_week := EXTRACT(DOW FROM loop_date); -- 0=Sunday, 1=Monday, etc.

        -- Monday, Wednesday, Friday schedule
        IF day_of_week IN (1, 3, 5) THEN
            -- 7:30 AM - Sculpt Pilates
            class_time := (loop_date::TEXT || ' 07:30:00')::TIMESTAMP WITH TIME ZONE;
            INSERT INTO public.schedule (class_id, start_time, instructor_name)
            VALUES (sculpt_class_id, class_time, 'Sarah Johnson');

            -- 12:00 PM - Mat Pilates
            class_time := (loop_date::TEXT || ' 12:00:00')::TIMESTAMP WITH TIME ZONE;
            INSERT INTO public.schedule (class_id, start_time, instructor_name)
            VALUES (mat_class_id, class_time, 'Emma Davis');

            -- 4:00 PM - Red Light Pilates
            class_time := (loop_date::TEXT || ' 16:00:00')::TIMESTAMP WITH TIME ZONE;
            INSERT INTO public.schedule (class_id, start_time, instructor_name)
            VALUES (red_light_class_id, class_time, 'Michael Chen');
        END IF;

        -- Tuesday, Thursday schedule
        IF day_of_week IN (2, 4) THEN
            -- 7:30 AM - Mat Pilates
            class_time := (loop_date::TEXT || ' 07:30:00')::TIMESTAMP WITH TIME ZONE;
            INSERT INTO public.schedule (class_id, start_time, instructor_name)
            VALUES (mat_class_id, class_time, 'Emma Davis');

            -- 12:00 PM - Sculpt Pilates
            class_time := (loop_date::TEXT || ' 12:00:00')::TIMESTAMP WITH TIME ZONE;
            INSERT INTO public.schedule (class_id, start_time, instructor_name)
            VALUES (sculpt_class_id, class_time, 'Sarah Johnson');

            -- 4:00 PM - Red Light Pilates
            class_time := (loop_date::TEXT || ' 16:00:00')::TIMESTAMP WITH TIME ZONE;
            INSERT INTO public.schedule (class_id, start_time, instructor_name)
            VALUES (red_light_class_id, class_time, 'Michael Chen');
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to generate initial schedule
SELECT generate_weekly_schedule();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to automatically create user record when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, credits_remaining, membership_type)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        0,
        'none'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user record on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

