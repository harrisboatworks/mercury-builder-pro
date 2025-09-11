-- Fix critical security vulnerability in profiles table
-- Drop existing policies that allow anonymous access
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create secure policies that require authentication AND ownership
CREATE POLICY "Authenticated users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Fix similar issues in other tables with personal data
-- Fix customer_quotes policies
DROP POLICY IF EXISTS "Authenticated users can create their own quotes" ON public.customer_quotes;
DROP POLICY IF EXISTS "Authenticated users can delete their own quotes" ON public.customer_quotes;
DROP POLICY IF EXISTS "Authenticated users can update their own quotes" ON public.customer_quotes;
DROP POLICY IF EXISTS "Authenticated users can view their own quotes" ON public.customer_quotes;

CREATE POLICY "Authenticated users can create their own quotes" 
ON public.customer_quotes 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own quotes" 
ON public.customer_quotes 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own quotes" 
ON public.customer_quotes 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view their own quotes" 
ON public.customer_quotes 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Fix customer_xp policies
DROP POLICY IF EXISTS "Users can insert their own XP" ON public.customer_xp;
DROP POLICY IF EXISTS "Users can insert their own XP row" ON public.customer_xp;
DROP POLICY IF EXISTS "Users can update their own XP" ON public.customer_xp;
DROP POLICY IF EXISTS "Users can view their own XP" ON public.customer_xp;

CREATE POLICY "Authenticated users can insert their own XP" 
ON public.customer_xp 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own XP" 
ON public.customer_xp 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view their own XP" 
ON public.customer_xp 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Fix notifications policies
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;

CREATE POLICY "Authenticated users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert their own notifications" 
ON public.notifications 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view their own notifications" 
ON public.notifications 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Fix quotes policies
DROP POLICY IF EXISTS "Users can create their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can delete their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can update their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can view their own quotes" ON public.quotes;

CREATE POLICY "Authenticated users can create their own quotes" 
ON public.quotes 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own quotes" 
ON public.quotes 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own quotes" 
ON public.quotes 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view their own quotes" 
ON public.quotes 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Fix user_sessions policies
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;

CREATE POLICY "Authenticated users can insert their own sessions" 
ON public.user_sessions 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own sessions" 
ON public.user_sessions 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view their own sessions" 
ON public.user_sessions 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Fix user_roles policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Authenticated users can view their own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);