-- CRITICAL PRIVACY FIX: Ensure customer_quotes policies explicitly require authentication
-- This prevents any potential anonymous access to sensitive customer data

-- Drop existing policies to recreate with explicit authentication checks
DROP POLICY IF EXISTS "Users can create their own quotes" ON public.customer_quotes;
DROP POLICY IF EXISTS "Users can delete their own quotes" ON public.customer_quotes;
DROP POLICY IF EXISTS "Users can update their own quotes" ON public.customer_quotes;
DROP POLICY IF EXISTS "Users can view their own quotes" ON public.customer_quotes;

-- Recreate policies with explicit authentication requirements
CREATE POLICY "Authenticated users can create their own quotes" 
ON public.customer_quotes 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view their own quotes" 
ON public.customer_quotes 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own quotes" 
ON public.customer_quotes 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own quotes" 
ON public.customer_quotes 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Admin policy remains unchanged as it's already properly scoped
-- "Admins can access customer quotes for support" policy stays as-is