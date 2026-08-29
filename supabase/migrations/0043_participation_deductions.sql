-- Participation Tracker Phase 2: additive deductions on a 100-point daily grade.
-- Existing rows retain their historical percentage by scaling 10-point values
-- to 100. They remain identifiable by their legacy status until edited.
-- APPLY MANUALLY (out-of-band) via the Supabase SQL editor.

alter table participation_config
  add column if not exists deductions jsonb not null default '[
    {"key":"wrong_shoes","label":"Incorrect Shoes","points":5},
    {"key":"wrong_clothing","label":"Incorrect Clothing","points":5},
    {"key":"no_participation","label":"No Participation","points":50}
  ]'::jsonb;

alter table participation_records
  add column if not exists deductions jsonb not null default '{}'::jsonb,
  add column if not exists exempt_reason text;

update participation_config
set max_points = 100,
    deductions = '[
      {"key":"wrong_shoes","label":"Incorrect Shoes","points":5},
      {"key":"wrong_clothing","label":"Incorrect Clothing","points":5},
      {"key":"no_participation","label":"No Participation","points":50}
    ]'::jsonb,
    updated_at = now()
where max_points <> 100 or deductions is null;

update participation_records
set points = points * 10
where status <> 'deductions' and not exempt and points between 0 and 10;

update participation_records
set exempt_reason = status
where exempt and status in ('absent', 'medical') and exempt_reason is null;

alter table participation_records drop constraint if exists participation_records_exempt_reason_check;
alter table participation_records add constraint participation_records_exempt_reason_check
  check (exempt_reason is null or exempt_reason in ('absent', 'medical'));
