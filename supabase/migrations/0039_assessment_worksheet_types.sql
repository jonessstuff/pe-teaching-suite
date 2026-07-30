-- 0039_assessment_worksheet_types.sql   (idempotent; applied out-of-band)
-- =====================================================================
-- Let two Worksheet formats — labeling and cut & paste — be saved into the
-- Assessment Bank alongside quizzes and rubrics. Widens the assessment_type
-- CHECK constraint (was: 'quiz' | 'rubric').
-- Drop-then-add keeps this safe to re-run.
-- =====================================================================
alter table assessments drop constraint if exists assessments_assessment_type_check;
alter table assessments add constraint assessments_assessment_type_check
  check (assessment_type in ('quiz', 'rubric', 'labeling', 'cut_paste'));
