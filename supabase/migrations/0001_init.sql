-- =====================================================================
-- PE/Health Teaching Suite — Initial Schema
-- =====================================================================
-- Core principle: ONE AI call per lesson populates a full LessonObject,
-- stored as JSONB. All renderers (Plan Book, sub plan, warm-up cards,
-- station signs, PPT, quiz, parent letter, curriculum map) read from
-- this same stored object — no repeated AI calls.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- profiles
-- One row per teacher (extends auth.users). Single-teacher first;
-- school_id / role groundwork laid for Phase 3 multi-seat licensing.
-- ---------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  school_name text,
  district_name text,
  default_subject text default 'PE',
  role text default 'teacher',           -- 'teacher' | 'admin' (Phase 3)
  school_id uuid,                        -- nullable until multi-seat (Phase 3)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- units
-- Lightweight grouping for curriculum maps / pacing guides.
-- ---------------------------------------------------------------------
create table if not exists units (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  name text not null,                    -- e.g. "Striking & Fielding"
  subject text not null default 'PE',
  grade_bands int[] not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- class_periods
-- Used for organizing lessons by class period / section.
-- ---------------------------------------------------------------------
create table if not exists class_periods (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  label text not null,                   -- e.g. "Period 3 - 7th Grade"
  grade_bands int[] not null default '{}',
  class_size int,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- lessons
-- The core table. `lesson_object` stores the full LessonObject JSON
-- (see src/types/lessonObject.js). Top-level columns are denormalized
-- copies of key fields for filtering/sorting without unpacking JSON.
-- ---------------------------------------------------------------------
create table if not exists lessons (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  unit_id uuid references units(id) on delete set null,
  class_period_id uuid references class_periods(id) on delete set null,

  -- Denormalized fields for querying/sorting (mirrors lesson_object)
  title text not null,
  subject text not null default 'PE',
  grade_bands int[] not null default '{}',
  duration_minutes int,
  scheduled_date date,                   -- Day/Date from Plan Book header
  period_label text,                     -- period/time from Plan Book header

  -- Full structured LessonObject (source of truth for all renderers)
  lesson_object jsonb not null default '{}'::jsonb,

  -- Generation metadata
  ai_model text,                         -- model used for generation
  generation_prompt_version text,        -- track prompt/template version (server-side only)
  generated_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_lessons_teacher_id on lessons(teacher_id);
create index if not exists idx_lessons_unit_id on lessons(unit_id);
create index if not exists idx_lessons_class_period_id on lessons(class_period_id);
create index if not exists idx_lessons_scheduled_date on lessons(scheduled_date);
create index if not exists idx_lessons_lesson_object_gin on lessons using gin (lesson_object);

-- ---------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_lessons_updated_at on lessons;
create trigger trg_lessons_updated_at
  before update on lessons
  for each row execute function set_updated_at();

drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security
-- Single-teacher mode: each teacher only sees their own data.
-- Phase 3 (multi-seat/admin) will extend these policies with
-- school_id-based admin read access.
-- ---------------------------------------------------------------------
alter table profiles enable row level security;
alter table units enable row level security;
alter table class_periods enable row level security;
alter table lessons enable row level security;

create policy "Users manage their own profile"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users manage their own units"
  on units for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

create policy "Users manage their own class periods"
  on class_periods for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

create policy "Users manage their own lessons"
  on lessons for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

-- ---------------------------------------------------------------------
-- Auto-create profile on signup
-- ---------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
