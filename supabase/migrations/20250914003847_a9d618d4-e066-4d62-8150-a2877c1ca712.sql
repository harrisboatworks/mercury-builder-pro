-- Comprehensive security fix for customer data tables (corrected)
-- This addresses all remaining security vulnerabilities for customer personal information

-- 1. Fix customer_quotes table - strengthen policies further
DROP POLICY IF EXISTS "Admins can access customer quotes for support" ON public.customer_quotes;
DROP POLICY IF EXISTS "Authenticated users can view their own quotes only" ON public.customer_quotes;
DROP POLICY IF EXISTS "Authenticated users can create their own quotes only" ON public.customer_quotes;
DROP POLICY IF EXISTS "Authenticated users can update their own quotes only" ON public.customer_quotes;
DROP POLICY IF EXISTS "Authenticated users can delete their own quotes only" ON public.customer_quotes;

-- Create ultra-secure policies for customer_quotes with explicit role restrictions
CREATE POLICY "Secure admin access to customer quotes"
ON public.customer_quotes
FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Secure user access to own quotes only"
ON public.customer_quotes
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Secure user quote creation"
ON public.customer_quotes
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Secure user quote updates"
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

CREATE POLICY "Secure user quote deletion"
ON public.customer_quotes
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id
);

-- 2. Strengthen quotes table security
DROP POLICY IF EXISTS "Admins can access all quotes" ON public.quotes;
DROP POLICY IF EXISTS "Authenticated users can view their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Authenticated users can create their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Authenticated users can update their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Authenticated users can delete their own quotes" ON public.quotes;

CREATE POLICY "Secure admin access to all quotes"
ON public.quotes
FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Secure user access to own quotes only"
ON public.quotes
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Secure user quote creation only"
ON public.quotes
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Secure user quote updates only"
ON public.quotes
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

CREATE POLICY "Secure user quote deletion only"
ON public.quotes
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id
);

-- 3. Strengthen profiles table security
DROP POLICY IF EXISTS "Enhanced secure profile access" ON public.profiles;
DROP POLICY IF EXISTS "Secure profile insert - authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Secure profile update - authenticated users only" ON public.profiles;

CREATE POLICY "Ultra secure profile access - own profile only"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Ultra secure profile creation - own profile only"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Ultra secure profile updates - own profile only"
ON public.profiles
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

-- 4. Add security validation function
CREATE OR REPLACE FUNCTION public.validate_customer_data_ownership(table_name text, record_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate that current user can access this customer data
  RETURN (
    auth.uid() IS NOT NULL AND
    record_user_id IS NOT NULL AND
    (auth.uid() = record_user_id OR has_role(auth.uid(), 'admin'::app_role))
  );
END;
$$;