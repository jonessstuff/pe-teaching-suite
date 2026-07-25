-- 0029_winback_emails.sql
-- =====================================================================
-- Win-back campaign: re-engage canceled subscriptions and expired trials.
--
-- Part 1 (one-time): email every current canceled/lapsed user once.
-- Part 2 (ongoing):  a daily pg_cron sweep emails any FUTURE user ~3 weeks
--                    after they cancel / their trial expires.
-- Both use the SAME email and the SAME idempotency table below, so the sweep
-- naturally covers the current backlog on its first run and newly-eligible
-- users thereafter.
--
-- NOTE: there is no subscription_status column in this database (Stripe is the
-- source of truth), so the sweep classifies each user by querying the Stripe
-- API live — it does not depend on any cached status.
-- =====================================================================

-- One row per user = the idempotency guard. The sweep "claims" a send by
-- inserting here first (unique on user_id), so a user is emailed at most once,
-- ever — even across overlapping runs. Deliberately NOT seeded: unlike the
-- trial sequence, we WANT the first run to reach the current lapsed list.
create table if not exists winback_emails (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users(id) on delete cascade,
  sent_at   timestamptz not null default now(),
  resend_id text,
  unique (user_id)
);

create index if not exists idx_winback_emails_user on winback_emails(user_id);

-- Only the service-role edge function touches this table. RLS on, no policies
-- => invisible to anon/authenticated clients.
alter table winback_emails enable row level security;

-- ---------------------------------------------------------------------
-- Email opt-out (CAN-SPAM). No functional unsubscribe existed before, though
-- the /try copy promised one. The win-back email footer links to the
-- email-unsubscribe edge function, which flips email_opt_out by token. The
-- sweep skips any opted-out user.
--
-- unsubscribe_token has a VOLATILE default, so every existing row is backfilled
-- with its own distinct token at ADD COLUMN time.
-- ---------------------------------------------------------------------
alter table profiles
  add column if not exists email_opt_out     boolean not null default false,
  add column if not exists unsubscribe_token  uuid    not null default gen_random_uuid();

create unique index if not exists idx_profiles_unsub_token on profiles(unsubscribe_token);

-- Scheduling primitives (already present from the trial sweep, kept for safety).
create extension if not exists pg_cron;
create extension if not exists pg_net;
