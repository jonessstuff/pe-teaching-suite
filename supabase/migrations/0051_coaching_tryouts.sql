-- Coach-editable tryout scoring and post-selection team workspace.
-- APPLY MANUALLY (out-of-band) via the Supabase SQL editor.

create table if not exists coaching_workspaces (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  team_name text not null,
  sport text not null,
  season text,
  status text not null default 'tryouts' check (status in ('tryouts', 'team', 'archived')),
  rubric jsonb not null default '[]'::jsonb,
  comment_tags jsonb not null default '[]'::jsonb,
  comments_affect_score boolean not null default true,
  tryout_days jsonb not null default '[]'::jsonb,
  candidates jsonb not null default '[]'::jsonb,
  team_tools jsonb not null default '{"practices":[],"plays":[],"events":[]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table coaching_workspaces enable row level security;

create policy "Users manage their own coaching workspaces" on coaching_workspaces
  for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

create index if not exists coaching_workspaces_teacher_idx
  on coaching_workspaces (teacher_id, updated_at desc);
