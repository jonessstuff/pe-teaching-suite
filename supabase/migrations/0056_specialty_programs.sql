create table if not exists specialty_programs (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  module_label text not null,
  title text not null,
  template_id text not null default 'custom',
  scope text not null default 'class' check (scope in ('class','grade','all_classes')),
  metric_singular text not null,
  metric_plural text not null,
  goal_value numeric not null check (goal_value > 0),
  quick_step numeric not null default 1 check (quick_step > 0),
  target_mode text not null default 'per_student' check (target_mode in ('per_student','collective')),
  grade_label text,
  class_period_ids uuid[] not null default '{}'::uuid[],
  starts_on date not null,
  ends_on date not null,
  status text not null default 'active' check (status in ('draft','active','completed','archived')),
  settings jsonb not null default '{}'::jsonb,
  progress jsonb not null default '{}'::jsonb,
  logs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);
alter table specialty_programs enable row level security;
create policy "Users manage their own specialty programs" on specialty_programs for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);
create index if not exists specialty_programs_teacher_idx on specialty_programs (teacher_id, module_label, updated_at desc);
