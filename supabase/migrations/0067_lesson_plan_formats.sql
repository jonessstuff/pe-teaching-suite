-- =====================================================================
-- 0067_lesson_plan_formats.sql
-- Private, reusable lesson-plan layouts owned by an individual teacher.
-- The generated lesson remains unchanged; formats control presentation and
-- the local-requirements check only.
-- =====================================================================

create table if not exists public.lesson_plan_formats (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  detail_level text not null default 'brief'
    check (detail_level in ('brief', 'standard', 'detailed')),
  sections jsonb not null default '[]'::jsonb,
  mtss_goal_bank jsonb not null default '[]'::jsonb,
  requirement_notes text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lesson_plan_formats enable row level security;

drop policy if exists "Users manage their own lesson plan formats" on public.lesson_plan_formats;
create policy "Users manage their own lesson plan formats"
  on public.lesson_plan_formats for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

create index if not exists lesson_plan_formats_teacher_idx
  on public.lesson_plan_formats (teacher_id, updated_at desc);

create unique index if not exists lesson_plan_formats_one_default_idx
  on public.lesson_plan_formats (teacher_id)
  where is_default = true;

create table if not exists public.lesson_plan_format_values (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  format_id uuid not null references public.lesson_plan_formats(id) on delete cascade,
  mtss_goal_numbers text[] not null default '{}',
  mtss_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (teacher_id, lesson_id, format_id)
);

alter table public.lesson_plan_format_values enable row level security;

drop policy if exists "Users manage their own lesson format values" on public.lesson_plan_format_values;
create policy "Users manage their own lesson format values"
  on public.lesson_plan_format_values for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

create index if not exists lesson_plan_format_values_lesson_idx
  on public.lesson_plan_format_values (teacher_id, lesson_id);
