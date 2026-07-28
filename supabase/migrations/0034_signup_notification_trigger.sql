-- =====================================================================
-- 0034_signup_notification_trigger.sql
-- =====================================================================
-- Fires the "new signup" owner notification SERVER-SIDE so it's bulletproof
-- across all signup paths and browser-cache states (the earlier client-side
-- invoke could be missed by a stale/cached bundle). AFTER INSERT on auth.users,
-- pg_net POSTs the new user's id to the notify-signup Edge Function, which
-- verifies the user + recency and emails via Resend.
--
-- Safe by design: pg_net QUEUES the request (post-commit, non-blocking), and the
-- whole thing is wrapped so any failure returns NEW without ever blocking the
-- signup insert. The function URL is public (not a secret); notify-signup guards
-- itself by requiring a real, freshly-created user id.
-- =====================================================================
create or replace function public.notify_new_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url     := 'https://lcboiqshjxstwbkruwho.supabase.co/functions/v1/notify-signup',
    body    := jsonb_build_object('user_id', new.id),
    headers := jsonb_build_object('Content-Type', 'application/json')
  );
  return new;
exception when others then
  -- Notification must NEVER block account creation.
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created_notify on auth.users;
create trigger trg_on_auth_user_created_notify
  after insert on auth.users
  for each row execute function public.notify_new_signup();
