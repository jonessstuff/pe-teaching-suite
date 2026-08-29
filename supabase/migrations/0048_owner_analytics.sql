create table if not exists public.conversion_events (
  id bigint generated always as identity primary key,
  event_name text not null check (event_name in ('demo_viewed', 'demo_section_viewed', 'demo_trial_clicked', 'demo_csv_downloaded')),
  section text,
  placement text,
  created_at timestamptz not null default now()
);

alter table public.conversion_events enable row level security;
drop policy if exists "anonymous conversion event insert" on public.conversion_events;
create policy "anonymous conversion event insert" on public.conversion_events
  for insert to anon, authenticated with check (
    event_name in ('demo_viewed', 'demo_section_viewed', 'demo_trial_clicked', 'demo_csv_downloaded')
    and coalesce(length(section), 0) <= 30
    and coalesce(length(placement), 0) <= 30
  );

create index if not exists conversion_events_created_at_idx on public.conversion_events (created_at desc);

create table if not exists public.cancellation_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in ('seasonal', 'price', 'not_using', 'missing_feature', 'confusing', 'output_quality', 'technical', 'other')),
  detail text check (coalesce(length(detail), 0) <= 1000),
  created_at timestamptz not null default now()
);

alter table public.cancellation_feedback enable row level security;
drop policy if exists "users submit own cancellation feedback" on public.cancellation_feedback;
create policy "users submit own cancellation feedback" on public.cancellation_feedback
  for insert to authenticated with check (auth.uid() = user_id);

create index if not exists cancellation_feedback_created_at_idx on public.cancellation_feedback (created_at desc);
