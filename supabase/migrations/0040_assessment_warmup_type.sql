-- 0040_assessment_warmup_type.sql   (idempotent; applied out-of-band)
-- =====================================================================
-- Let standalone Warm-up / Bell-ringer sets be saved into the Assessment Bank
-- alongside quizzes, rubrics, and cut & paste worksheets. Widens the
-- assessment_type CHECK. Drop-then-add keeps this safe to re-run.
-- =====================================================================
alter table assessments drop constraint if exists assessments_assessment_type_check;
alter table assessments add constraint assessments_assessment_type_check
  check (assessment_type in ('quiz', 'rubric', 'labeling', 'cut_paste', 'warmup'));
