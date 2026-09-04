-- Inclusive staff wellness challenges. Apply manually in the Supabase SQL editor before deployment.
create table if not exists staff_wellness_challenges (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  template_id text not null default 'custom',
  public_token text not null unique,
  accepting_submissions boolean not null default true,
  settings jsonb not null default '{}'::jsonb,
  participants jsonb not null default '[]'::jsonb,
  progress jsonb not null default '{}'::jsonb,
  bingo jsonb not null default '[]'::jsonb,
  messages jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table staff_wellness_challenges enable row level security;
create policy "Users manage their own staff wellness challenges" on staff_wellness_challenges for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);
create index if not exists staff_wellness_challenges_teacher_idx on staff_wellness_challenges (teacher_id, updated_at desc);

create table if not exists staff_wellness_checkins (
  id uuid primary key default uuid_generate_v4(),
  challenge_id uuid not null references staff_wellness_challenges(id) on delete cascade,
  participant_label text not null,
  team_label text,
  amount numeric not null check (amount > 0 and amount <= 100000),
  activity_type text not null default 'Challenge progress',
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  submitted_at timestamptz not null default now()
);
alter table staff_wellness_checkins enable row level security;
create policy "Challenge owners manage wellness checkins" on staff_wellness_checkins for all using (
  exists (select 1 from staff_wellness_challenges c where c.id = challenge_id and c.teacher_id = auth.uid())
) with check (
  exists (select 1 from staff_wellness_challenges c where c.id = challenge_id and c.teacher_id = auth.uid())
);

create or replace function get_public_staff_wellness_challenge(p_token text)
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'id', c.id, 'title', c.title, 'settings', c.settings, 'bingo', c.bingo,
    'accepting_submissions', c.accepting_submissions,
    'teams', coalesce((select jsonb_agg(distinct p->>'team') from jsonb_array_elements(c.participants) p where coalesce(p->>'team','') <> ''), '[]'::jsonb)
  ) from staff_wellness_challenges c where c.public_token = p_token and c.accepting_submissions = true;
$$;

create or replace function submit_staff_wellness_checkin(p_token text, p_name text, p_team text, p_amount numeric, p_activity text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_challenge uuid; v_id uuid;
begin
  select id into v_challenge from staff_wellness_challenges where public_token = p_token and accepting_submissions = true;
  if v_challenge is null then raise exception 'Challenge is not accepting submissions'; end if;
  if char_length(trim(p_name)) < 1 or p_amount <= 0 or p_amount > 100000 then raise exception 'Invalid check-in'; end if;
  insert into staff_wellness_checkins (challenge_id, participant_label, team_label, amount, activity_type)
  values (v_challenge, left(trim(p_name), 100), left(trim(coalesce(p_team,'')), 100), p_amount, left(trim(coalesce(p_activity,'Challenge progress')), 120)) returning id into v_id;
  return v_id;
end; $$;
grant execute on function get_public_staff_wellness_challenge(text) to anon, authenticated;
grant execute on function submit_staff_wellness_checkin(text, text, text, numeric, text) to anon, authenticated;
