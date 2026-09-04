-- =====================================================================
-- 0065_cancellation_recovery_emails.sql
-- Records the owner-approved email sent for a specific scheduled
-- cancellation. The subscription id + end date pair allows a future email if
-- the same customer returns and later schedules a different cancellation.
-- =====================================================================

create table if not exists public.cancellation_recovery_emails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_subscription_id text not null,
  scheduled_end_at timestamptz not null,
  sent_at timestamptz not null default now(),
  resend_id text,
  unique (stripe_subscription_id, scheduled_end_at)
);

create index if not exists cancellation_recovery_user_idx
  on public.cancellation_recovery_emails (user_id, sent_at desc);

alter table public.cancellation_recovery_emails enable row level security;

