-- 0037_first_run.sql   (idempotent; applied out-of-band like 0033/0036)
-- =====================================================================
-- First-run capture support.
--   grade_levels — stored generic grade levels (text[]) captured at first
--                  generation; pre-fills K-12 generators (best-effort; modules
--                  with their own grade concept — CTE tier, early-childhood age
--                  bands, therapy age ranges — ignore it).
--   onboarded_at — null until the teacher completes the first-generation capture.
--
-- profiles.state, teaching_areas, cte_pathways, full_name already exist.
-- =====================================================================
alter table profiles
  add column if not exists grade_levels text[] not null default '{}',
  add column if not exists onboarded_at timestamptz;

-- Mark every EXISTING user as already onboarded so no current user is ever
-- shown the new first-run capture. New signups get onboarded_at = null, so the
-- capture fires exactly once, on their first generation.
update profiles set onboarded_at = coalesce(created_at, now()) where onboarded_at is null;
