-- Add accommodation_type column to students table for visual tracking
alter table students
  add column if not exists accommodation_type text
    check (accommodation_type in ('IEP', '504', 'ELL', 'Other', 'None'))
    default 'None';
