create table if not exists portfolios (
  id                    uuid primary key default uuid_generate_v4(),
  teacher_id            uuid not null references profiles(id) on delete cascade,
  title                 text not null default 'My Teaching Portfolio',
  teaching_philosophy   text,
  selected_lesson_ids   uuid[] not null default '{}',
  reflections           jsonb not null default '{}'::jsonb,
  student_work_examples text,
  professional_goals    text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table portfolios enable row level security;

create policy "Users manage their own portfolios"
  on portfolios for all
  using  (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

drop trigger if exists trg_portfolios_updated_at on portfolios;
create trigger trg_portfolios_updated_at
  before update on portfolios
  for each row execute function set_updated_at();
