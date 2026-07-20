-- =====================================================================
-- IEP/504 Accommodation Tracking — Students Table
-- =====================================================================
-- Stores lightweight student profiles with accommodation notes.
-- Linked to a class period so the generator can include relevant
-- accommodations automatically when a period is selected.
-- =====================================================================

create table if not exists students (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  name_or_initials text not null,
  grade int,
  accommodation_notes text,
  class_period_id uuid references class_periods(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_students_teacher_id on students(teacher_id);
create index if not exists idx_students_class_period_id on students(class_period_id);

alter table students enable row level security;

create policy "Users manage their own students"
  on students for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);
