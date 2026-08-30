-- Pul idarəsi (money management) üçün cədvəl.
-- Supabase → SQL Editor-də bir dəfə işlədin.

create table if not exists public.transactions (
  id         text primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  date       text not null,                       -- 'YYYY-MM-DD'
  type       text not null check (type in ('in', 'out')),
  amount     numeric not null check (amount > 0),
  category   text,
  note       text,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date);

alter table public.transactions enable row level security;

create policy "Users manage own transactions"
  on public.transactions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
