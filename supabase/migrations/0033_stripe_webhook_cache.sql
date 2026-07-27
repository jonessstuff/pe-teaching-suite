-- =====================================================================
-- 0033_stripe_webhook_cache.sql
-- =====================================================================
-- Adds the Stripe subscription-cache columns that 0019 + the cache half of
-- 0020 were supposed to add but were never applied to prod. The stripe-webhook
-- edge function (and get-subscription-status) write the live Stripe status here
-- so the client resolves paid/trial cheaply without a per-load Stripe round-trip.
--
-- Entitlement is still ultimately resolved from live Stripe by email; these
-- columns are a best-effort cache + the join key (stripe_customer_id) the
-- webhook populates on checkout.
-- =====================================================================
alter table profiles
  add column if not exists stripe_customer_id     text,
  add column if not exists subscription_status    text,
  add column if not exists subscription_synced_at timestamptz,
  add column if not exists trial_ends_at          timestamptz;

create index if not exists idx_profiles_stripe_customer_id on profiles (stripe_customer_id);

-- Case-insensitive lookup of an auth user id by email, for the Stripe webhook.
-- The webhook only has the payer's email; auth.users isn't reachable through
-- PostgREST, so this SECURITY DEFINER helper does the exact, lower()-normalized
-- match. Executable by service_role only (the webhook's key).
create or replace function public.get_user_id_by_email(p_email text)
returns uuid
language sql
security definer
set search_path = public
as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;

revoke all on function public.get_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.get_user_id_by_email(text) to service_role;
