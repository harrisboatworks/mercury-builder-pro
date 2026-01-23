-- Security Fix: Remove overly permissive policies and restrict access

-- =====================================================
-- FIX 1: blog_subscriptions - Remove public read access
-- =====================================================

-- Drop the permissive public read policy if it exists
DROP POLICY IF EXISTS "Anyone can read blog subscriptions" ON public.blog_subscriptions;
DROP POLICY IF EXISTS "Public can view blog subscriptions" ON public.blog_subscriptions;
DROP POLICY IF EXISTS "Blog subscriptions are viewable by everyone" ON public.blog_subscriptions;

-- Drop the overly permissive unsubscribe policy
DROP POLICY IF EXISTS "Anyone can unsubscribe with valid token" ON public.blog_subscriptions;

-- Create admin-only read policy for blog subscriptions
CREATE POLICY "Only admins can read blog subscriptions"
ON public.blog_subscriptions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- FIX 2: email_sequence_queue - Remove permissive update policy
-- =====================================================

-- Drop the overly permissive unsubscribe policy
DROP POLICY IF EXISTS "Anyone can unsubscribe with valid token" ON public.email_sequence_queue;

-- =====================================================
-- FIX 3: promo_reminder_subscriptions - Remove permissive update policy
-- =====================================================

-- Drop the overly permissive unsubscribe policy
DROP POLICY IF EXISTS "Users can unsubscribe via token" ON public.promo_reminder_subscriptions;

-- =====================================================
-- FIX 4: customer_quotes - Strengthen anonymous access protection
-- =====================================================

-- Drop any permissive anonymous read policies
DROP POLICY IF EXISTS "Anonymous users can read their quotes" ON public.customer_quotes;
DROP POLICY IF EXISTS "Users can read own quotes" ON public.customer_quotes;

-- Create a more restrictive policy for authenticated users only
CREATE POLICY "Authenticated users can read their own quotes"
ON public.customer_quotes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Ensure admins can read all quotes
DROP POLICY IF EXISTS "Admins can read all quotes" ON public.customer_quotes;
CREATE POLICY "Admins can read all quotes"
ON public.customer_quotes
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));