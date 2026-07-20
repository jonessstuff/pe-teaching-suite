create table if not exists assessments (
  id              uuid primary key default uuid_generate_v4(),
  teacher_id      uuid not null references profiles(id) on delete cascade,
  title           text not null,
  subject         text,
  grade_bands     int[] not null default '{}',
  assessment_type text not null check (assessment_type in ('quiz', 'rubric')),
  content         jsonb not null default '{}'::jsonb,
  lesson_id       uuid references lessons(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists idx_assessments_teacher_id on assessments(teacher_id);
create index if not exists idx_assessments_lesson_id  on assessments(lesson_id);

alter table assessments enable row level security;

create policy "Users manage their own assessments"
  on assessments for all
  using  (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);
