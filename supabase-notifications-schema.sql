-- ============================================
-- AiCreatorFeed — Notifications Schema
-- Run in Supabase Dashboard → SQL Editor
-- ============================================

create table if not exists public.notifications (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,  -- who receives
  actor_id    uuid references public.profiles(id) on delete cascade not null,  -- who triggered
  type        text not null check (type in ('follow', 'like', 'comment', 'reply', 'mention')),
  post_id     uuid references public.posts(id) on delete cascade,
  comment_id  uuid references public.comments(id) on delete cascade,
  message     text,
  read        boolean default false,
  created_at  timestamptz default now()
);

-- Index for fast unread count
create index if not exists notifications_user_id_read_idx on public.notifications(user_id, read);
create index if not exists notifications_user_id_created_idx on public.notifications(user_id, created_at desc);

-- RLS
alter table public.notifications enable row level security;
create policy "Users see own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "System can insert notifications" on public.notifications for insert with check (true);
create policy "Users can update own notifications" on public.notifications for update using (auth.uid() = user_id);

-- Enable realtime
alter publication supabase_realtime add table public.notifications;
