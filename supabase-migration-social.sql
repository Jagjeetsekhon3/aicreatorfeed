-- Run this in Supabase Dashboard → SQL Editor
-- Adds social link columns to profiles table

alter table public.profiles
  add column if not exists twitter   text,
  add column if not exists instagram text,
  add column if not exists youtube   text;

-- Also make sure avatars storage bucket exists and is public
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload their own avatar
create policy "Users can upload own avatar"
on storage.objects for insert
with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Avatars are public"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "Users can update own avatar"
on storage.objects for update
using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
