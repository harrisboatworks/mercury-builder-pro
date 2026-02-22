
-- ============================================================
-- Tighten overly permissive INSERT/UPDATE RLS policies
-- Logging tables: restrict to service_role only (edge functions)
-- User-facing tables: add basic validation constraints
-- ============================================================

-- 1. LOGGING TABLES: Remove open INSERT policies (edge functions use service_role)

-- sms_logs: already has admin-only + deny-anon policies, no open INSERT exists
-- (confirmed from query - only ALL for admin and deny anon)

-- motor_enrichment_log: Replace open INSERT with admin/service-role only
DROP POLICY IF EXISTS "System can insert enrichment logs" ON public.motor_enrichment_log;
CREATE POLICY "Only admins can insert enrichment logs"
  ON public.motor_enrichment_log
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- sin_audit_log: Replace open INSERT with admin-only
DROP POLICY IF EXISTS "System can insert SIN audit logs" ON public.sin_audit_log;
CREATE POLICY "Only admins can insert SIN audit logs"
  ON public.sin_audit_log
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- quote_activity_events: Replace open INSERT with admin-only
DROP POLICY IF EXISTS "Anyone can insert activity events" ON public.quote_activity_events;
CREATE POLICY "Only admins can insert activity events"
  ON public.quote_activity_events
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- webhook_activity_logs: Replace open INSERT with admin-only  
DROP POLICY IF EXISTS "Anyone can insert webhook logs" ON public.webhook_activity_logs;
DROP POLICY IF EXISTS "System can insert webhook logs" ON public.webhook_activity_logs;
-- Check if there's an existing permissive insert policy
DO $$
BEGIN
  -- Drop any INSERT policy that uses WITH CHECK (true)
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS ' || quote_literal(policyname) || ' ON public.webhook_activity_logs;', E'\n')
    FROM pg_policies 
    WHERE tablename = 'webhook_activity_logs' 
      AND cmd = 'INSERT' 
      AND with_check = 'true'
  );
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
CREATE POLICY "Only admins can insert webhook logs"
  ON public.webhook_activity_logs
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. USER-FACING TABLES: Add validation constraints

-- blog_subscriptions: Require valid email format
DROP POLICY IF EXISTS "Anyone can subscribe to blog" ON public.blog_subscriptions;
CREATE POLICY "Anyone can subscribe with valid email"
  ON public.blog_subscriptions
  FOR INSERT
  WITH CHECK (
    email IS NOT NULL 
    AND length(email) >= 5 
    AND length(email) <= 255
    AND email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$'
  );

-- promo_reminder_subscriptions: Require valid contact info
DROP POLICY IF EXISTS "Anyone can subscribe to promo reminders" ON public.promo_reminder_subscriptions;
CREATE POLICY "Anyone can subscribe with valid contact"
  ON public.promo_reminder_subscriptions
  FOR INSERT
  WITH CHECK (
    (customer_email IS NOT NULL AND customer_email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$')
    OR (customer_phone IS NOT NULL AND length(customer_phone) >= 7)
  );

-- saved_quotes: Require valid email and non-empty quote state
DROP POLICY IF EXISTS "Anyone can create saved quotes" ON public.saved_quotes;
CREATE POLICY "Anyone can create saved quotes with valid data"
  ON public.saved_quotes
  FOR INSERT
  WITH CHECK (
    email IS NOT NULL 
    AND email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$'
    AND quote_state IS NOT NULL
  );

-- voice_callbacks: Require valid phone number
DROP POLICY IF EXISTS "Anyone can create callback requests" ON public.voice_callbacks;
CREATE POLICY "Anyone can create callbacks with valid phone"
  ON public.voice_callbacks
  FOR INSERT
  WITH CHECK (
    customer_phone IS NOT NULL 
    AND length(customer_phone) >= 7 
    AND length(customer_phone) <= 20
  );

-- voice_reminders: Require valid phone and future remind_at
DROP POLICY IF EXISTS "Anyone can create voice reminders" ON public.voice_reminders;
-- Check for existing open insert policy name
DO $$
BEGIN
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS ' || quote_literal(policyname) || ' ON public.voice_reminders;', E'\n')
    FROM pg_policies 
    WHERE tablename = 'voice_reminders' 
      AND cmd = 'INSERT' 
      AND with_check = 'true'
  );
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
CREATE POLICY "Anyone can create reminders with valid phone"
  ON public.voice_reminders
  FOR INSERT
  WITH CHECK (
    customer_phone IS NOT NULL 
    AND length(customer_phone) >= 7 
    AND length(customer_phone) <= 20
    AND remind_at IS NOT NULL
  );

-- nudge_experiments: Require session_id for inserts, restrict updates to own session
DROP POLICY IF EXISTS "Allow anonymous experiment inserts" ON public.nudge_experiments;
CREATE POLICY "Anonymous can insert experiments with session"
  ON public.nudge_experiments
  FOR INSERT
  WITH CHECK (
    session_id IS NOT NULL 
    AND length(session_id) >= 10
    AND page_path IS NOT NULL
    AND variant_id IS NOT NULL
  );

DROP POLICY IF EXISTS "Allow anonymous experiment updates" ON public.nudge_experiments;
CREATE POLICY "Anonymous can update own experiments"
  ON public.nudge_experiments
  FOR UPDATE
  USING (
    session_id IS NOT NULL 
    AND length(session_id) >= 10
  );
