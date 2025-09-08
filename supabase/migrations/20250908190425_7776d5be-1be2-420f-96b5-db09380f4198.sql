-- CRITICAL SECURITY FIX: Restrict financing_options modifications to admin users only
-- This prevents users from manipulating interest rates, promotional offers, and financial terms

-- Remove dangerous policies that allow any authenticated user to modify financial terms
DROP POLICY IF EXISTS "Authenticated users can delete financing_options" ON public.financing_options;
DROP POLICY IF EXISTS "Authenticated users can insert financing_options" ON public.financing_options; 
DROP POLICY IF EXISTS "Authenticated users can update financing_options" ON public.financing_options;

-- Create admin-only policies for financial data modifications
CREATE POLICY "Admins can insert financing_options" 
ON public.financing_options 
FOR INSERT 
TO authenticated 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update financing_options" 
ON public.financing_options 
FOR UPDATE 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete financing_options" 
ON public.financing_options 
FOR DELETE 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Keep public read access - users need to see available financing options
-- The "Public read access for financing_options" policy should remain unchanged