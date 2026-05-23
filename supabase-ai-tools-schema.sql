-- ─── AI TOOLS ────────────────────────────────────────────────────────────────
-- Run this in Supabase SQL editor

create table if not exists public.ai_tools (
  id          uuid default uuid_generate_v4() primary key,
  name        text not null unique,
  color       text default '#FF6D1F',
  bg_color    text default 'rgba(255,109,31,0.12)',
  sort_order  int default 0,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

alter table public.ai_tools enable row level security;

create policy "Anyone can read ai_tools"
  on public.ai_tools for select using (true);

-- Seed default tools
insert into public.ai_tools (name, color, bg_color, sort_order) values
  ('Midjourney',       '#FF8540', 'rgba(255,109,31,0.15)',  1),
  ('DALL·E 3',         '#FAF3E1', 'rgba(250,243,225,0.1)',  2),
  ('Stable Diffusion', '#F5E7C6', 'rgba(245,231,198,0.1)',  3),
  ('Sora',             '#FF6D1F', 'rgba(255,109,31,0.1)',   4),
  ('Runway',           '#FF7A30', 'rgba(255,109,31,0.12)',  5),
  ('Kling',            '#FF8540', 'rgba(255,133,64,0.12)',  6),
  ('Flux',             '#FF9050', 'rgba(255,109,31,0.08)',  7),
  ('Adobe Firefly',    '#9a8f7a', 'rgba(255,255,255,0.07)', 8),
  ('Other',            '#9a8f7a', 'rgba(255,255,255,0.06)', 99)
on conflict (name) do nothing;
