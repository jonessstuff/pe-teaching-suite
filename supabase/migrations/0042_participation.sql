-- Participation Tracker (Phase 1): per-teacher point/exempt config + daily
-- per-student participation records. "Meetings" are inferred from records (no
-- meetings table). Reuses class_periods + students unchanged.
-- APPLY MANUALLY (out-of-band) via the Supabase SQL editor — not via db push.

-- ── Per-teacher point/exempt scheme (one row per teacher) ────────────────────
create table if not exists participation_config (
  teacher_id uuid primary key references profiles(id) on delete cascade,
  statuses jsonb not null default '[
    {"key":"full","label":"Full","points":10,"exempt":false},
    {"key":"partial","label":"Partial","points":7,"exempt":false},
    {"key":"no_dress","label":"No Dress","points":5,"exempt":false},
    {"key":"none","label":"No Participation","points":0,"exempt":false},
    {"key":"absent","label":"Absent","points":0,"exempt":true},
    {"key":"medical","label":"Medical","points":0,"exempt":true}
  ]'::jsonb,
  max_points numeric not null default 10,
  updated_at timestamptz not null default now()
);

alter table participation_config enable row level security;
create policy "Users manage their own participation_config" on participation_config
  for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

-- ── Daily per-student record; one per (student, date) — recording UPSERTS ─────
-- points + exempt are SNAPSHOTTED at record time so retuning the scheme mid-
-- quarter never rewrites already-graded days.
create table if not exists participation_records (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  class_period_id uuid not null references class_periods(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  date date not null,
  status text not null,                    -- a config status key
  points numeric not null,
  exempt boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (student_id, date)
);

alter table participation_records enable row level security;
create policy "Users manage their own participation_records" on participation_records
  for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

create index if not exists participation_records_period_date_idx
  on participation_records (class_period_id, date);
