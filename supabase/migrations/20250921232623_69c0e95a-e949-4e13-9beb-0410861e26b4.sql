-- Fix security vulnerability in contact_inquiries table RLS policies
-- Ensure no anonymous access to sensitive customer contact information

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Admins can manage all inquiries" ON public.contact_inquiries;
DROP POLICY IF EXISTS "Users can view only their own inquiries" ON public.contact_inquiries;
DROP POLICY IF EXISTS "Anonymous users can create inquiries" ON public.contact_inquiries;
DROP POLICY IF EXISTS "Authenticated users can create own inquiries" ON public.contact_inquiries;

-- 1. Allow only AUTHENTICATED admin users to manage all inquiries
CREATE POLICY "Authenticated admins can manage all inquiries" 
ON public.contact_inquiries 
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

-- 2. Allow only AUTHENTICATED users to view their own inquiries 
-- (never allow access to inquiries with NULL user_id)
CREATE POLICY "Authenticated users can view only their own inquiries" 
ON public.contact_inquiries 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id
);

-- 3. Allow only AUTHENTICATED users to update their own inquiries
CREATE POLICY "Authenticated users can update only their own inquiries" 
ON public.contact_inquiries 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id
);

-- 4. Allow only AUTHENTICATED users to delete their own inquiries
CREATE POLICY "Authenticated users can delete only their own inquiries" 
ON public.contact_inquiries 
FOR DELETE 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id
);

-- 5. Allow AUTHENTICATED users to create inquiries assigned to themselves
CREATE POLICY "Authenticated users can create own inquiries" 
ON public.contact_inquiries 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id
);

-- 6. Allow ANONYMOUS users to create inquiries (with NULL user_id for contact forms)
-- This is needed for public contact forms but ensures user_id is NULL
CREATE POLICY "Anonymous users can create contact inquiries" 
ON public.contact_inquiries 
FOR INSERT 
TO anon
WITH CHECK (
  user_id IS NULL
);

-- Add additional security: Ensure personal data fields are never exposed to unauthorized users
-- by adding a view for public contact form submissions (optional enhancement)
COMMENT ON TABLE public.contact_inquiries IS 
'Contains customer contact information. Only admins and inquiry owners can access. Anonymous inquiries (user_id IS NULL) are only accessible to admins.';

-- Log this security fix
INSERT INTO public.security_audit_log (
  action, 
  table_name, 
  user_id,
  created_at
) VALUES (
  'security_policy_update', 
  'contact_inquiries',
  auth.uid(),
  now()
);