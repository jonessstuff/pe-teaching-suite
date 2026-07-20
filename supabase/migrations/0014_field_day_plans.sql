create table if not exists field_day_plans (
  id         uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  name       text not null default 'Field Day Plan',
  plan_data  jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table field_day_plans enable row level security;

create policy "Users manage their own field day plans"
  on field_day_plans for all
  using  (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

drop trigger if exists trg_field_day_plans_updated_at on field_day_plans;
create trigger trg_field_day_plans_updated_at
  before update on field_day_plans
  for each row execute function set_updated_at();
