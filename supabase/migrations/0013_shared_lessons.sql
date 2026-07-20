create table if not exists shared_lessons (
  id          uuid primary key default uuid_generate_v4(),
  lesson_id   uuid not null references lessons(id) on delete cascade,
  teacher_id  uuid not null references profiles(id) on delete cascade,
  share_token uuid unique not null default uuid_generate_v4(),
  view_count  int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists idx_shared_lessons_teacher_id  on shared_lessons(teacher_id);
create index if not exists idx_shared_lessons_lesson_id   on shared_lessons(lesson_id);
create index if not exists idx_shared_lessons_share_token on shared_lessons(share_token);

alter table shared_lessons enable row level security;

-- Authenticated owners can manage their shares
create policy "Users manage their own shared lessons"
  on shared_lessons for all
  using  (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);
