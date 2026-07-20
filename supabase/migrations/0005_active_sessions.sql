create table if not exists active_sessions (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  session_token text not null,
  last_seen_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

alter table active_sessions enable row level security;

-- Users can only read and write their own row.
create policy "Users manage their own session"
  on active_sessions
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
