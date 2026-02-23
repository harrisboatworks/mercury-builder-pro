
-- Note: The first migration already dropped the cache policies and set function search paths.
-- This migration handles the remaining RLS fixes.

-- 2. Tighten share_analytics INSERT: require non-null article_slug and platform with length limits
DROP POLICY IF EXISTS "Anyone can insert share analytics" ON public.share_analytics;
CREATE POLICY "Anyone can insert share analytics"
  ON public.share_analytics
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    article_slug IS NOT NULL
    AND length(article_slug) <= 255
    AND platform IS NOT NULL
    AND length(platform) <= 100
  );

-- 3. Tighten voice_reminders INSERT: require valid phone length
DROP POLICY IF EXISTS "Anyone can create reminders" ON public.voice_reminders;
CREATE POLICY "Validated insert for reminders"
  ON public.voice_reminders
  FOR INSERT
  WITH CHECK (
    customer_phone IS NOT NULL
    AND length(customer_phone) >= 10
    AND length(customer_phone) <= 20
  );

-- 4. Restrict webhook_activity_logs INSERT to admin only
DROP POLICY IF EXISTS "System can insert webhook activity logs" ON public.webhook_activity_logs;
CREATE POLICY "Admin can insert webhook activity logs"
  ON public.webhook_activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
  );
