
-- 1) Table: financing_options
create table if not exists public.financing_options (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rate numeric(4,2) not null,
  term_months integer not null,
  min_amount numeric(10,2) not null default 5000,
  is_promo boolean not null default false,
  promo_text text,
  promo_end_date date,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- simple data validations (non time-based; checks are fine)
  constraint financing_options_rate_nonnegative check (rate >= 0),
  constraint financing_options_term_positive check (term_months > 0),
  constraint financing_options_min_amount_nonnegative check (min_amount >= 0)
);

-- Helpful index for reads/sorting
create index if not exists financing_options_active_order_idx
  on public.financing_options (is_active, display_order, term_months);

-- Make name+term unique so we can safely seed without duplicates
create unique index if not exists financing_options_name_term_key
  on public.financing_options (name, term_months);

-- 2) Keep updated_at fresh
drop trigger if exists set_financing_options_updated_at on public.financing_options;
create trigger set_financing_options_updated_at
before update on public.financing_options
for each row execute function public.update_updated_at_column();

-- 3) RLS
alter table public.financing_options enable row level security;

-- Public can read active options (site visitors)
drop policy if exists "Public can view active financing options" on public.financing_options;
create policy "Public can view active financing options"
  on public.financing_options
  for select
  using (is_active = true);

-- Authenticated users can read ALL options (for Admin)
drop policy if exists "Authenticated users can view all financing" on public.financing_options;
create policy "Authenticated users can view all financing"
  on public.financing_options
  for select
  to authenticated
  using (auth.role() = 'authenticated');

-- Authenticated users can INSERT
drop policy if exists "Authenticated users can insert financing" on public.financing_options;
create policy "Authenticated users can insert financing"
  on public.financing_options
  for insert
  to authenticated
  with check (auth.role() = 'authenticated');

-- Authenticated users can UPDATE
drop policy if exists "Authenticated users can update financing" on public.financing_options;
create policy "Authenticated users can update financing"
  on public.financing_options
  for update
  to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Authenticated users can DELETE
drop policy if exists "Authenticated users can delete financing" on public.financing_options;
create policy "Authenticated users can delete financing"
  on public.financing_options
  for delete
  to authenticated
  using (auth.role() = 'authenticated');

-- 4) Seed defaults (idempotent thanks to unique index)
insert into public.financing_options
  (name, rate, term_months, min_amount, is_promo, promo_text, promo_end_date, is_active, display_order)
values
  ('Mercury Summer Promo', 4.90, 60,  5000, true,  'Special Mercury financing until August 31!', '2025-08-31', true, 1),
  ('Standard 36 Month',    7.99, 36,  5000, false, null, null, true, 2),
  ('Standard 48 Month',    8.99, 48,  5000, false, null, null, true, 3),
  ('Extended 72 Month',    9.99, 72, 10000, false, null, null, true, 4)
on conflict on constraint financing_options_name_term_key do nothing;
