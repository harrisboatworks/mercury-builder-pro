-- XP migration: quotes columns + customer_xp table with RLS and triggers

-- Ensure updated_at helper exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Alter quotes table to track XP and reward
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS xp_earned INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reward_claimed TEXT;

-- Create customer_xp table to track total XP per user
CREATE TABLE IF NOT EXISTS public.customer_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  phone TEXT,
  total_xp INTEGER NOT NULL DEFAULT 0,
  rewards_claimed JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_xp ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid duplicates) and recreate
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'customer_xp' AND policyname = 'Users can view their own XP'
  ) THEN
    DROP POLICY "Users can view their own XP" ON public.customer_xp;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'customer_xp' AND policyname = 'Users can insert their own XP'
  ) THEN
    DROP POLICY "Users can insert their own XP" ON public.customer_xp;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'customer_xp' AND policyname = 'Users can update their own XP'
  ) THEN
    DROP POLICY "Users can update their own XP" ON public.customer_xp;
  END IF;
END $$;

CREATE POLICY "Users can view their own XP"
ON public.customer_xp
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own XP"
ON public.customer_xp
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own XP"
ON public.customer_xp
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger to maintain updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_customer_xp_updated_at'
  ) THEN
    CREATE TRIGGER update_customer_xp_updated_at
    BEFORE UPDATE ON public.customer_xp
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;