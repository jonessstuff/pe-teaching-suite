-- =====================================================================
-- 0023_whats_new_version.sql
-- =====================================================================
-- Per-user "What's New" tracking. Stores the highest release version the
-- user has acknowledged (dismissed). The client shows the What's New
-- banner whenever WHATS_NEW.version (src/constants/whatsNew.js) is greater
-- than this value, then writes the new version back on dismiss.
--
-- Defaults to 0 so every existing user sees the current release notes once.
-- =====================================================================

alter table profiles
  add column if not exists whats_new_version int not null default 0;
