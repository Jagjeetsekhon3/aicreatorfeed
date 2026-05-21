-- ============================================
-- Run in Supabase → SQL Editor
-- ============================================

-- 1. Add verified + is_official columns to profiles
alter table public.profiles
  add column if not exists is_verified boolean default false,
  add column if not exists is_official boolean default false,
  add column if not exists verified_at  timestamptz;

-- 2. Create the official AiCreatorFeed platform account
-- First create auth user via Supabase Dashboard → Authentication → Users → Add user
-- Email: official@aicreatorfeed.com  Password: (set a strong one)
-- Then run the INSERT below with the user ID from that auth user:

-- INSERT INTO public.profiles (id, username, full_name, bio, is_verified, is_official)
-- VALUES (
--   'PASTE-AUTH-USER-ID-HERE',
--   'aicreatorfeed',
--   'AiCreatorFeed',
--   'Official account of AiCreatorFeed — Where AI Creators Connect 🤖✨',
--   true,
--   true
-- );

-- 3. Allow profile owners to update their own row (already exists, just confirming)
-- Policy already created in main schema

-- 4. Allow admin to update any profile (via service role - no policy needed)
