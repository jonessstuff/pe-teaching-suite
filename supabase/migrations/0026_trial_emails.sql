-- Trial-to-paid email sequence: send-tracking + idempotency.
--
-- One row per (user, email_type). The unique constraint is the idempotency
-- guard: the sweep "claims" a send by inserting here first, so it can never
-- double-send even across overlapping runs.
create table if not exists trial_emails (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  email_type text not null check (email_type in ('welcome','midtrial','nudge')),
  sent_at    timestamptz not null default now(),
  resend_id  text,
  unique (user_id, email_type)
);

create index if not exists idx_trial_emails_user on trial_emails(user_id);

-- Only the service-role edge function touches this table (it bypasses RLS).
-- Enable RLS with no policies so it's invisible to anon/authenticated clients.
alter table trial_emails enable row level security;

-- Seed EVERY existing user as already-sent for all three types. This prevents
-- the first sweep from retroactively blasting the ~20 users currently mid-trial
-- with mistimed emails (a day-5 user should not get a "welcome"). Only signups
-- created AFTER this migration enter the sequence.
insert into trial_emails (user_id, email_type)
select u.id, t.email_type
from auth.users u
cross join (values ('welcome'), ('midtrial'), ('nudge')) as t(email_type)
on conflict (user_id, email_type) do nothing;

-- Scheduling primitives. The cron.schedule job that calls the edge function is
-- configured out-of-band (it carries a secret header) so no secret lands in
-- git — see the deploy runbook.
create extension if not exists pg_cron;
create extension if not exists pg_net;
