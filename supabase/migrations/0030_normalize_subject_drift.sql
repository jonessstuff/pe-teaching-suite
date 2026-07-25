-- 0030_normalize_subject_drift.sql
-- =====================================================================
-- One-time data cleanup: collapse drifted lesson `subject` values onto the
-- canonical taxonomy (src/constants/modules.js SUBJECT_AREAS / SUBJECT_TAB_STYLES).
--
-- The UX review found the module LABEL "PE & Health" had leaked into a lesson's
-- subject value. The canonical subject value for that module's core is "PE".
-- A full pre-migration audit (2026-07-25) of the lessons, units, and
-- class_periods tables found "PE & Health" is the ONLY drifted value, affecting
-- exactly 1 lesson row (its top-level `subject` column and its
-- `lesson_object->>'subject'` are in sync). If more drift is ever found, add a
-- row to the `mapping` VALUES list — the statements handle any number of pairs.
--
-- REVERSIBILITY: the affected rows are snapshotted into mig0030_subject_backup
-- (id + old column subject + old json subject) BEFORE any change. Rollback SQL
-- is at the bottom of this file. jsonb_set only rewrites the {subject} key, so
-- every other field in lesson_object is preserved untouched.
-- =====================================================================

begin;

-- 1. Snapshot exactly the rows we're about to touch (kept as an audit trail).
drop table if exists mig0030_subject_backup;
create table mig0030_subject_backup as
select id,
       subject                   as old_subject,
       lesson_object->>'subject' as old_json_subject,
       now()                     as backed_up_at
from lessons
where subject = 'PE & Health'
   or lesson_object->>'subject' = 'PE & Health';

-- 2. Canonical drift mapping (from -> to). Single entry per the audit.
--    2a. Top-level denormalized column.
update lessons l
   set subject = m.to_subject
  from (values ('PE & Health', 'PE')) as m(from_subject, to_subject)
 where l.subject = m.from_subject;

--    2b. Mirror the change inside the lesson_object JSONB (only the subject key).
update lessons l
   set lesson_object = jsonb_set(l.lesson_object, '{subject}', to_jsonb(m.to_subject))
  from (values ('PE & Health', 'PE')) as m(from_subject, to_subject)
 where l.lesson_object->>'subject' = m.from_subject;

commit;

-- Verify (run manually after): expect zero rows.
--   select count(*) from lessons
--    where subject = 'PE & Health' or lesson_object->>'subject' = 'PE & Health';

-- =====================================================================
-- ROLLBACK (run only if you need to undo this migration):
--   begin;
--   update lessons l
--      set subject = b.old_subject,
--          lesson_object = jsonb_set(l.lesson_object, '{subject}', to_jsonb(b.old_json_subject))
--     from mig0030_subject_backup b
--    where l.id = b.id;
--   commit;
--   -- drop table mig0030_subject_backup;   -- once you're satisfied
-- =====================================================================
