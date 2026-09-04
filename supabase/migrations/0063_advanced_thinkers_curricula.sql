create table if not exists advanced_thinkers_curricula (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  grade_band text not null default '4–5 mixed',
  weeks integer not null check (weeks in (9, 18, 36)),
  inputs jsonb not null default '{}'::jsonb,
  curriculum jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table advanced_thinkers_curricula enable row level security;

drop policy if exists "Users manage their own advanced thinkers curricula" on advanced_thinkers_curricula;
create policy "Users manage their own advanced thinkers curricula"
  on advanced_thinkers_curricula for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

create index if not exists advanced_thinkers_curricula_teacher_idx
  on advanced_thinkers_curricula (teacher_id, updated_at desc);
