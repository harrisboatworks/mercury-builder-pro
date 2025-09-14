-- Fix customer_quotes RLS policies to prevent anonymous access and strengthen security

-- First, drop existing policies
DROP POLICY IF EXISTS "Admins can access customer quotes for support" ON public.customer_quotes;
DROP POLICY IF EXISTS "Authenticated users can create their own quotes" ON public.customer_quotes;
DROP POLICY IF EXISTS "Authenticated users can delete their own quotes" ON public.customer_quotes;
DROP POLICY IF EXISTS "Authenticated users can update their own quotes" ON public.customer_quotes;
DROP POLICY IF EXISTS "Secure customer quotes access" ON public.customer_quotes;

-- Create strengthened policies that explicitly restrict to authenticated users
CREATE POLICY "Admins can access customer quotes for support"
ON public.customer_quotes
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view their own quotes only"
ON public.customer_quotes
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Authenticated users can create their own quotes only"
ON public.customer_quotes
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Authenticated users can update their own quotes only"
ON public.customer_quotes
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Authenticated users can delete their own quotes only"
ON public.customer_quotes
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id
);

-- Ensure user_id is NOT NULL to prevent orphaned records
ALTER TABLE public.customer_quotes ALTER COLUMN user_id SET NOT NULL;

-- Add additional security function to validate customer data access
CREATE OR REPLACE FUNCTION public.validate_customer_quote_access(quote_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  quote_owner uuid;
  current_user_id uuid;
BEGIN
  -- Get current authenticated user
  current_user_id := auth.uid();
  
  -- If no authenticated user, deny access
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get the quote owner
  SELECT user_id INTO quote_owner 
  FROM public.customer_quotes 
  WHERE id = quote_id;
  
  -- Check if user owns the quote or is admin
  RETURN (
    quote_owner = current_user_id OR 
    has_role(current_user_id, 'admin'::app_role)
  );
END;
$$;