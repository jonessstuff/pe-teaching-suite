-- Intervention Planning: a teacher's personal history of past intervention
-- entries, so they can see what's been tried for a student over time.
--
-- PRIVACY (intentional): the identifier is student INITIALS or a teacher-chosen
-- CODE only. There is deliberately NO student name / full-name column anywhere
-- in this schema. This keeps the tool a personal planning aid — not an official
-- student record — and minimizes data sensitivity.
create table if not exists intervention_history (
  id                  uuid primary key default gen_random_uuid(),
  teacher_id          uuid not null references profiles(id) on delete cascade,
  student_initials    text not null,           -- initials or a code ONLY — never a full name
  domain              text,                     -- 'Reading' | 'Math' | 'Behavior'
  title               text,
  tier                text,
  targeted_skill      text,
  recheck_frequency   text,                     -- from progress_monitoring, powers the "check next" nudge
  what_to_watch       text,
  success_indicators  text,
  intervention_object jsonb,                    -- the full generated intervention, for reference
  entry_date          date not null default current_date,
  created_at          timestamptz not null default now()
);

create index if not exists idx_intervention_history_lookup
  on intervention_history (teacher_id, lower(student_initials), entry_date desc);

alter table intervention_history enable row level security;

-- Each teacher sees and manages only their own history entries.
create policy "Teachers manage their own intervention history"
  on intervention_history for all
  using  (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);
