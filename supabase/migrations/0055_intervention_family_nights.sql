create table if not exists intervention_family_nights (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  night_type text not null check (night_type in ('reading','math')),
  title text not null,
  inputs jsonb not null default '{}'::jsonb,
  plan jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table intervention_family_nights enable row level security;
create policy "Users manage their own intervention family nights" on intervention_family_nights for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);
create index if not exists intervention_family_nights_teacher_idx on intervention_family_nights (teacher_id, night_type, updated_at desc);
