-- XP Rewards System Migration
-- 1) Extend quotes table with XP fields
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS xp_earned INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reward_claimed TEXT;

-- 2) Create customer_xp table to track user totals and claimed rewards
CREATE TABLE IF NOT EXISTS public.customer_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  total_xp INTEGER NOT NULL DEFAULT 0,
  rewards_claimed JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_customer_xp_user UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.customer_xp ENABLE ROW LEVEL SECURITY;

-- Policies: users can view and manage their own XP
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'customer_xp' AND policyname = 'Users can view their own XP' 
  ) THEN
    CREATE POLICY "Users can view their own XP" ON public.customer_xp
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'customer_xp' AND policyname = 'Users can insert their own XP row' 
  ) THEN
    CREATE POLICY "Users can insert their own XP row" ON public.customer_xp
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'customer_xp' AND policyname = 'Users can update their own XP' 
  ) THEN
    CREATE POLICY "Users can update their own XP" ON public.customer_xp
      FOR UPDATE TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 3) Trigger to maintain updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_customer_xp_updated_at' AND tgrelid = 'public.customer_xp'::regclass
  ) THEN
    CREATE TRIGGER update_customer_xp_updated_at
    BEFORE UPDATE ON public.customer_xp
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
