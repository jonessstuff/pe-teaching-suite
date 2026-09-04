-- =====================================================================
-- 0064_school_interest_qualification.sql
-- Richer school/district lead qualification and owner follow-up fields.
-- Existing leads remain valid and appear as unqualified/exploring records.
-- =====================================================================

alter table public.school_interest
  add column if not exists role text,
  add column if not exists location text,
  add column if not exists organization_scope text,
  add column if not exists specialties text[] not null default '{}',
  add column if not exists interest_type text,
  add column if not exists timeline text,
  add column if not exists primary_goal text,
  add column if not exists preferred_next_step text,
  add column if not exists lead_tier text not null default 'exploring',
  add column if not exists lead_status text not null default 'new',
  add column if not exists last_contacted_at timestamptz,
  add column if not exists follow_up_at date,
  add column if not exists owner_note text;

alter table public.school_interest
  drop constraint if exists school_interest_role_len,
  add constraint school_interest_role_len check (role is null or char_length(role) <= 120),
  drop constraint if exists school_interest_location_len,
  add constraint school_interest_location_len check (location is null or char_length(location) <= 160),
  drop constraint if exists school_interest_scope_valid,
  add constraint school_interest_scope_valid check (organization_scope is null or organization_scope in ('department', 'school', 'multiple_schools', 'district')),
  drop constraint if exists school_interest_type_valid,
  add constraint school_interest_type_valid check (interest_type is null or interest_type in ('pricing', 'demo', 'pilot', 'admin_packet', 'exploring')),
  drop constraint if exists school_interest_timeline_valid,
  add constraint school_interest_timeline_valid check (timeline is null or timeline in ('immediately', 'this_semester', 'next_semester', 'next_school_year', 'unsure')),
  drop constraint if exists school_interest_next_step_valid,
  add constraint school_interest_next_step_valid check (preferred_next_step is null or preferred_next_step in ('email_information', 'walkthrough', 'pilot_conversation', 'admin_packet')),
  drop constraint if exists school_interest_goal_len,
  add constraint school_interest_goal_len check (primary_goal is null or char_length(primary_goal) <= 2000),
  drop constraint if exists school_interest_tier_valid,
  add constraint school_interest_tier_valid check (lead_tier in ('hot', 'warm', 'exploring')),
  drop constraint if exists school_interest_status_valid,
  add constraint school_interest_status_valid check (lead_status in ('new', 'contacted', 'replied', 'demo_scheduled', 'pilot_discussion', 'not_now', 'closed')),
  drop constraint if exists school_interest_owner_note_len,
  add constraint school_interest_owner_note_len check (owner_note is null or char_length(owner_note) <= 3000),
  drop constraint if exists school_interest_specialties_count,
  add constraint school_interest_specialties_count check (cardinality(specialties) <= 20);

create index if not exists school_interest_lead_status_idx
  on public.school_interest (lead_status, created_at desc);

