alter table lessons
  add column if not exists is_favorite boolean not null default false;

alter table lessons
  add column if not exists tags text[] not null default '{}';

create index if not exists idx_lessons_is_favorite on lessons(teacher_id, is_favorite);
create index if not exists idx_lessons_tags        on lessons using gin(tags);
