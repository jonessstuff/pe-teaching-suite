-- =====================================================================
-- 0020_trial_export_limits.sql
-- =====================================================================
-- Trial export limits + a local CACHE of each user's Stripe subscription
-- status. There is no subscription table in this database — Stripe is the
-- source of truth. The `get-subscription-status` Edge Function queries the
-- Stripe API (by the user's email), then writes the result into the cache
-- columns below so the client and the export-cap RPC can read it cheaply.
--
-- Paid vs trial is derived from subscription_status:
--   paid    = subscription_status in ('active','past_due')   -- past_due = grace
--   trial   = subscription_status = 'trialing'
--             OR (no Stripe subscription AND created_at within 14 days)
--   expired = subscription_status in ('canceled','unpaid','incomplete_expired','paused')
--             OR (no Stripe subscription AND created_at older than 14 days)
--
-- The 14-day trial length is enforced in the client; this migration only
-- hardcodes the export cap (5) so the counter can be enforced server-side.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Export counter + Stripe status cache
-- Added with defaults, so ALL existing rows (including existing trial
-- users) start at zero exports with a null (unsynced) status.
-- ---------------------------------------------------------------------
alter table profiles
  add column if not exists export_count int not null default 0,
  add column if not exists stripe_customer_id text,
  add column if not exists subscription_status text,        -- null until first sync
  add column if not exists trial_ends_at timestamptz,       -- Stripe trial_end, when trialing
  add column if not exists subscription_synced_at timestamptz;

-- ---------------------------------------------------------------------
-- 2. Atomic increment with trial-cap enforcement
-- Paid users (active / past_due): unlimited, never incremented.
-- Everyone else (trialing / expired / unsynced): capped at 5.
-- Returns the resulting count and whether the caller was capped.
-- SECURITY DEFINER + row lock (for update) makes this race-safe against
-- rapid concurrent exports.
-- ---------------------------------------------------------------------
create or replace function increment_export_count()
returns table (export_count int, capped boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_status text;
  v_count  int;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select p.subscription_status, p.export_count
    into v_status, v_count
    from profiles p
   where p.id = v_uid
   for update;

  -- Paid (active or past-due grace): unlimited, no increment.
  if v_status in ('active', 'past_due') then
    return query select v_count, false;
    return;
  end if;

  -- Trial/expired/unsynced already at cap: do not increment.
  if v_count >= 5 then
    return query select v_count, true;
    return;
  end if;

  update profiles
     set export_count = profiles.export_count + 1
   where id = v_uid
   returning profiles.export_count into v_count;

  return query select v_count, false;
end;
$$;

grant execute on function increment_export_count() to authenticated;
