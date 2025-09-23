-- Fix RLS policies on contact_inquiries to completely block anonymous read access
-- The issue is conflicting PERMISSIVE policies - we need RESTRICTIVE policies for security

-- First, drop all existing policies
DROP POLICY IF EXISTS "Deny anonymous access to contact inquiries" ON public.contact_inquiries;
DROP POLICY IF EXISTS "Anonymous users can create contact inquiries only" ON public.contact_inquiries;
DROP POLICY IF EXISTS "Authenticated users can view only their own inquiries" ON public.contact_inquiries;
DROP POLICY IF EXISTS "Authenticated users can create own inquiries" ON public.contact_inquiries;
DROP POLICY IF EXISTS "Authenticated users can update only their own inquiries" ON public.contact_inquiries;
DROP POLICY IF EXISTS "Authenticated users can delete only their own inquiries" ON public.contact_inquiries;
DROP POLICY IF EXISTS "Authenticated admins can manage all inquiries" ON public.contact_inquiries;

-- Create RESTRICTIVE policies that explicitly deny anonymous access to sensitive data
-- RESTRICTIVE policies must ALL be satisfied (AND logic), making them more secure

-- 1. RESTRICTIVE policy: Block all anonymous SELECT access (this is the key security fix)
CREATE POLICY "Block anonymous read access" 
ON public.contact_inquiries
AS RESTRICTIVE
FOR SELECT 
TO anon
USING (false);

-- 2. RESTRICTIVE policy: Block anonymous UPDATE access 
CREATE POLICY "Block anonymous updates" 
ON public.contact_inquiries
AS RESTRICTIVE  
FOR UPDATE
TO anon
USING (false);

-- 3. RESTRICTIVE policy: Block anonymous DELETE access
CREATE POLICY "Block anonymous deletes" 
ON public.contact_inquiries
AS RESTRICTIVE
FOR DELETE  
TO anon
USING (false);

-- 4. PERMISSIVE policy: Allow anonymous INSERT only (for contact forms)
CREATE POLICY "Anonymous contact form submissions" 
ON public.contact_inquiries 
FOR INSERT 
TO anon
WITH CHECK (user_id IS NULL);

-- 5. PERMISSIVE policy: Authenticated users can view their own inquiries
CREATE POLICY "Users view own inquiries" 
ON public.contact_inquiries 
FOR SELECT 
TO authenticated
USING (
  (auth.uid() IS NOT NULL) AND 
  (user_id IS NOT NULL) AND 
  (auth.uid() = user_id)
);

-- 6. PERMISSIVE policy: Authenticated users can create their own inquiries  
CREATE POLICY "Users create own inquiries" 
ON public.contact_inquiries 
FOR INSERT 
TO authenticated
WITH CHECK (
  (auth.uid() IS NOT NULL) AND 
  (user_id IS NOT NULL) AND 
  (auth.uid() = user_id)
);

-- 7. PERMISSIVE policy: Authenticated users can update their own inquiries
CREATE POLICY "Users update own inquiries" 
ON public.contact_inquiries 
FOR UPDATE 
TO authenticated
USING (
  (auth.uid() IS NOT NULL) AND 
  (user_id IS NOT NULL) AND 
  (auth.uid() = user_id)
)
WITH CHECK (
  (auth.uid() IS NOT NULL) AND 
  (user_id IS NOT NULL) AND 
  (auth.uid() = user_id)
);

-- 8. PERMISSIVE policy: Authenticated users can delete their own inquiries
CREATE POLICY "Users delete own inquiries" 
ON public.contact_inquiries 
FOR DELETE 
TO authenticated
USING (
  (auth.uid() IS NOT NULL) AND 
  (user_id IS NOT NULL) AND 
  (auth.uid() = user_id)
);

-- 9. PERMISSIVE policy: Admins have full access
CREATE POLICY "Admin full access" 
ON public.contact_inquiries 
FOR ALL 
TO authenticated
USING (
  (auth.uid() IS NOT NULL) AND 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  (auth.uid() IS NOT NULL) AND 
  has_role(auth.uid(), 'admin'::app_role)
);