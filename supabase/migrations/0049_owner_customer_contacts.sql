-- Private owner CRM notes. Service-role edge functions are the only access path.
create table if not exists public.owner_customer_contacts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_contacted_at timestamptz,
  follow_up_at timestamptz,
  outcome text check (outcome is null or outcome in ('contacted', 'replied', 'returned', 'still_inactive', 'canceled')),
  note text check (note is null or char_length(note) <= 2000),
  updated_at timestamptz not null default now()
);

alter table public.owner_customer_contacts enable row level security;

