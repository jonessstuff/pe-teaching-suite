-- Universal class, grade-level, and nested individual SMART goals.
-- APPLY MANUALLY (out-of-band) via the Supabase SQL editor.

create table if not exists smart_goals (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  scope text not null check (scope in ('class', 'grade')),
  class_period_id uuid references class_periods(id) on delete set null,
  grade_label text,
  subject text not null,
  title text not null,
  specific_statement text not null,
  metric_name text not null,
  metric_unit text not null default 'percent',
  direction text not null default 'increase' check (direction in ('increase', 'decrease', 'maintain')),
  baseline_value numeric not null,
  target_value numeric not null,
  target_date date not null,
  status text not null default 'active' check (status in ('active', 'achieved', 'needs_support', 'paused', 'archived')),
  source_type text not null default 'manual' check (source_type in ('manual', 'run_tracker')),
  source_label text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists smart_goal_students (
  id uuid primary key default uuid_generate_v4(),
  goal_id uuid not null references smart_goals(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  baseline_value numeric,
  target_value numeric,
  current_value numeric,
  status text not null default 'active' check (status in ('active', 'achieved', 'needs_support', 'paused')),
  notes text,
  updated_at timestamptz not null default now(),
  unique (goal_id, student_id)
);

create table if not exists smart_goal_updates (
  id uuid primary key default uuid_generate_v4(),
  goal_id uuid not null references smart_goals(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  observed_at date not null default current_date,
  value numeric not null,
  note text,
  created_at timestamptz not null default now()
);

alter table smart_goals enable row level security;
alter table smart_goal_students enable row level security;
alter table smart_goal_updates enable row level security;

create policy "Users manage their own smart_goals" on smart_goals
  for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

create policy "Users manage students inside their smart_goals" on smart_goal_students
  for all using (exists (select 1 from smart_goals g where g.id = goal_id and g.teacher_id = auth.uid()))
  with check (exists (select 1 from smart_goals g where g.id = goal_id and g.teacher_id = auth.uid()));

create policy "Users manage updates inside their smart_goals" on smart_goal_updates
  for all using (exists (select 1 from smart_goals g where g.id = goal_id and g.teacher_id = auth.uid()))
  with check (exists (select 1 from smart_goals g where g.id = goal_id and g.teacher_id = auth.uid()));

create index if not exists smart_goals_teacher_idx on smart_goals (teacher_id, status, target_date);
create index if not exists smart_goal_students_goal_idx on smart_goal_students (goal_id);
create index if not exists smart_goal_updates_goal_idx on smart_goal_updates (goal_id, observed_at);
