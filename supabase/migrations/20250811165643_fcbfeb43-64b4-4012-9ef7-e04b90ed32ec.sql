-- Security hardening migration
-- 1) Roles: enum + user_roles table + helper functions
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
-- No public policies; managed by service role or admins from SQL Console.

-- Security definer functions to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id AND ur.role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(public.has_role(_user_id, 'admin'), false);
$$;

-- 2) Lock down public.quotes to owner + admin
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS user_id uuid;

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Drop overly permissive policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Anyone can insert quotes" ON public.quotes;
EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Quotes are viewable by everyone" ON public.quotes;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

-- Owner-scoped policies with admin override
CREATE POLICY IF NOT EXISTS "Users can view their own quotes"
ON public.quotes FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY IF NOT EXISTS "Users can insert their own quotes"
ON public.quotes FOR INSERT
WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY IF NOT EXISTS "Users can update their own quotes"
ON public.quotes FOR UPDATE
USING (auth.uid() = user_id OR public.is_admin())
WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY IF NOT EXISTS "Users can delete their own quotes"
ON public.quotes FOR DELETE
USING (auth.uid() = user_id OR public.is_admin());

-- 3) Lock down promotions and promotions_rules mutations to admins only
-- promotions
DO $$ BEGIN
  DROP POLICY IF EXISTS "Authenticated users can insert promotions" ON public.promotions;
EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Authenticated users can update promotions" ON public.promotions;
EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Authenticated users can delete promotions" ON public.promotions;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

CREATE POLICY IF NOT EXISTS "Admins can insert promotions"
ON public.promotions FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY IF NOT EXISTS "Admins can update promotions"
ON public.promotions FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY IF NOT EXISTS "Admins can delete promotions"
ON public.promotions FOR DELETE
USING (public.is_admin());

-- promotions_rules
DO $$ BEGIN
  DROP POLICY IF EXISTS "Authenticated users can insert promotions_rules" ON public.promotions_rules;
EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Authenticated users can update promotions_rules" ON public.promotions_rules;
EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Authenticated users can delete promotions_rules" ON public.promotions_rules;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

CREATE POLICY IF NOT EXISTS "Admins can insert promotions_rules"
ON public.promotions_rules FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY IF NOT EXISTS "Admins can update promotions_rules"
ON public.promotions_rules FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY IF NOT EXISTS "Admins can delete promotions_rules"
ON public.promotions_rules FOR DELETE
USING (public.is_admin());

-- 4) Harden heartbeat (enable RLS; no public policies)
ALTER TABLE public.heartbeat ENABLE ROW LEVEL SECURITY;

-- 5) Make quotes storage bucket private and add owner-only policies
UPDATE storage.buckets SET public = false WHERE id = 'quotes';

-- Storage policies on storage.objects for bucket 'quotes' using folder prefix user_id/<file>
-- This pattern allows users to access only files under their own UUID folder, admins can access all
CREATE POLICY IF NOT EXISTS "Users can view their own quote files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'quotes'
  AND (
    public.is_admin()
    OR auth.uid()::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY IF NOT EXISTS "Users can upload their own quote files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'quotes'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can update their own quote files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'quotes'
  AND (
    public.is_admin()
    OR auth.uid()::text = (storage.foldername(name))[1]
  )
)
WITH CHECK (
  bucket_id = 'quotes'
  AND (
    public.is_admin()
    OR auth.uid()::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY IF NOT EXISTS "Users can delete their own quote files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'quotes'
  AND (
    public.is_admin()
    OR auth.uid()::text = (storage.foldername(name))[1]
  )
);
