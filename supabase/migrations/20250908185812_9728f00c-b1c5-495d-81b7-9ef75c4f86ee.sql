-- Fix the finance_settings table security (critical business data protection)
DROP POLICY IF EXISTS "Public read access for finance_settings" ON public.finance_settings;

-- Create new policy for authenticated users only
CREATE POLICY "Authenticated users can read finance_settings" 
ON public.finance_settings 
FOR SELECT 
TO authenticated 
USING (true);