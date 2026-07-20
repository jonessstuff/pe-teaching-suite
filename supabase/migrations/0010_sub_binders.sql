create table if not exists sub_binders (
  id         uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  name       text not null,
  subject    text not null,
  binder_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table sub_binders enable row level security;

create policy "Users manage their own sub binders"
  on sub_binders for all
  using  (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

drop trigger if exists trg_sub_binders_updated_at on sub_binders;
create trigger trg_sub_binders_updated_at
  before update on sub_binders
  for each row execute function set_updated_at();
