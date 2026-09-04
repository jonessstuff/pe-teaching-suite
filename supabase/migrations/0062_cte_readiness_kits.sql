create table if not exists cte_readiness_kits (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  tool_type text not null check (tool_type in ('pathway-fit','foundations','employability')),
  title text not null,
  inputs jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table cte_readiness_kits enable row level security;

drop policy if exists "Users manage their own CTE readiness kits" on cte_readiness_kits;
create policy "Users manage their own CTE readiness kits"
  on cte_readiness_kits for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

create index if not exists cte_readiness_kits_teacher_idx
  on cte_readiness_kits (teacher_id, tool_type, updated_at desc);
