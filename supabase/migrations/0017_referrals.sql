create table if not exists referrals (
  id            uuid primary key default uuid_generate_v4(),
  referrer_id   uuid not null references profiles(id) on delete cascade,
  referee_id    uuid references profiles(id) on delete set null,
  referral_code text not null,
  status        text not null default 'pending'
                  check (status in ('pending', 'signed_up', 'subscribed', 'credited')),
  created_at    timestamptz not null default now(),
  credited_at   timestamptz
);

create unique index if not exists idx_referrals_code_referee
  on referrals (referral_code, referee_id);

create index if not exists idx_referrals_referrer on referrals(referrer_id);

alter table referrals enable row level security;

create policy "Users manage their own referrals"
  on referrals for all
  using  (auth.uid() = referrer_id)
  with check (auth.uid() = referrer_id);
