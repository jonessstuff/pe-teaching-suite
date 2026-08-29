-- Run conditions/notes and teacher-managed SMART goal progress.
-- APPLY MANUALLY (out-of-band) via the Supabase SQL editor.

alter table run_sessions add column if not exists notes text;
alter table run_goals add column if not exists progress_status text not null default 'on_track';

alter table run_goals drop constraint if exists run_goals_progress_status_check;
alter table run_goals add constraint run_goals_progress_status_check
  check (progress_status in ('on_track', 'achieved', 'needs_support', 'paused'));
