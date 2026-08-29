alter table public.profiles
  add column if not exists default_duration_minutes integer default 45,
  add column if not exists default_location text default '',
  add column if not exists default_equipment text[] default '{}',
  add column if not exists default_accommodations text default '';

alter table public.profiles
  drop constraint if exists profiles_default_duration_minutes_check;

alter table public.profiles
  add constraint profiles_default_duration_minutes_check
  check (default_duration_minutes between 5 and 240);
