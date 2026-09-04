-- =====================================================================
-- 0066_school_year_tasks.sql
-- A lightweight, cross-module command-center checklist for the current
-- school year. Tasks remain private to the teacher and can roll forward
-- without tying them to one specialty workspace.
-- =====================================================================

create table if not exists public.school_year_tasks (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  school_year_label text not null,
  title text not null check (char_length(trim(title)) between 1 and 180),
  notes text,
  module_label text,
  category text not null default 'planning'
    check (category in ('planning', 'event', 'communication', 'supplies', 'evidence', 'other')),
  priority text not null default 'normal'
    check (priority in ('normal', 'high')),
  due_date date,
  status text not null default 'open'
    check (status in ('open', 'completed', 'archived')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.school_year_tasks enable row level security;

drop policy if exists "Users manage their own school year tasks" on public.school_year_tasks;
create policy "Users manage their own school year tasks"
  on public.school_year_tasks for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

create index if not exists school_year_tasks_teacher_year_idx
  on public.school_year_tasks (teacher_id, school_year_label, status, due_date);

