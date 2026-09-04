-- Privacy-safe acquisition tracking. The visitor id is a random browser token,
-- never an email, name, student id, or lesson value. Stripe returns the same
-- token as checkout.session.client_reference_id so a completed checkout can be
-- joined to the campaign that brought the teacher to PlansK12.

alter table public.conversion_events
  drop constraint if exists conversion_events_event_name_check;

alter table public.conversion_events
  add constraint conversion_events_event_name_check check (event_name in (
    'site_viewed', 'trial_clicked', 'demo_viewed', 'demo_section_viewed',
    'demo_trial_clicked', 'demo_csv_downloaded'
  )),
  add column if not exists visitor_id text,
  add column if not exists campaign_source text,
  add column if not exists campaign_medium text,
  add column if not exists campaign_name text,
  add column if not exists campaign_module text,
  add column if not exists campaign_content text,
  add column if not exists path text;

alter table public.conversion_events
  drop constraint if exists conversion_events_visitor_id_length,
  add constraint conversion_events_visitor_id_length check (coalesce(length(visitor_id), 0) <= 64),
  drop constraint if exists conversion_events_campaign_source_length,
  add constraint conversion_events_campaign_source_length check (coalesce(length(campaign_source), 0) <= 100),
  drop constraint if exists conversion_events_campaign_medium_length,
  add constraint conversion_events_campaign_medium_length check (coalesce(length(campaign_medium), 0) <= 100),
  drop constraint if exists conversion_events_campaign_name_length,
  add constraint conversion_events_campaign_name_length check (coalesce(length(campaign_name), 0) <= 100),
  drop constraint if exists conversion_events_campaign_module_length,
  add constraint conversion_events_campaign_module_length check (coalesce(length(campaign_module), 0) <= 100),
  drop constraint if exists conversion_events_campaign_content_length,
  add constraint conversion_events_campaign_content_length check (coalesce(length(campaign_content), 0) <= 100),
  drop constraint if exists conversion_events_path_length,
  add constraint conversion_events_path_length check (coalesce(length(path), 0) <= 200);

drop policy if exists "anonymous conversion event insert" on public.conversion_events;
create policy "anonymous conversion event insert" on public.conversion_events
  for insert to anon, authenticated with check (
    event_name in (
      'site_viewed', 'trial_clicked', 'demo_viewed', 'demo_section_viewed',
      'demo_trial_clicked', 'demo_csv_downloaded'
    )
    and coalesce(length(section), 0) <= 30
    and coalesce(length(placement), 0) <= 30
    and coalesce(length(visitor_id), 0) <= 64
    and coalesce(length(campaign_source), 0) <= 100
    and coalesce(length(campaign_medium), 0) <= 100
    and coalesce(length(campaign_name), 0) <= 100
    and coalesce(length(campaign_module), 0) <= 100
    and coalesce(length(campaign_content), 0) <= 100
    and coalesce(length(path), 0) <= 200
  );

create index if not exists conversion_events_visitor_idx
  on public.conversion_events (visitor_id, created_at desc);
create index if not exists conversion_events_campaign_idx
  on public.conversion_events (campaign_name, created_at desc);

alter table public.profiles
  add column if not exists acquisition_visitor_id text,
  add column if not exists acquisition_source text,
  add column if not exists acquisition_medium text,
  add column if not exists acquisition_campaign text,
  add column if not exists acquisition_module text,
  add column if not exists acquisition_content text,
  add column if not exists acquired_at timestamptz;

create index if not exists profiles_acquisition_campaign_idx
  on public.profiles (acquisition_campaign, created_at desc);
