alter table grant_projects
  add column if not exists grade_band text not null default 'K–12',
  add column if not exists school_type text not null default 'Public School',
  add column if not exists title_i_status text not null default 'Not specified',
  add column if not exists free_reduced_lunch_percent numeric;

alter table grant_projects
  drop constraint if exists grant_projects_grade_band_check,
  add constraint grant_projects_grade_band_check
    check (grade_band in ('K–12', 'Elementary School', 'Middle School', 'High School')),
  drop constraint if exists grant_projects_school_type_check,
  add constraint grant_projects_school_type_check
    check (school_type in ('Public School', 'Private School')),
  drop constraint if exists grant_projects_title_i_status_check,
  add constraint grant_projects_title_i_status_check
    check (title_i_status in ('Not specified', 'Title I school', 'Not a Title I school')),
  drop constraint if exists grant_projects_free_reduced_lunch_percent_check,
  add constraint grant_projects_free_reduced_lunch_percent_check
    check (free_reduced_lunch_percent is null or (free_reduced_lunch_percent >= 0 and free_reduced_lunch_percent <= 100));
