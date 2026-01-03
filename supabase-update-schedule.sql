-- Run this in your Supabase SQL Editor to update the schedule times

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
    -- Get class IDs
    SELECT id INTO sculpt_id FROM public.classes WHERE name = 'Sculpt Pilates';
    SELECT id INTO mat_id FROM public.classes WHERE name = 'Mat Pilates';
    SELECT id INTO red_light_id FROM public.classes WHERE name = 'Red Light Pilates';

    -- Clear future schedule (from tomorrow)
    DELETE FROM public.schedule WHERE start_time >= (CURRENT_DATE + INTERVAL '1 day');

    -- Generate for next 30 days
    FOR i IN 1..30 LOOP
        loop_date := CURRENT_DATE + (i * INTERVAL '1 day');
        day_of_week := EXTRACT(DOW FROM loop_date); -- 0=Sun, 6=Sat

        -- Mon(1) to Fri(5) only
        IF day_of_week BETWEEN 1 AND 5 THEN
            -- 7:30 AM - Sculpt Pilates
            class_time := (loop_date::TEXT || ' 07:30:00')::TIMESTAMP WITH TIME ZONE;
            INSERT INTO public.schedule (class_id, start_time, instructor_name)
            VALUES (sculpt_id, class_time, 'Sarah Johnson');

            -- 12:00 PM - Mat Pilates
            class_time := (loop_date::TEXT || ' 12:00:00')::TIMESTAMP WITH TIME ZONE;
            INSERT INTO public.schedule (class_id, start_time, instructor_name)
            VALUES (mat_id, class_time, 'Emma Davis');

            -- 4:00 PM - Red Light Pilates
            class_time := (loop_date::TEXT || ' 16:00:00')::TIMESTAMP WITH TIME ZONE;
            INSERT INTO public.schedule (class_id, start_time, instructor_name)
            VALUES (red_light_id, class_time, 'Michael Chen');
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the update
SELECT regenerate_schedule_v3();
