-- =============================================
-- ADMIN SYSTEM SETUP
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Add is_admin column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 2. Set blakeleygarrett@gmail.com as admin
UPDATE public.users 
SET is_admin = true 
WHERE email = 'blakeleygarrett@gmail.com';

-- 3. Update RLS policies to allow admins full access

-- Drop existing policies first (if they exist)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;

-- Users table policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update all users" ON public.users
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    );

-- Schedule table - allow admins to insert/update/delete
DROP POLICY IF EXISTS "Admins can manage schedule" ON public.schedule;
DROP POLICY IF EXISTS "Admins can insert schedule" ON public.schedule;
DROP POLICY IF EXISTS "Admins can update schedule" ON public.schedule;
DROP POLICY IF EXISTS "Admins can delete schedule" ON public.schedule;

CREATE POLICY "Admins can insert schedule" ON public.schedule
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Admins can update schedule" ON public.schedule
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Admins can delete schedule" ON public.schedule
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    );

-- Bookings table - allow admins to view all bookings
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;

CREATE POLICY "Admins can view all bookings" ON public.bookings
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    );

-- 4. Regenerate schedule with correct times
CREATE OR REPLACE FUNCTION regenerate_schedule_v3()
RETURNS void AS $$
DECLARE
    sculpt_id UUID;
    mat_id UUID;
    red_light_id UUID;
    loop_date DATE;
    class_time TIMESTAMP WITH TIME ZONE;
    day_of_week INTEGER;
BEGIN
    SELECT id INTO sculpt_id FROM public.classes WHERE name = 'Sculpt Pilates';
    SELECT id INTO mat_id FROM public.classes WHERE name = 'Mat Pilates';
    SELECT id INTO red_light_id FROM public.classes WHERE name = 'Red Light Pilates';

    DELETE FROM public.schedule WHERE start_time >= (CURRENT_DATE + INTERVAL '1 day');

    FOR i IN 1..30 LOOP
        loop_date := CURRENT_DATE + (i * INTERVAL '1 day');
        day_of_week := EXTRACT(DOW FROM loop_date);

        IF day_of_week BETWEEN 1 AND 5 THEN
            class_time := (loop_date::TEXT || ' 07:30:00')::TIMESTAMP WITH TIME ZONE;
            INSERT INTO public.schedule (class_id, start_time, instructor_name)
            VALUES (sculpt_id, class_time, 'Sarah Johnson');

            class_time := (loop_date::TEXT || ' 12:00:00')::TIMESTAMP WITH TIME ZONE;
            INSERT INTO public.schedule (class_id, start_time, instructor_name)
            VALUES (mat_id, class_time, 'Emma Davis');

            class_time := (loop_date::TEXT || ' 16:00:00')::TIMESTAMP WITH TIME ZONE;
            INSERT INTO public.schedule (class_id, start_time, instructor_name)
            VALUES (red_light_id, class_time, 'Michael Chen');
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

SELECT regenerate_schedule_v3();

-- Verify admin was set
SELECT email, is_admin FROM public.users WHERE email = 'blakeleygarrett@gmail.com';

