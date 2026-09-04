-- Private teacher running/walking log within the PE & Health Run Tracker.
-- Personal entries remain separate from student run sessions and results.

create table if not exists teacher_run_entries (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  run_date date not null default current_date,
  total_distance_miles numeric not null check (total_distance_miles > 0),
  intervals_used text check (intervals_used is null or char_length(intervals_used) <= 160),
  total_running_ms integer not null check (total_running_ms > 0),
  longest_continuous_miles numeric not null check (longest_continuous_miles > 0 and longest_continuous_miles <= total_distance_miles),
  effort_rating text not null check (effort_rating in ('easy', 'moderate', 'hard')),
  followed_suggested_plan boolean not null default false,
  weight_lbs numeric check (weight_lbs is null or weight_lbs > 0),
  waist_inches numeric check (waist_inches is null or waist_inches > 0),
  pain_reported boolean not null default false,
  pain_notes text check (pain_notes is null or char_length(pain_notes) <= 240),
  created_at timestamptz not null default now()
);

alter table teacher_run_entries enable row level security;

create policy "Users manage their own teacher_run_entries" on teacher_run_entries
  for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

create index if not exists teacher_run_entries_teacher_date_idx
  on teacher_run_entries (teacher_id, run_date desc, created_at desc);

create table if not exists teacher_run_plans (
  teacher_id uuid primary key references profiles(id) on delete cascade,
  goal_distance_miles numeric not null default 3.1 check (goal_distance_miles between 0.25 and 26.2),
  goal_label text not null default '5K',
  movement_style text not null default 'run-walk' check (movement_style in ('walk', 'run-walk', 'run')),
  current_continuous_miles numeric not null default 0 check (current_continuous_miles between 0 and 26.2),
  target_date date,
  activity_days_per_week smallint not null default 3 check (activity_days_per_week between 2 and 7),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table teacher_run_plans enable row level security;

create policy "Users manage their own teacher_run_plans" on teacher_run_plans
  for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);
