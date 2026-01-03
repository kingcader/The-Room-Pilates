-- Quick fix: Set blakeleygarrett@gmail.com as admin
-- Run this in your Supabase SQL Editor

UPDATE public.users 
SET is_admin = true 
WHERE email = 'blakeleygarrett@gmail.com';

-- Verify it worked
SELECT email, is_admin FROM public.users WHERE email = 'blakeleygarrett@gmail.com';
