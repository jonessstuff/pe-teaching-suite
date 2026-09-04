create table if not exists product_usage_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  tool_key text not null check (char_length(tool_key) between 1 and 80),
  action text not null check (action in (
    'opened', 'template_selected', 'created', 'updated', 'completed',
    'reopened', 'printed', 'exported', 'copied'
  )),
  module_label text check (module_label is null or char_length(module_label) <= 80),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

alter table product_usage_events enable row level security;

drop policy if exists "Users insert their own product usage events"
  on product_usage_events;
drop policy if exists "Users read their own product usage events"
  on product_usage_events;

create policy "Users insert their own product usage events"
  on product_usage_events for insert
  with check (auth.uid() = user_id);

create policy "Users read their own product usage events"
  on product_usage_events for select
  using (auth.uid() = user_id);

create index if not exists product_usage_events_user_idx
  on product_usage_events (user_id, created_at desc);
create index if not exists product_usage_events_tool_idx
  on product_usage_events (tool_key, created_at desc);
create index if not exists product_usage_events_module_idx
  on product_usage_events (module_label, created_at desc);
