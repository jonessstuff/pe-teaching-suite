-- Expire shared-lesson links 30 days after creation. Enforced server-side in
-- the get-shared-lesson edge function (which reads with the service role).
alter table shared_lessons
  add column if not exists expires_at timestamptz;

-- Backfill existing links to 30 days after they were created. Links already
-- older than that become expired immediately (they've been open long enough).
update shared_lessons
  set expires_at = created_at + interval '30 days'
  where expires_at is null;

-- New links default to 30 days from creation; lock the column NOT NULL.
alter table shared_lessons
  alter column expires_at set default (now() + interval '30 days'),
  alter column expires_at set not null;
