
-- Fix SECURITY DEFINER views: use caller's permissions
ALTER VIEW public.customer_summary SET (security_invoker = true);
ALTER VIEW public.service_history SET (security_invoker = true);
ALTER VIEW public.unit_inventory SET (security_invoker = true);

-- Restrictive deny-all (non-service_role) on sensitive tables
CREATE POLICY "Deny non-service access" ON public.customer_memory
  AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "Deny non-service access" ON public.review_monitor_state
  AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "Deny non-service access" ON public.motor_models_price_backup_20260603
  AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "Service role only access" ON public.motor_models_price_backup_20260603
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Deny non-service access" ON public.ucp_checkout_sessions
  AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "Service role only access" ON public.ucp_checkout_sessions
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);
