-- Fix security vulnerability in contact_inquiries table
-- Remove public read access that allows any authenticated user to view inquiries with NULL user_id

-- Drop the existing vulnerable policy
DROP POLICY IF EXISTS "Users can view own inquiries" ON public.contact_inquiries;

-- Create a secure replacement policy that only allows users to view their own inquiries
-- (not inquiries with NULL user_id)
CREATE POLICY "Users can view only their own inquiries" 
ON public.contact_inquiries 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id AND user_id IS NOT NULL);

-- Update the INSERT policy to be more explicit about when user_id can be NULL
DROP POLICY IF EXISTS "Users can create contact inquiries" ON public.contact_inquiries;

-- Allow authenticated users to create inquiries for themselves
CREATE POLICY "Authenticated users can create own inquiries" 
ON public.contact_inquiries 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow anonymous users to create inquiries (user_id will be NULL)
CREATE POLICY "Anonymous users can create inquiries" 
ON public.contact_inquiries 
FOR INSERT 
TO anon
WITH CHECK (user_id IS NULL);