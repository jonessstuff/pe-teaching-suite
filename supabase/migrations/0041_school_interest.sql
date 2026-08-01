-- =====================================================================
-- 0041_school_interest.sql
-- =====================================================================
-- A lightweight PUBLIC "School/District Interest" lead form on the landing
-- page — an administrator/buyer expresses interest in a school- or
-- district-wide licensing option (which does NOT exist yet; this purely
-- gauges real demand before anything is built). Unlike feature_suggestions
-- (0035), submitters are ANONYMOUS (not logged in), so the row carries the
-- contact info directly and anon may insert. A trigger fires a Resend
-- notification to the review inbox on each new submission, mirroring the
-- new-signup (0034) and suggestion (0035) notifications.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Table
-- ---------------------------------------------------------------------
create table if not exists public.school_interest (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  organization  text not null,          -- school or district name
  email         text not null,
  teacher_count integer,                -- approximate # of teachers (optional)
  note          text,                   -- optional free-text
  created_at    timestamptz not null default now(),
  -- Lightweight guards so a leaked anon key can't stuff huge payloads.
  constraint school_interest_name_len         check (char_length(name) between 1 and 200),
  constraint school_interest_org_len          check (char_length(organization) between 1 and 200),
  constraint school_interest_email_len        check (char_length(email) between 3 and 200),
  constraint school_interest_note_len         check (note is null or char_length(note) <= 2000),
  constraint school_interest_teacher_count_ok check (teacher_count is null or (teacher_count between 0 and 100000))
);

create index if not exists school_interest_created_at_idx
  on public.school_interest (created_at desc);

-- ---------------------------------------------------------------------
-- 2. RLS — this is a PUBLIC lead form: anyone (anon or authenticated) may
--    INSERT, but NOBODY may read via the API. The owner reviews all rows
--    out-of-band via the service role (SQL / dashboard), which bypasses RLS.
-- ---------------------------------------------------------------------
alter table public.school_interest enable row level security;

drop policy if exists "anyone can submit interest" on public.school_interest;
create policy "anyone can submit interest" on public.school_interest
  for insert to anon, authenticated
  with check (true);
-- (No SELECT/UPDATE/DELETE policy => no reads or edits through the anon key.)

-- ---------------------------------------------------------------------
-- 3. Owner notification (server-side, bulletproof). AFTER INSERT, pg_net
--    POSTs the new row's id to the notify-school-interest Edge Function,
--    which reads the row (service role) and emails the review inbox via
--    Resend. Wrapped so a notification failure NEVER blocks the insert.
-- ---------------------------------------------------------------------
create or replace function public.notify_new_school_interest()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url     := 'https://lcboiqshjxstwbkruwho.supabase.co/functions/v1/notify-school-interest',
    body    := jsonb_build_object('interest_id', new.id),
    headers := jsonb_build_object('Content-Type', 'application/json')
  );
  return new;
exception when others then
  -- Notification must NEVER block the submission insert.
  return new;
end;
$$;

drop trigger if exists trg_on_school_interest_created on public.school_interest;
create trigger trg_on_school_interest_created
  after insert on public.school_interest
  for each row execute function public.notify_new_school_interest();
