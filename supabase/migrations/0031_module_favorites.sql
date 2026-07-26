-- Per-user module favorites for the module picker.
--
-- A signed-in user can "star" any module; favorited modules are pinned to the
-- top of the module picker, above the regular grouped categories. Favorites are
-- per-user, persist across sessions, and have no limit.
--
-- module_key is the module's stable route slug (e.g. 'pe-health', 'jrotc',
-- 'school-counselors'). It is intentionally free text, not a foreign key or
-- enum — modules are a client-side catalog, not a DB table, so a stale key from
-- a removed/renamed module is harmless (it simply matches nothing to pin).
create table if not exists module_favorites (
  user_id     uuid not null references profiles(id) on delete cascade,
  module_key  text not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, module_key)      -- one row per (user, module); enforces no-dupes, no explicit limit
);

-- Fast "my favorites, most-recent-first" lookup.
create index if not exists idx_module_favorites_user
  on module_favorites (user_id, created_at desc);

alter table module_favorites enable row level security;

-- Each user sees and manages only their own favorites.
create policy "Users manage their own module favorites"
  on module_favorites for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
