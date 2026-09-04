create table if not exists grant_projects (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  module_label text not null default 'General / Schoolwide',
  source_type text not null default 'manual' check (source_type in ('federal','state','local','private','manual')),
  external_id text,
  opportunity_number text,
  title text not null,
  funder text not null default '',
  source_url text not null default '',
  open_date date,
  close_date date,
  amount_text text not null default '',
  eligibility_summary text not null default '',
  official_requirements text not null default '',
  status text not null default 'saved' check (status in ('saved','drafting','ready','submitted','awarded','not_fit')),
  finder_data jsonb not null default '{}'::jsonb,
  application_inputs jsonb not null default '{}'::jsonb,
  draft jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table grant_projects enable row level security;

create policy "Teachers manage their own grant projects"
  on grant_projects for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

create index if not exists grant_projects_teacher_deadline_idx
  on grant_projects (teacher_id, close_date, updated_at desc);

create unique index if not exists grant_projects_teacher_external_idx
  on grant_projects (teacher_id, source_type, external_id)
  where external_id is not null;
