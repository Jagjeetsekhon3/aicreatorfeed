-- ═══════════════════════════════════════════════════════════
-- AiCreatorFeed — Creator Monetization Migration
-- Run in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- ─── Add creator fields to profiles ─────────────────────────
alter table public.profiles
  add column if not exists is_creator          boolean default false,
  add column if not exists creator_applied_at  timestamptz,
  add column if not exists creator_approved_at timestamptz;

-- ─── Creator Applications ────────────────────────────────────
create table if not exists public.creator_applications (
  id                uuid default uuid_generate_v4() primary key,
  user_id           uuid references public.profiles(id) on delete cascade not null unique,
  account_age_days  int not null,
  total_likes       int not null,
  total_comments    int not null,
  total_posts       int not null,
  status            text default 'pending',  -- 'pending' | 'approved' | 'rejected'
  reject_reason     text,
  applied_at        timestamptz default now(),
  reviewed_at       timestamptz,
  reviewed_by       text  -- admin identifier
);

alter table public.creator_applications enable row level security;
create policy "Users view own application"   on public.creator_applications for select using (auth.uid() = user_id);
create policy "Users can apply"              on public.creator_applications for insert with check (auth.uid() = user_id);

-- ─── Tutorial purchases ──────────────────────────────────────
create table if not exists public.tutorial_purchases (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  tutorial_id uuid references public.tutorials(id) on delete cascade not null,
  amount      int not null,   -- paise
  payment_id  uuid references public.payments(id),
  created_at  timestamptz default now(),
  unique(user_id, tutorial_id)
);

alter table public.tutorial_purchases enable row level security;
create policy "Users view own tutorial purchases" on public.tutorial_purchases for select using (auth.uid() = user_id);

-- Add price fields to tutorials
alter table public.tutorials
  add column if not exists is_paid       boolean default false,
  add column if not exists price         int default 0,        -- paise (₹99 = 9900)
  add column if not exists creator_id    uuid references public.profiles(id) on delete set null;

-- ─── Creator Tips ────────────────────────────────────────────
create table if not exists public.creator_tips (
  id           uuid default uuid_generate_v4() primary key,
  from_user_id uuid references public.profiles(id) on delete set null,
  to_user_id   uuid references public.profiles(id) on delete cascade not null,
  amount       int not null,   -- paise
  message      text,
  payment_id   uuid references public.payments(id),
  created_at   timestamptz default now()
);

alter table public.creator_tips enable row level security;
create policy "Creator sees tips received"  on public.creator_tips for select using (auth.uid() = to_user_id);
create policy "Tipper sees tips sent"       on public.creator_tips for select using (auth.uid() = from_user_id);

-- Add tip stats to profiles
alter table public.profiles
  add column if not exists total_tips_received int default 0,
  add column if not exists supporters_count    int default 0;

-- ─── Prompt Packs ────────────────────────────────────────────
create table if not exists public.prompt_packs (
  id           uuid default uuid_generate_v4() primary key,
  creator_id   uuid references public.profiles(id) on delete cascade not null,
  title        text not null,
  description  text,
  cover_image  text,
  price        int not null default 0,   -- paise
  is_published boolean default false,
  prompts_count int default 0,
  purchases_count int default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create table if not exists public.pack_prompts (
  id           uuid default uuid_generate_v4() primary key,
  pack_id      uuid references public.prompt_packs(id) on delete cascade not null,
  prompt_text  text not null,
  ai_tool      text,
  image_url    text,
  sort_order   int default 0,
  created_at   timestamptz default now()
);

create table if not exists public.pack_purchases (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  pack_id    uuid references public.prompt_packs(id) on delete cascade not null,
  amount     int not null,   -- paise
  payment_id uuid references public.payments(id),
  created_at timestamptz default now(),
  unique(user_id, pack_id)
);

alter table public.prompt_packs  enable row level security;
alter table public.pack_prompts   enable row level security;
alter table public.pack_purchases enable row level security;

create policy "Published packs are public"       on public.prompt_packs  for select using (is_published = true or auth.uid() = creator_id);
create policy "Creators manage own packs"        on public.prompt_packs  for all   using (auth.uid() = creator_id);
create policy "Pack prompts viewable by buyers"  on public.pack_prompts  for select using (true);
create policy "Creators manage pack prompts"     on public.pack_prompts  for all   using (
  auth.uid() = (select creator_id from public.prompt_packs where id = pack_id)
);
create policy "Users view own pack purchases"    on public.pack_purchases for select using (auth.uid() = user_id);

-- ─── Indexes ─────────────────────────────────────────────────
create index if not exists creator_applications_user_id_idx  on public.creator_applications(user_id);
create index if not exists creator_applications_status_idx   on public.creator_applications(status);
create index if not exists tutorial_purchases_user_id_idx    on public.tutorial_purchases(user_id);
create index if not exists creator_tips_to_user_idx          on public.creator_tips(to_user_id);
create index if not exists prompt_packs_creator_id_idx       on public.prompt_packs(creator_id);
create index if not exists pack_purchases_user_id_idx        on public.pack_purchases(user_id);
