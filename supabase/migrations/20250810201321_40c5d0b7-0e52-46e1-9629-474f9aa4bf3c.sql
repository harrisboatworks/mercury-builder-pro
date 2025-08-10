-- Create public storage bucket for quotes PDFs if it doesn't exist
insert into storage.buckets (id, name, public)
values ('quotes', 'quotes', true)
on conflict (id) do nothing;

-- Create quotes table to store quote records
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  customer_name text,
  customer_phone text,
  motor_model text,
  motor_price numeric,
  total_price numeric,
  pdf_url text,
  quote_data jsonb,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.quotes enable row level security;

-- Storage policies for the quotes bucket (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public can read quotes PDFs'
  ) THEN
    CREATE POLICY "Public can read quotes PDFs"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'quotes');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Anon can upload quotes PDFs'
  ) THEN
    CREATE POLICY "Anon can upload quotes PDFs"
      ON storage.objects
      FOR INSERT
      WITH CHECK (bucket_id = 'quotes');
  END IF;
END $$;

-- Quotes table policies (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'quotes' AND policyname = 'Anyone can insert quotes'
  ) THEN
    CREATE POLICY "Anyone can insert quotes"
      ON public.quotes
      FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'quotes' AND policyname = 'Quotes are viewable by everyone'
  ) THEN
    CREATE POLICY "Quotes are viewable by everyone"
      ON public.quotes
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- Optional index for created_at
create index if not exists quotes_created_at_idx on public.quotes (created_at desc);