-- ============================================
-- AiCreatorFeed — Admin Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================

-- Site settings (colors, logo, tagline, etc.)
create table if not exists public.site_settings (
  key   text primary key,
  value text not null,
  updated_at timestamptz default now()
);

-- Insert default settings
insert into public.site_settings (key, value) values
  ('accent_color',    '#FF6D1F'),
  ('bg_color',        '#222222'),
  ('text_primary',    '#FAF3E1'),
  ('site_name',       'AiCreatorFeed'),
  ('tagline',         'Where AI Creators Connect'),
  ('maintenance_mode','false'),
  ('allow_signups',   'true'),
  ('allow_posts',     'true'),
  ('allow_comments',  'true'),
  ('require_approval','false')
on conflict (key) do nothing;

-- Feature flags
create table if not exists public.feature_flags (
  id         uuid default uuid_generate_v4() primary key,
  name       text unique not null,
  enabled    boolean default true,
  description text,
  updated_at timestamptz default now()
);

insert into public.feature_flags (name, enabled, description) values
  ('feed',        true, 'Main feed page'),
  ('explore',     true, 'Explore/discover page'),
  ('tutorials',   true, 'Tutorials page'),
  ('news',        true, 'AI News page'),
  ('community',   true, 'Community page'),
  ('post_images', true, 'Allow image uploads on posts'),
  ('post_videos', true, 'Allow YouTube video embeds'),
  ('post_prompts',true, 'Allow AI prompt sharing'),
  ('follow',      true, 'Follow/unfollow system'),
  ('likes',       true, 'Like posts'),
  ('comments',    true, 'Comment on posts')
on conflict (name) do nothing;

-- Support tickets
create table if not exists public.support_tickets (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete set null,
  user_email  text not null,
  subject     text not null,
  message     text not null,
  status      text default 'open' check (status in ('open','in_progress','resolved','closed')),
  priority    text default 'normal' check (priority in ('low','normal','high','urgent')),
  admin_reply text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Admin activity log
create table if not exists public.admin_logs (
  id         uuid default uuid_generate_v4() primary key,
  action     text not null,
  details    text,
  created_at timestamptz default now()
);

-- RLS — only accessible via service role (admin uses server-side only)
alter table public.site_settings   enable row level security;
alter table public.feature_flags   enable row level security;
alter table public.support_tickets enable row level security;
alter table public.admin_logs      enable row level security;

-- Public can read site settings and feature flags
create policy "Site settings public read"  on public.site_settings   for select using (true);
create policy "Feature flags public read"  on public.feature_flags   for select using (true);

-- Users can create tickets
create policy "Users can create tickets"   on public.support_tickets for insert with check (true);
create policy "Users can view own tickets" on public.support_tickets for select using (auth.uid() = user_id);
