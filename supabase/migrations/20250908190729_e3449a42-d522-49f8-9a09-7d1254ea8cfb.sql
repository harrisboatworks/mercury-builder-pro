-- Fix the admin policy to be explicitly scoped to authenticated users
-- This removes the last anonymous access warning for customer_quotes

DROP POLICY IF EXISTS "Admins can access customer quotes for support" ON public.customer_quotes;

CREATE POLICY "Admins can access customer quotes for support" 
ON public.customer_quotes 
FOR ALL 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));