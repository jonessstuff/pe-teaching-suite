-- =====================================================================
-- 0034_billing_unmatched.sql   (idempotent; applied out-of-band like 0033)
-- =====================================================================
-- Makes "paid but unmatchable to an account" VISIBLE instead of silent.
-- The stripe-webhook links a Stripe customer to a Supabase account by
-- stripe_customer_id, then email. When BOTH fail, it has a paying customer
-- it can't attach to anyone (the "charged twice over five weeks, never
-- logged in" case). It now records that here so the owner can see and
-- hand-map it, rather than discovering it by manual cross-reference.
--
-- Repeats bump seen_count (so a customer charged N times unmatched shows
-- seen_count = N). Owner sets resolved_at after mapping; the partial unique
-- index keeps exactly one OPEN row per (customer, event_type).
-- =====================================================================
create table if not exists public.billing_unmatched (
  id                   bigint generated always as identity primary key,
  stripe_customer_id   text,
  email                text,
  event_type           text not null,
  subscription_status  text,
  amount_cents         int,
  seen_count           int not null default 1,
  first_seen_at        timestamptz not null default now(),
  last_seen_at         timestamptz not null default now(),
  resolved_at          timestamptz
);

create unique index if not exists uq_billing_unmatched_open
  on public.billing_unmatched (stripe_customer_id, event_type)
  where resolved_at is null;

-- Service-role only (the webhook's key). No anon/authenticated access; the
-- owner reads via SQL / service role. RLS on with no policies = deny-all
-- except the BYPASSRLS service_role.
alter table public.billing_unmatched enable row level security;

-- Upsert helper the webhook calls. SECURITY DEFINER so the service role can
-- run it; the partial-index-aware ON CONFLICT bumps the counter on repeats.
create or replace function public.log_billing_unmatched(
  p_customer_id text,
  p_email       text,
  p_event_type  text,
  p_status      text,
  p_amount      int
) returns void
language sql
security definer
set search_path = public
as $$
  insert into public.billing_unmatched
    (stripe_customer_id, email, event_type, subscription_status, amount_cents)
  values (p_customer_id, p_email, p_event_type, p_status, p_amount)
  on conflict (stripe_customer_id, event_type) where resolved_at is null
  do update set
    seen_count          = billing_unmatched.seen_count + 1,
    last_seen_at        = now(),
    email               = coalesce(excluded.email, billing_unmatched.email),
    subscription_status = coalesce(excluded.subscription_status, billing_unmatched.subscription_status),
    amount_cents        = coalesce(excluded.amount_cents, billing_unmatched.amount_cents);
$$;

revoke all on function public.log_billing_unmatched(text, text, text, text, int) from public, anon, authenticated;
grant execute on function public.log_billing_unmatched(text, text, text, text, int) to service_role;
