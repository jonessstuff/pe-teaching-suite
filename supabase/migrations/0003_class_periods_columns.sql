-- =====================================================================
-- Add missing columns to class_periods
-- =====================================================================
-- The initial migration used the existing DB column "label" but the
-- service/UI code was written expecting "name", "subject",
-- "duration_minutes", and "room_label". This migration adds the three
-- missing columns. The "label" vs "name" mismatch is fixed in code
-- (not by renaming the column) to avoid breaking existing rows.
-- =====================================================================

alter table class_periods
  add column if not exists subject text not null default 'PE',
  add column if not exists duration_minutes int,
  add column if not exists room_label text;
