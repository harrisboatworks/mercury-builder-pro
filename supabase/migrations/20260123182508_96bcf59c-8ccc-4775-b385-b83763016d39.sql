-- Fix promo_reminder_subscriptions: The SELECT policy 'Users can view own subscriptions by token' has USING(true) which is a data leak
-- It should require the unsubscribe_token to match the request parameter
DROP POLICY IF EXISTS "Users can view own subscriptions by token" ON public.promo_reminder_subscriptions;

-- Create a proper policy that denies anonymous SELECT (use edge function for token-based access)
CREATE POLICY "Only admins can view subscriptions"
ON public.promo_reminder_subscriptions FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Deny anonymous SELECT entirely
CREATE POLICY "Deny anonymous read access"
ON public.promo_reminder_subscriptions FOR SELECT
TO anon
USING (false);