-- Individual cardiovascular SMART goals tied to Run Tracker history.
-- APPLY MANUALLY (out-of-band) via the Supabase SQL editor.

create table if not exists run_goals (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  distance_label text not null,
  baseline_ms integer not null check (baseline_ms > 0),
  target_ms integer not null check (target_ms > 0),
  target_date date not null,
  status text not null default 'active' check (status in ('active', 'achieved', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table run_goals enable row level security;

create policy "Users manage their own run_goals" on run_goals
  for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

create index if not exists run_goals_student_idx on run_goals (student_id, created_at desc);
