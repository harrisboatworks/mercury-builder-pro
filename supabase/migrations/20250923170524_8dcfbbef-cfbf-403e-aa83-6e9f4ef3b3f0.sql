-- Add explicit deny policy for anonymous access to contact_inquiries
-- This prevents unauthenticated users from reading customer contact information

-- Drop the existing permissive policies and recreate with proper restrictions
DROP POLICY IF EXISTS "Anonymous users can create contact inquiries" ON public.contact_inquiries;
DROP POLICY IF EXISTS "Authenticated users can view only their own inquiries" ON public.contact_inquiries;
DROP POLICY IF EXISTS "Authenticated users can create own inquiries" ON public.contact_inquiries;
DROP POLICY IF EXISTS "Authenticated users can update only their own inquiries" ON public.contact_inquiries;
DROP POLICY IF EXISTS "Authenticated users can delete only their own inquiries" ON public.contact_inquiries;
DROP POLICY IF EXISTS "Authenticated admins can manage all inquiries" ON public.contact_inquiries;

-- Create new restrictive policies that explicitly deny anonymous access
-- 1. Deny all anonymous access by default
CREATE POLICY "Deny anonymous access to contact inquiries" 
ON public.contact_inquiries 
FOR ALL 
TO anon
USING (false);

-- 2. Allow anonymous users to create contact inquiries only (for contact forms)
CREATE POLICY "Anonymous users can create contact inquiries only" 
ON public.contact_inquiries 
FOR INSERT 
TO anon
WITH CHECK (user_id IS NULL);

-- 3. Authenticated users can view only their own inquiries
CREATE POLICY "Authenticated users can view only their own inquiries" 
ON public.contact_inquiries 
FOR SELECT 
TO authenticated
USING ((auth.uid() IS NOT NULL) AND (user_id IS NOT NULL) AND (auth.uid() = user_id));

-- 4. Authenticated users can create their own inquiries
CREATE POLICY "Authenticated users can create own inquiries" 
ON public.contact_inquiries 
FOR INSERT 
TO authenticated
WITH CHECK ((auth.uid() IS NOT NULL) AND (user_id IS NOT NULL) AND (auth.uid() = user_id));

-- 5. Authenticated users can update only their own inquiries
CREATE POLICY "Authenticated users can update only their own inquiries" 
ON public.contact_inquiries 
FOR UPDATE 
TO authenticated
USING ((auth.uid() IS NOT NULL) AND (user_id IS NOT NULL) AND (auth.uid() = user_id))
WITH CHECK ((auth.uid() IS NOT NULL) AND (user_id IS NOT NULL) AND (auth.uid() = user_id));

-- 6. Authenticated users can delete only their own inquiries
CREATE POLICY "Authenticated users can delete only their own inquiries" 
ON public.contact_inquiries 
FOR DELETE 
TO authenticated
USING ((auth.uid() IS NOT NULL) AND (user_id IS NOT NULL) AND (auth.uid() = user_id));

-- 7. Admins can manage all inquiries (full access)
CREATE POLICY "Authenticated admins can manage all inquiries" 
ON public.contact_inquiries 
FOR ALL 
TO authenticated
USING ((auth.uid() IS NOT NULL) AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK ((auth.uid() IS NOT NULL) AND has_role(auth.uid(), 'admin'::app_role));