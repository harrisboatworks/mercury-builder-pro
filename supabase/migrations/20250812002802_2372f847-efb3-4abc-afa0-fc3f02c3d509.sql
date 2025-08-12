-- Security hardening migration
-- 1) Lock down public.quotes (remove public access policies)
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert quotes" ON public.quotes;
DROP POLICY IF EXISTS "Quotes are viewable by everyone" ON public.quotes;

-- 2) Enable RLS on heartbeat (service role will continue to work via server-side code)
ALTER TABLE public.heartbeat ENABLE ROW LEVEL SECURITY;

-- 3) Make 'quotes' bucket private
UPDATE storage.buckets SET public = false WHERE id = 'quotes';