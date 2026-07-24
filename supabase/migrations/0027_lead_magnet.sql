-- "Try one free lesson" lead magnet.
--
-- Captures a visitor's email, gates them to ONE generated lesson per email,
-- stores the generated lesson so the follow-up email can link back to it, and
-- tracks the two-step email sequence (welcome + follow-up).
create table if not exists lead_magnet_lessons (
  id              uuid primary key default gen_random_uuid(),
  email           text not null,
  access_token    uuid not null default gen_random_uuid(),
  ip              text,
  subject         text,
  topic           text,
  grade_label     text,
  lesson_object   jsonb,
  status          text not null default 'pending' check (status in ('pending','generated')),
  created_at      timestamptz not null default now(),
  -- The offer to generate expires if unused; once generated, the lesson stays
  -- viewable via access_token indefinitely (the email links to it).
  expires_at      timestamptz not null default (now() + interval '48 hours'),
  generated_at    timestamptz,
  welcome_sent_at   timestamptz,
  followup_sent_at  timestamptz
);

-- One row per email = the "1 free lesson per email" guard (case-insensitive).
create unique index if not exists idx_lead_magnet_email  on lead_magnet_lessons (lower(email));
create unique index if not exists idx_lead_magnet_token  on lead_magnet_lessons (access_token);
-- Supports the per-IP daily soft-cap and the follow-up sweep.
create index if not exists idx_lead_magnet_ip     on lead_magnet_lessons (ip, created_at);
create index if not exists idx_lead_magnet_sweep  on lead_magnet_lessons (status, followup_sent_at, generated_at);

-- Only the service-role edge function touches this table; RLS with no policies
-- keeps it invisible to anon/authenticated clients.
alter table lead_magnet_lessons enable row level security;
