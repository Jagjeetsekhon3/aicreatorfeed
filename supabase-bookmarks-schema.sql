-- ─── BOOKMARKS ───────────────────────────────────────────────────────────────
-- Run this in Supabase SQL editor

create table if not exists public.bookmarks (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  post_id     uuid references public.posts(id) on delete cascade not null,
  created_at  timestamptz default now(),
  unique(user_id, post_id)
);

alter table public.bookmarks enable row level security;

create policy "Users can manage own bookmarks"
  on public.bookmarks for all
  using (auth.uid() = user_id);

create index if not exists bookmarks_user_id_idx on public.bookmarks(user_id);
create index if not exists bookmarks_post_id_idx on public.bookmarks(post_id);
