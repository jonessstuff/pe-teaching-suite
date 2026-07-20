create table if not exists pacing_guides (
  id         uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  name       text not null,
  guide_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table pacing_guides enable row level security;

create policy "Users manage their own pacing guides"
  on pacing_guides for all
  using  (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

drop trigger if exists trg_pacing_guides_updated_at on pacing_guides;
create trigger trg_pacing_guides_updated_at
  before update on pacing_guides
  for each row execute function set_updated_at();
