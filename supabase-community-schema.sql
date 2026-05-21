-- ============================================
-- AiCreatorFeed — Community Spaces Schema
-- Run in Supabase Dashboard → SQL Editor
-- ============================================

-- Spaces (communities)
create table if not exists public.spaces (
  id           uuid default uuid_generate_v4() primary key,
  name         text unique not null,           -- e.g. "midjourney"
  display_name text not null,                  -- e.g. "Midjourney"
  description  text,
  icon         text default '🤖',
  cover_color  text default '#FF6D1F',
  created_by   uuid references public.profiles(id) on delete set null,
  member_count int default 0,
  post_count   int default 0,
  is_official  boolean default false,          -- admin-created official spaces
  is_private   boolean default false,
  rules        text,
  created_at   timestamptz default now()
);

-- Space memberships
create table if not exists public.space_members (
  space_id   uuid references public.spaces(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete cascade,
  role       text default 'member' check (role in ('member', 'moderator', 'owner')),
  joined_at  timestamptz default now(),
  primary key (space_id, user_id)
);

-- Space posts (text-only discussions)
create table if not exists public.space_posts (
  id           uuid default uuid_generate_v4() primary key,
  space_id     uuid references public.spaces(id) on delete cascade not null,
  user_id      uuid references public.profiles(id) on delete cascade not null,
  title        text not null,
  content      text not null,
  upvotes      int default 0,
  reply_count  int default 0,
  is_pinned    boolean default false,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Space post replies (threaded)
create table if not exists public.space_replies (
  id           uuid default uuid_generate_v4() primary key,
  post_id      uuid references public.space_posts(id) on delete cascade not null,
  user_id      uuid references public.profiles(id) on delete cascade not null,
  content      text not null,
  parent_id    uuid references public.space_replies(id) on delete cascade,
  upvotes      int default 0,
  created_at   timestamptz default now()
);

-- Upvotes on space posts
create table if not exists public.space_post_votes (
  post_id  uuid references public.space_posts(id) on delete cascade,
  user_id  uuid references public.profiles(id) on delete cascade,
  primary key (post_id, user_id)
);

-- Upvotes on replies
create table if not exists public.space_reply_votes (
  reply_id uuid references public.space_replies(id) on delete cascade,
  user_id  uuid references public.profiles(id) on delete cascade,
  primary key (reply_id, user_id)
);

-- RLS
alter table public.spaces            enable row level security;
alter table public.space_members     enable row level security;
alter table public.space_posts       enable row level security;
alter table public.space_replies     enable row level security;
alter table public.space_post_votes  enable row level security;
alter table public.space_reply_votes enable row level security;

create policy "Spaces public read"         on public.spaces            for select using (true);
create policy "Users can create spaces"    on public.spaces            for insert with check (auth.uid() = created_by);
create policy "Owners can update spaces"   on public.spaces            for update using (auth.uid() = created_by);
create policy "Members public read"        on public.space_members     for select using (true);
create policy "Users can join spaces"      on public.space_members     for insert with check (auth.uid() = user_id);
create policy "Users can leave spaces"     on public.space_members     for delete using (auth.uid() = user_id);
create policy "Space posts public read"    on public.space_posts       for select using (true);
create policy "Members can post"           on public.space_posts       for insert with check (auth.uid() = user_id);
create policy "Authors can update posts"   on public.space_posts       for update using (auth.uid() = user_id);
create policy "Authors can delete posts"   on public.space_posts       for delete using (auth.uid() = user_id);
create policy "Replies public read"        on public.space_replies     for select using (true);
create policy "Users can reply"            on public.space_replies     for insert with check (auth.uid() = user_id);
create policy "Authors can delete replies" on public.space_replies     for delete using (auth.uid() = user_id);
create policy "Votes public read"          on public.space_post_votes  for select using (true);
create policy "Users can vote"             on public.space_post_votes  for insert with check (auth.uid() = user_id);
create policy "Users can unvote"           on public.space_post_votes  for delete using (auth.uid() = user_id);
create policy "Reply votes public read"    on public.space_reply_votes for select using (true);
create policy "Users can vote replies"     on public.space_reply_votes for insert with check (auth.uid() = user_id);
create policy "Users can unvote replies"   on public.space_reply_votes for delete using (auth.uid() = user_id);

-- Seed official spaces
insert into public.spaces (name, display_name, description, icon, cover_color, is_official) values
  ('general',           'General',              'General AI discussion for everyone',                    '💬', '#FF6D1F', true),
  ('midjourney',        'Midjourney',           'Tips, prompts and showcases for Midjourney users',      '🎨', '#7c3aed', true),
  ('stable-diffusion',  'Stable Diffusion',     'Everything about Stable Diffusion and ComfyUI',         '⚡', '#0891b2', true),
  ('sora-runway',       'Sora & Runway',         'AI video generation discussion',                        '🎬', '#dc2626', true),
  ('prompt-engineering','Prompt Engineering',   'Master the art of writing AI prompts',                  '✦',  '#059669', true),
  ('ai-news',           'AI News & Updates',    'Latest news from the world of AI',                      '📰', '#d97706', true),
  ('showcase',          'Showcase',             'Share your best AI creations',                          '🏆', '#FF6D1F', true),
  ('help',              'Help & Support',       'Ask questions, get help from the community',            '🙋', '#6366f1', true)
on conflict (name) do nothing;
