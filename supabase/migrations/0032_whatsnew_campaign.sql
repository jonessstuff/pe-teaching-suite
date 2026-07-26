-- One-time "what's new" update campaign to active paying subscribers.
-- Applied out of band via `supabase db query --linked` (this repo's migration
-- history is not replayed); kept here for provenance.
--
-- Audience is sourced from Stripe (status = 'active'), so some recipients have
-- no profiles row (they subscribed via the Stripe payment link and/or under an
-- email that differs from their PlansK12 login). Hence: dedup keyed by EMAIL,
-- plus an email-based unsubscribe suppression list for account-less recipients.

-- Per-email idempotency guard for the send (one email per address, ever).
create table if not exists public.whatsnew_emails (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  user_id uuid,
  resend_id text,
  sent_at timestamptz not null default now()
);
alter table public.whatsnew_emails enable row level security;

-- Email-based unsubscribe for marketing recipients with no profiles row.
-- email-unsubscribe checks profiles.unsubscribe_token first, then this table.
create table if not exists public.marketing_optouts (
  email text primary key,
  token uuid not null unique default gen_random_uuid(),
  opted_out boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.marketing_optouts enable row level security;
