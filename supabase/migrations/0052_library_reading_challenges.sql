-- Library reading challenges with roster-connected progress and private teacher notes.
-- APPLY MANUALLY (out-of-band) via the Supabase SQL editor before production use.

create table if not exists library_reading_challenges (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  theme text not null default 'custom',
  scope text not null default 'class' check (scope in ('class', 'grade', 'whole_school')),
  metric text not null default 'books' check (metric in ('books', 'minutes', 'pages', 'genres')),
  target_mode text not null default 'collective' check (target_mode in ('collective', 'per_reader')),
  goal_value numeric not null check (goal_value > 0),
  grade_label text,
  class_period_ids uuid[] not null default '{}'::uuid[],
  starts_on date not null,
  ends_on date not null,
  status text not null default 'active' check (status in ('draft', 'active', 'completed', 'archived')),
  progress jsonb not null default '{}'::jsonb,
  logs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

alter table library_reading_challenges enable row level security;

create policy "Users manage their own library reading challenges" on library_reading_challenges
  for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

create index if not exists library_reading_challenges_teacher_idx
  on library_reading_challenges (teacher_id, updated_at desc);

create table if not exists library_newsletters (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  audience text not null default 'family' check (audience in ('family', 'staff')),
  issue_month text not null,
  draft jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table library_newsletters enable row level security;

create policy "Users manage their own library newsletters" on library_newsletters
  for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

create index if not exists library_newsletters_teacher_idx
  on library_newsletters (teacher_id, updated_at desc);

create table if not exists library_catalog_books (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  author text not null default 'Unknown author',
  genres text[] not null default '{}'::text[],
  grade_min integer,
  grade_max integer,
  format text not null default 'Book',
  themes text[] not null default '{}'::text[],
  series text,
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (teacher_id, title, author)
);

alter table library_catalog_books enable row level security;
create policy "Users manage their own library catalog" on library_catalog_books
  for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);
create index if not exists library_catalog_books_teacher_idx on library_catalog_books (teacher_id, title);

create table if not exists library_projects (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  project_type text not null check (project_type in ('book_tasting', 'teacher_collaboration', 'family_literacy_night', 'research_quest')),
  title text not null,
  inputs jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table library_projects enable row level security;
create policy "Users manage their own library projects" on library_projects
  for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);
create index if not exists library_projects_teacher_idx on library_projects (teacher_id, project_type, updated_at desc);
