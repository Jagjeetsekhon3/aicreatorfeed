-- ============================================
-- NexusAI — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ─── USERS (extends Supabase auth.users) ───────────────────────────────────
create table public.profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  username      text unique not null,
  full_name     text not null,
  avatar_url    text,          -- Supabase Storage URL
  bio           text,
  website       text,
  followers_count int default 0,
  following_count int default 0,
  posts_count   int default 0,
  created_at    timestamptz default now()
);

-- ─── POSTS ──────────────────────────────────────────────────────────────────
create type media_type as enum ('image', 'video', 'text');

create table public.posts (
  id            uuid default uuid_generate_v4() primary key,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  caption       text not null,
  prompt_text   text,
  media_type    media_type not null default 'image',
  image_url     text,          -- Cloudinary URL (for images)
  video_url     text,          -- YouTube video ID or Cloudinary video URL
  ai_tool       text,          -- "Midjourney", "Sora", etc.
  tags          text[] default '{}',
  likes_count   int default 0,
  comments_count int default 0,
  created_at    timestamptz default now()
);

-- ─── LIKES ──────────────────────────────────────────────────────────────────
create table public.likes (
  user_id  uuid references public.profiles(id) on delete cascade,
  post_id  uuid references public.posts(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, post_id)
);

-- ─── COMMENTS ───────────────────────────────────────────────────────────────
create table public.comments (
  id         uuid default uuid_generate_v4() primary key,
  post_id    uuid references public.posts(id) on delete cascade not null,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  content    text not null,
  created_at timestamptz default now()
);

-- ─── FOLLOWS ────────────────────────────────────────────────────────────────
create table public.follows (
  follower_id  uuid references public.profiles(id) on delete cascade,
  following_id uuid references public.profiles(id) on delete cascade,
  created_at   timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id != following_id)   -- Can't follow yourself
);

-- ─── TUTORIALS ──────────────────────────────────────────────────────────────
create table public.tutorials (
  id                uuid default uuid_generate_v4() primary key,
  title             text not null,
  description       text not null,
  youtube_video_id  text not null,      -- Just the ID e.g. "dQw4w9WgXcQ"
  thumbnail_url     text not null,      -- YouTube thumbnail URL
  duration_minutes  int not null,
  views_count       int default 0,
  tags              text[] default '{}',
  published_at      timestamptz default now()
);

-- ─── NEWS ───────────────────────────────────────────────────────────────────
create table public.news_items (
  id           uuid default uuid_generate_v4() primary key,
  title        text not null,
  summary      text not null,
  source_name  text not null,
  source_url   text not null,
  tags         text[] default '{}',
  published_at timestamptz default now()
);

-- ─── TRIGGERS: auto-update counts ───────────────────────────────────────────

-- Update likes_count when a like is added/removed
create or replace function update_likes_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts set likes_count = likes_count + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update public.posts set likes_count = likes_count - 1 where id = OLD.post_id;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger on_like_change
after insert or delete on public.likes
for each row execute function update_likes_count();

-- Update comments_count
create or replace function update_comments_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts set comments_count = comments_count + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update public.posts set comments_count = comments_count - 1 where id = OLD.post_id;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger on_comment_change
after insert or delete on public.comments
for each row execute function update_comments_count();

-- Update followers/following counts
create or replace function update_follow_counts()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.profiles set followers_count = followers_count + 1 where id = NEW.following_id;
    update public.profiles set following_count = following_count + 1 where id = NEW.follower_id;
  elsif TG_OP = 'DELETE' then
    update public.profiles set followers_count = followers_count - 1 where id = OLD.following_id;
    update public.profiles set following_count = following_count - 1 where id = OLD.follower_id;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger on_follow_change
after insert or delete on public.follows
for each row execute function update_follow_counts();

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;

-- Profiles: anyone can read, only owner can update
create policy "Profiles are public" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Posts: anyone can read, only author can insert/delete
create policy "Posts are public" on public.posts for select using (true);
create policy "Authenticated users can post" on public.posts for insert with check (auth.uid() = user_id);
create policy "Authors can delete own posts" on public.posts for delete using (auth.uid() = user_id);

-- Likes: anyone can read, authenticated users can manage own
create policy "Likes are public" on public.likes for select using (true);
create policy "Users can like" on public.likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike" on public.likes for delete using (auth.uid() = user_id);

-- Comments: anyone can read, authenticated users can write own
create policy "Comments are public" on public.comments for select using (true);
create policy "Authenticated users can comment" on public.comments for insert with check (auth.uid() = user_id);
create policy "Users can delete own comments" on public.comments for delete using (auth.uid() = user_id);

-- Tutorials and news: public read-only (you manage these as admin)
alter table public.tutorials enable row level security;
alter table public.news_items enable row level security;
create policy "Tutorials are public" on public.tutorials for select using (true);
create policy "News is public" on public.news_items for select using (true);


-- ─── CONTACT & SOCIAL SETTINGS (run once) ───────────────────────────────────
insert into public.site_settings (key, value) values
  ('contact_email',        ''),
  ('contact_message',      'Have a question, idea, or issue? We''d love to hear from you. Fill out the form and we''ll get back to you within 24–48 hours.'),
  ('social_twitter',       ''),
  ('social_instagram',     ''),
  ('social_discord',       ''),
  ('social_discord_label', 'Join our server'),
  ('social_youtube',       ''),
  ('social_youtube_label', 'Watch tutorials'),
  ('social_tiktok',        ''),
  ('social_linkedin',      ''),
  ('social_linkedin_label','Connect with us')
on conflict (key) do nothing;
