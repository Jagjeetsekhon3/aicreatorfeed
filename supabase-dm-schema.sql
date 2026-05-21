-- ============================================
-- AiCreatorFeed — Direct Messages Schema
-- Run in Supabase Dashboard → SQL Editor
-- ============================================

-- Conversations between two users
create table if not exists public.conversations (
  id           uuid default uuid_generate_v4() primary key,
  user1_id     uuid references public.profiles(id) on delete cascade not null,
  user2_id     uuid references public.profiles(id) on delete cascade not null,
  status       text default 'pending' check (status in ('pending', 'accepted', 'blocked')),
  requested_by uuid references public.profiles(id) on delete cascade not null,
  last_message text,
  last_message_at timestamptz default now(),
  user1_unread int default 0,
  user2_unread int default 0,
  created_at   timestamptz default now(),
  unique(user1_id, user2_id),
  check (user1_id < user2_id)  -- enforce consistent ordering
);

-- Messages inside a conversation
create table if not exists public.messages (
  id              uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id       uuid references public.profiles(id) on delete cascade not null,
  content         text not null,
  read            boolean default false,
  created_at      timestamptz default now()
);

-- RLS
alter table public.conversations enable row level security;
alter table public.messages       enable row level security;

-- Users can see their own conversations
create policy "Users can view own conversations"
  on public.conversations for select
  using (auth.uid() = user1_id or auth.uid() = user2_id);

create policy "Users can create conversations"
  on public.conversations for insert
  with check (auth.uid() = user1_id or auth.uid() = user2_id);

create policy "Users can update own conversations"
  on public.conversations for update
  using (auth.uid() = user1_id or auth.uid() = user2_id);

-- Users can see messages in their conversations
create policy "Users can view messages in their conversations"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.user1_id = auth.uid() or c.user2_id = auth.uid())
    )
  );

create policy "Users can send messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

-- Enable realtime for messages and conversations
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;

-- Index for performance
create index if not exists messages_conversation_id_idx on public.messages(conversation_id);
create index if not exists conversations_user1_idx on public.conversations(user1_id);
create index if not exists conversations_user2_idx on public.conversations(user2_id);
