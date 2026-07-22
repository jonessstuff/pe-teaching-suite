-- Classroom Management module — persisted quick-reference cards.
-- Owner-only, same shape/RLS as pacing_guides / sub_binders.

create table if not exists classroom_management_cards (
  id         uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  name       text not null,
  card_data  jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_classroom_management_cards_teacher_id
  on classroom_management_cards(teacher_id);

alter table classroom_management_cards enable row level security;

create policy "Users manage their own classroom management cards"
  on classroom_management_cards for all
  using  (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

drop trigger if exists trg_classroom_management_cards_updated_at on classroom_management_cards;
create trigger trg_classroom_management_cards_updated_at
  before update on classroom_management_cards
  for each row execute function set_updated_at();
