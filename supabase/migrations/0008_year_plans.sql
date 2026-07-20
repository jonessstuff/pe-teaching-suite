create table year_plans (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table year_plans enable row level security;

create policy "Users manage their own year plans"
  on year_plans for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table year_plan_units (
  id              uuid primary key default gen_random_uuid(),
  year_plan_id    uuid not null references year_plans(id) on delete cascade,
  order_index     integer not null default 0,
  subject         text not null,
  unit_name       text not null,
  estimated_weeks integer not null default 1,
  start_month     integer,
  end_month       integer,
  notes           text,
  created_at      timestamptz not null default now()
);

create index year_plan_units_plan_idx on year_plan_units (year_plan_id);

alter table year_plan_units enable row level security;

create policy "Users manage units in their own year plans"
  on year_plan_units for all
  using (
    exists (
      select 1 from year_plans
      where year_plans.id = year_plan_units.year_plan_id
        and year_plans.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from year_plans
      where year_plans.id = year_plan_units.year_plan_id
        and year_plans.user_id = auth.uid()
    )
  );
