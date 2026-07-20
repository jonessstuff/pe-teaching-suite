create table if not exists lesson_presets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  settings   jsonb not null,
  created_at timestamptz not null default now()
);

alter table lesson_presets enable row level security;

create policy "Users manage their own presets"
  on lesson_presets for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
