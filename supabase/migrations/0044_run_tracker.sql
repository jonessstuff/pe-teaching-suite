-- PE Run Tracker: reusable class roster + timed lap sessions and student results.
-- Supports 1/2 mile, 1 mile, and custom distances/lap counts.
-- APPLY MANUALLY (out-of-band) via the Supabase SQL editor.

create table if not exists run_sessions (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  class_period_id uuid not null references class_periods(id) on delete cascade,
  run_date date not null default current_date,
  distance_label text not null,
  distance_miles numeric,
  laps_required integer not null check (laps_required between 1 and 50),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists run_results (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  session_id uuid not null references run_sessions(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  laps_completed integer not null default 0 check (laps_completed >= 0),
  lap_times_ms jsonb not null default '[]'::jsonb,
  finish_ms integer,
  status text not null default 'active'
    check (status in ('active', 'finished', 'absent', 'medical', 'dnf')),
  updated_at timestamptz not null default now(),
  unique (session_id, student_id)
);

alter table run_sessions enable row level security;
alter table run_results enable row level security;

create policy "Users manage their own run_sessions" on run_sessions
  for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

create policy "Users manage their own run_results" on run_results
  for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

create index if not exists run_sessions_period_date_idx
  on run_sessions (class_period_id, run_date desc);
create index if not exists run_results_session_idx on run_results (session_id);
create index if not exists run_results_student_idx on run_results (student_id);
