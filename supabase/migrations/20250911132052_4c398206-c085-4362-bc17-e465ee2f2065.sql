-- Fix critical security vulnerability in profiles table
-- First, check current policies and update them to require authentication

-- Drop and recreate profiles policies to ensure proper authentication
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;  
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view their own profile" ON public.profiles;

-- Create secure policies that explicitly require authentication
CREATE POLICY "Secure profile insert - authenticated users only" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Secure profile update - authenticated users only" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Secure profile view - authenticated users only" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);