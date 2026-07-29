-- 0038_password_auth.sql   (idempotent; applied out-of-band)
-- =====================================================================
-- Password auth alongside magic link.
--   has_password                 — whether the user has set a password. Drives
--                                  Settings ("Set" vs "Change") and the
--                                  post-first-lesson banner (passwordless only).
--   password_prompt_dismissed_at — when the banner was dismissed, so it doesn't
--                                  return every session.
-- =====================================================================
alter table profiles
  add column if not exists has_password boolean not null default false,
  add column if not exists password_prompt_dismissed_at timestamptz;

-- NO backfill from auth.users.encrypted_password: admin.createUser() (the
-- provisioning path) sets a RANDOM encrypted_password at account creation, so a
-- non-null hash does NOT mean the user knows a password (verified: 40/41
-- never-generated magic-link accounts had a hash, but only 14 users were ever
-- sent a recovery email). The column's `default false` above is the correct
-- backfill. The trigger below flips has_password true only when a password is
-- actually SET/CHANGED through our flows (updateUser -> an UPDATE of
-- encrypted_password; the create-time INSERT never fires an UPDATE trigger).
-- (No idempotent-unsafe UPDATE here — see the deploy notes for the one-time
--  correction of the earlier encrypted_password-based backfill on prod.)

-- Keep has_password in sync whenever the password is set / changed / cleared
-- (covers the reset flow, the Settings form, and the first-run banner alike).
create or replace function public.sync_has_password()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
    set has_password = (new.encrypted_password is not null and new.encrypted_password <> '')
    where id = new.id;
  return new;
end;
$$;

drop trigger if exists trg_sync_has_password on auth.users;
create trigger trg_sync_has_password
  after update of encrypted_password on auth.users
  for each row
  when (new.encrypted_password is distinct from old.encrypted_password)
  execute function public.sync_has_password();
