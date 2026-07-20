-- Allow multiple active sessions per user (up to MAX_SESSIONS, enforced in app).
--
-- Previously: user_id was the primary key, limiting one row per user.
-- Now: session_token is the primary key; user_id is a regular indexed FK
-- so multiple rows per user are permitted at the DB level.

-- Drop the old single-user PK constraint.
alter table active_sessions drop constraint if exists active_sessions_pkey;

-- Promote session_token to the new primary key.
-- session_token is already "not null" and is a UUID minted per-login,
-- so it is unique in practice. Making it the PK enforces that at the DB level.
alter table active_sessions add primary key (session_token);

-- Index user_id so count/delete queries scoped to a user stay fast.
-- (The FK to auth.users and the ON DELETE CASCADE are unchanged.)
create index if not exists active_sessions_user_id_idx on active_sessions (user_id);
