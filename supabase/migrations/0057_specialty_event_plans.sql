create table if not exists specialty_event_plans (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  experience_type text not null,
  module_label text not null,
  title text not null,
  inputs jsonb not null default '{}'::jsonb,
  plan jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('draft','active','completed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table specialty_event_plans enable row level security;

drop policy if exists "Users manage their own specialty event plans"
  on specialty_event_plans;

create policy "Users manage their own specialty event plans"
  on specialty_event_plans for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

create index if not exists specialty_event_plans_teacher_idx
  on specialty_event_plans (teacher_id, experience_type, updated_at desc);
