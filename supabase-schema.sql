-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/licakihxejajmzimbwqt/sql

create extension if not exists "uuid-ossp";

-- Exercises
create table if not exists public.exercises (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  muscle_group  text not null check (muscle_group in ('chest','back','legs','shoulders','arms','core')),
  created_at    timestamptz not null default now()
);
alter table public.exercises enable row level security;
drop policy if exists "Users manage own exercises" on public.exercises;
create policy "Users manage own exercises" on public.exercises for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Workouts
create table if not exists public.workouts (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  date             date not null,
  notes            text,
  duration_seconds integer,
  created_at       timestamptz not null default now()
);
-- Add duration_seconds if the table was created with an older schema (duration_minutes)
alter table public.workouts add column if not exists duration_seconds integer;
alter table public.workouts enable row level security;
drop policy if exists "Users manage own workouts" on public.workouts;
create policy "Users manage own workouts" on public.workouts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Sets
create table if not exists public.sets (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  workout_id    uuid not null references public.workouts(id) on delete cascade,
  exercise_id   uuid not null references public.exercises(id) on delete cascade,
  set_number    integer not null,
  weight_kg     numeric(6,2) not null default 0,
  reps          integer not null default 0,
  created_at    timestamptz not null default now()
);
alter table public.sets enable row level security;
drop policy if exists "Users manage own sets" on public.sets;
create policy "Users manage own sets" on public.sets for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- User settings (weekly goal)
create table if not exists public.user_settings (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  weekly_workout_goal  integer not null default 3,
  created_at           timestamptz not null default now()
);
alter table public.user_settings enable row level security;
drop policy if exists "Users manage own settings" on public.user_settings;
create policy "Users manage own settings" on public.user_settings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Indexes
create index if not exists idx_sets_user_exercise on public.sets(user_id, exercise_id);
create index if not exists idx_sets_workout on public.sets(workout_id);
create index if not exists idx_workouts_user_date on public.workouts(user_id, date desc);
create index if not exists idx_exercises_user on public.exercises(user_id);
