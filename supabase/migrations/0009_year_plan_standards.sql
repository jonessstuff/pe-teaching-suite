alter table year_plan_units
  add column if not exists standards_covered text[] not null default '{}';
