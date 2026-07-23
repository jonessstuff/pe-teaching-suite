-- =====================================================================
-- 0024_teaching_areas.sql
-- =====================================================================
-- Captures a teacher's primary specialty/role(s) at signup ("What do you
-- teach?"). Multi-select — a teacher can cover more than one area (e.g. PE
-- + Adaptive PE, or a librarian who also runs a Makerspace). Used later for
-- targeted dashboard messaging and understanding the user-base specialty mix.
--
--   teaching_areas  — module keys the user selected (see src/constants/teachingAreas.js)
--   cte_pathways    — CTE pathway keys, only meaningful when 'cte' is in teaching_areas
--   teaching_other  — free text captured when 'other' is selected
-- =====================================================================

alter table profiles
  add column if not exists teaching_areas text[] not null default '{}',
  add column if not exists cte_pathways   text[] not null default '{}',
  add column if not exists teaching_other text;

-- ---------------------------------------------------------------------
-- Persist the signup selections into the profile on account creation.
-- The client passes them via supabase.auth.signUp({ options: { data }}),
-- which lands in auth.users.raw_user_meta_data. This trigger fires when the
-- auth row is created (before email confirmation), so the profile is
-- populated even for a not-yet-confirmed signup. Coalesce guards keep it
-- safe when a key is absent.
-- ---------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, teaching_areas, cte_pathways, teaching_other)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce(array(select jsonb_array_elements_text(coalesce(new.raw_user_meta_data->'teaching_areas', '[]'::jsonb))), '{}'),
    coalesce(array(select jsonb_array_elements_text(coalesce(new.raw_user_meta_data->'cte_pathways',   '[]'::jsonb))), '{}'),
    nullif(new.raw_user_meta_data->>'teaching_other', '')
  );
  return new;
end;
$$ language plpgsql security definer;
