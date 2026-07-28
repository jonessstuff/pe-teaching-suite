-- =====================================================================
-- 0035_feature_suggestions.sql
-- =====================================================================
-- A lightweight "suggest a feature / module / pathway" box. Logged-in users
-- submit free-text suggestions; the owner reviews them periodically (via SQL or
-- the dashboard). A trigger fires a Resend notification to the review inbox on
-- each new suggestion, mirroring the new-signup notification (0034).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Table
-- ---------------------------------------------------------------------
create table if not exists public.feature_suggestions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  suggestion_text text not null,
  created_at      timestamptz not null default now()
);

create index if not exists feature_suggestions_created_at_idx
  on public.feature_suggestions (created_at desc);

-- ---------------------------------------------------------------------
-- 2. RLS — a user may only insert/read their OWN suggestions. The owner
--    reviews all rows out-of-band via the service role (SQL / dashboard),
--    which bypasses RLS.
-- ---------------------------------------------------------------------
alter table public.feature_suggestions enable row level security;

drop policy if exists "insert own suggestion" on public.feature_suggestions;
create policy "insert own suggestion" on public.feature_suggestions
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "read own suggestions" on public.feature_suggestions;
create policy "read own suggestions" on public.feature_suggestions
  for select to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 3. Owner notification (server-side, bulletproof). AFTER INSERT, pg_net
--    POSTs the new suggestion's id to the notify-suggestion Edge Function,
--    which reads the row (service role), resolves the user's email, and
--    emails the review inbox via Resend. Wrapped so a notification failure
--    NEVER blocks the insert (post-commit, non-blocking queue).
-- ---------------------------------------------------------------------
create or replace function public.notify_new_suggestion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url     := 'https://lcboiqshjxstwbkruwho.supabase.co/functions/v1/notify-suggestion',
    body    := jsonb_build_object('suggestion_id', new.id),
    headers := jsonb_build_object('Content-Type', 'application/json')
  );
  return new;
exception when others then
  -- Notification must NEVER block the suggestion insert.
  return new;
end;
$$;

drop trigger if exists trg_on_feature_suggestion_created on public.feature_suggestions;
create trigger trg_on_feature_suggestion_created
  after insert on public.feature_suggestions
  for each row execute function public.notify_new_suggestion();
