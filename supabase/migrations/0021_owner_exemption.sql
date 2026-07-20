-- =====================================================================
-- 0021_owner_exemption.sql
-- =====================================================================
-- Owner / admin exemption. Some accounts (the app owner, staff comps)
-- must always be treated as PAID regardless of Stripe status — full
-- access, no watermark, no export cap. This is enforced with a server-
-- side flag column on profiles (NOT a client-side email check, which
-- anyone could spoof), respected by the export-cap RPC below and by the
-- client's deriveTrialState().
--
-- The flag defaults to false and can only be set by someone with direct
-- SQL / service-role access, so it cannot be granted from the app.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Owner flag. Defaults false so every existing/new row is unaffected.
-- ---------------------------------------------------------------------
alter table profiles
  add column if not exists is_owner boolean not null default false;

-- ---------------------------------------------------------------------
-- 2. Grant the exemption to the owner account (looked up by email).
--    Edit / repeat this statement to comp additional accounts.
-- ---------------------------------------------------------------------
update profiles
   set is_owner = true
 where id = (
   select id from auth.users
    where lower(email) = lower('staceyjonesthirtyone@gmail.com')
 );

-- ---------------------------------------------------------------------
-- 3. Teach the export-cap RPC about owners. Owners are treated exactly
--    like paid (active) users: unlimited, never incremented.
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
  v_owner  boolean;
  v_count  int;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select p.subscription_status, p.is_owner, p.export_count
    into v_status, v_owner, v_count
    from profiles p
   where p.id = v_uid
   for update;

  -- Owner / paid (active or past-due grace): unlimited, no increment.
  if v_owner or v_status in ('active', 'past_due') then
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
