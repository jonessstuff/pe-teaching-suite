-- 0036_activation_emails.sql   (idempotent; applied out-of-band like 0029/0032)
-- =====================================================================
-- One-off ACTIVATION campaign: a personal nudge to trial/free users who
-- signed up and got in but never generated a lesson.
--
-- Idempotency table (one row per user, ever) so a later run can't double-send,
-- plus a SECURITY DEFINER recipient RPC that encodes the REVIEWED segment
-- exactly (owner-approved list of ~30). The function reads recipients from the
-- RPC so the "who" lives in one audited place.
-- =====================================================================
create table if not exists public.activation_emails (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users(id) on delete cascade,
  sent_at   timestamptz not null default now(),
  resend_id text,
  unique (user_id)
);
create index if not exists idx_activation_emails_user on public.activation_emails(user_id);

-- Service-role edge function only. RLS on, no policies => deny-all except the
-- BYPASSRLS service_role.
alter table public.activation_emails enable row level security;

-- Eligible recipients = the reviewed segment, minus anyone already sent.
create or replace function public.activation_campaign_recipients()
returns table (user_id uuid, email text, unsubscribe_token uuid)
language sql
security definer
set search_path = public
as $$
  select p.id, u.email, p.unsubscribe_token
  from profiles p
  join auth.users u on u.id = p.id
  where coalesce(p.is_owner, false) = false
    and coalesce(p.email_opt_out, false) = false
    and u.email_confirmed_at is not null
    and u.last_sign_in_at   is not null
    and coalesce(p.subscription_status, '') <> 'canceled'
    and u.email not like 'staceyjonesthirtyone%'
    and u.email not in ('mikesamber298@gmail.com', 'jwilliams31@nicholls.edu')
    and not exists (select 1 from lessons l          where l.teacher_id = p.id)
    and not exists (select 1 from marketing_optouts m where lower(m.email) = lower(u.email) and m.opted_out = true)
    and not exists (select 1 from activation_emails a where a.user_id  = p.id)
  order by p.created_at;
$$;

revoke all on function public.activation_campaign_recipients() from public, anon, authenticated;
grant execute on function public.activation_campaign_recipients() to service_role;
