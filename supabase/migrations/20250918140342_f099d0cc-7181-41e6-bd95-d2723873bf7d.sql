-- CRITICAL SECURITY FIX: Remove anonymous access to sensitive customer data
-- This migration addresses multiple ERROR-level security findings

-- Fix 1: Secure customer_quotes table - remove anonymous access
DROP POLICY IF EXISTS "Secure admin access to customer quotes" ON public.customer_quotes;
DROP POLICY IF EXISTS "Secure user access to own quotes only" ON public.customer_quotes;
DROP POLICY IF EXISTS "Secure user quote creation" ON public.customer_quotes;
DROP POLICY IF EXISTS "Secure user quote deletion" ON public.customer_quotes;
DROP POLICY IF EXISTS "Secure user quote updates" ON public.customer_quotes;

-- Create new secure policies for customer_quotes (explicit authenticated role requirement)
CREATE POLICY "Admin full access to customer quotes"
ON public.customer_quotes
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own quotes only"
ON public.customer_quotes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own quotes only"
ON public.customer_quotes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quotes only"
ON public.customer_quotes
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own quotes only"
ON public.customer_quotes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Fix 2: Secure profiles table - remove anonymous access
DROP POLICY IF EXISTS "Ultra secure profile access - own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Ultra secure profile creation - own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Ultra secure profile updates - own profile only" ON public.profiles;

CREATE POLICY "Users can view own profile only"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own profile only"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile only"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix 3: Secure notifications table - remove anonymous access
DROP POLICY IF EXISTS "Authenticated users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can delete their own notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications only"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own notifications only"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications only"
ON public.notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications only"
ON public.notifications
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Fix 4: Secure sms_logs table - admin only access
DROP POLICY IF EXISTS "Admins can view all SMS logs" ON public.sms_logs;
DROP POLICY IF EXISTS "Authenticated system can insert SMS logs" ON public.sms_logs;

CREATE POLICY "Admin only access to SMS logs"
ON public.sms_logs
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix 5: Secure user_sessions table - remove anonymous access  
DROP POLICY IF EXISTS "Secure session access" ON public.user_sessions;
DROP POLICY IF EXISTS "Authenticated users can insert their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Authenticated users can update their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Admins can access all sessions" ON public.user_sessions;

CREATE POLICY "Users can view own sessions only"
ON public.user_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions only"
ON public.user_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions only"
ON public.user_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin full access to sessions"
ON public.user_sessions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Explicitly deny all anonymous access to sensitive tables
CREATE POLICY "Deny anonymous access to customer_quotes"
ON public.customer_quotes
FOR ALL
TO anon
USING (false);

CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false);

CREATE POLICY "Deny anonymous access to notifications"
ON public.notifications
FOR ALL
TO anon
USING (false);

CREATE POLICY "Deny anonymous access to sms_logs"
ON public.sms_logs
FOR ALL
TO anon
USING (false);

CREATE POLICY "Deny anonymous access to user_sessions"
ON public.user_sessions
FOR ALL
TO anon
USING (false);