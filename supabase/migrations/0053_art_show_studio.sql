-- Saved Art Show Studio projects. Apply manually through the Supabase SQL editor before deployment.
create table if not exists art_show_projects (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  inputs jsonb not null default '{}'::jsonb,
  artworks jsonb not null default '[]'::jsonb,
  plan jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table art_show_projects enable row level security;
create policy "Users manage their own art show projects" on art_show_projects
  for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);
create index if not exists art_show_projects_teacher_idx on art_show_projects (teacher_id, updated_at desc);
