-- Harden cache tables, internal views, and sensitive RPC grants.
-- Public buyer/agent endpoints use Edge Functions with the service role key,
-- so these grants do not remove the public motor/quote API surface.

-- 1) Cache tables: public read is okay; public writes are not.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.google_places_cache FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.mercury_parts_cache FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.google_places_cache TO anon, authenticated;
GRANT SELECT ON TABLE public.mercury_parts_cache TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.mercury_parts_cache TO authenticated;
GRANT ALL ON TABLE public.google_places_cache TO service_role;
GRANT ALL ON TABLE public.mercury_parts_cache TO service_role;

DROP POLICY IF EXISTS "Anyone can read cache" ON public.google_places_cache;
DROP POLICY IF EXISTS "Service role can manage cache" ON public.google_places_cache;
CREATE POLICY "Anon and authenticated can read google places cache"
  ON public.google_places_cache
  FOR SELECT
  TO anon, authenticated
  USING (true);
CREATE POLICY "Service role can manage google places cache"
  ON public.google_places_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public read access for mercury_parts_cache" ON public.mercury_parts_cache;
DROP POLICY IF EXISTS "Admins can manage mercury_parts_cache" ON public.mercury_parts_cache;
DROP POLICY IF EXISTS "Service role can manage mercury_parts_cache" ON public.mercury_parts_cache;
CREATE POLICY "Anon and authenticated can read mercury parts cache"
  ON public.mercury_parts_cache
  FOR SELECT
  TO anon, authenticated
  USING (true);
CREATE POLICY "Admins can manage mercury parts cache"
  ON public.mercury_parts_cache
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role can manage mercury parts cache"
  ON public.mercury_parts_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2) Internal Lightspeed/admin views: do not expose through anon/auth REST.
REVOKE SELECT ON TABLE
  public.counter_sales,
  public.customer_lifecycle,
  public.customer_summary,
  public.deals,
  public.deals_units,
  public.invoice_lines,
  public.mercury_motor_inventory,
  public.open_service_board,
  public.parts_inventory,
  public.parts_invoices,
  public.service_history,
  public.service_parts,
  public.unit_inventory
FROM PUBLIC, anon, authenticated;

-- Email summary is already security_invoker and used by the admin UI.
-- Keep authenticated access so admin RLS can work, but remove anonymous access.
ALTER VIEW public.email_analytics_summary SET (security_invoker = true);
REVOKE SELECT ON TABLE public.email_analytics_summary FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.email_analytics_summary TO authenticated;

-- 3) Sensitive internal RPCs: no direct browser/anon execution.
-- Edge Functions and back-office automation should use the service role.
REVOKE EXECUTE ON FUNCTION public.add_customer_memory(p_gateway_secret text, p_customer_id text, p_customer_name text, p_raw_note text, p_summary text, p_category text, p_sensitivity text, p_source text, p_source_channel text, p_created_by text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_customer_memory(p_gateway_secret text, p_customer_id text, p_customer_name text, p_raw_note text, p_summary text, p_category text, p_sensitivity text, p_source text, p_source_channel text, p_created_by text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.archive_customer_memory(p_gateway_secret text, p_memory_id uuid, p_actor text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.archive_customer_memory(p_gateway_secret text, p_memory_id uuid, p_actor text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.audit_orphaned_customer_data() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.audit_orphaned_customer_data() TO service_role;
REVOKE EXECUTE ON FUNCTION public.bulk_upsert_deals(payload jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_upsert_deals(payload jsonb) TO service_role;
REVOKE EXECUTE ON FUNCTION public.bulk_upsert_open_ros(payload jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_upsert_open_ros(payload jsonb) TO service_role;
REVOKE EXECUTE ON FUNCTION public.bulk_upsert_parts_invoices(payload jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_upsert_parts_invoices(payload jsonb) TO service_role;
REVOKE EXECUTE ON FUNCTION public.cleanup_motor_duplicates_by_display() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_motor_duplicates_by_display() TO service_role;
REVOKE EXECUTE ON FUNCTION public.customer_brief(p_query text, p_limit integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.customer_brief(p_query text, p_limit integer) TO service_role;
REVOKE EXECUTE ON FUNCTION public.customer_issue_history(p_customer_query text, p_issue_query text, p_limit integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.customer_issue_history(p_customer_query text, p_issue_query text, p_limit integer) TO service_role;
REVOKE EXECUTE ON FUNCTION public.customer_lookup(p_query text, p_limit integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.customer_lookup(p_query text, p_limit integer) TO service_role;
REVOKE EXECUTE ON FUNCTION public.customer_memory_lookup(p_customer_query text, p_limit integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.customer_memory_lookup(p_customer_query text, p_limit integer) TO service_role;
REVOKE EXECUTE ON FUNCTION public.customer_product_history(p_customer_query text, p_product_query text, p_start_date date, p_end_date date, p_limit integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.customer_product_history(p_customer_query text, p_product_query text, p_start_date date, p_end_date date, p_limit integer) TO service_role;
REVOKE EXECUTE ON FUNCTION public.customer_service_history(p_customer_query text, p_start_date date, p_end_date date, p_limit integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.customer_service_history(p_customer_query text, p_start_date date, p_end_date date, p_limit integer) TO service_role;
REVOKE EXECUTE ON FUNCTION public.customer_service_parts_used(p_customer_query text, p_unit_query text, p_start_date date, p_end_date date, p_limit integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.customer_service_parts_used(p_customer_query text, p_unit_query text, p_start_date date, p_end_date date, p_limit integer) TO service_role;
REVOKE EXECUTE ON FUNCTION public.customer_service_red_flags(p_customer_query text, p_unit_query text, p_start_date date, p_end_date date, p_limit integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.customer_service_red_flags(p_customer_query text, p_unit_query text, p_start_date date, p_end_date date, p_limit integer) TO service_role;
REVOKE EXECUTE ON FUNCTION public.customer_service_work_summary(p_customer_query text, p_unit_query text, p_start_date date, p_end_date date, p_limit integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.customer_service_work_summary(p_customer_query text, p_unit_query text, p_start_date date, p_end_date date, p_limit integer) TO service_role;
REVOKE EXECUTE ON FUNCTION public.fix_auto_generated_model_numbers_comprehensive() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fix_auto_generated_model_numbers_comprehensive() TO service_role;
REVOKE EXECUTE ON FUNCTION public.fix_auto_generated_model_numbers_safe() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fix_auto_generated_model_numbers_safe() TO service_role;
REVOKE EXECUTE ON FUNCTION public.get_cron_job_status() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_cron_job_status() TO service_role;
REVOKE EXECUTE ON FUNCTION public.get_duplicate_brochure_keys() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_duplicate_brochure_keys() TO service_role;
REVOKE EXECUTE ON FUNCTION public.hbw_bot_admin_status() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hbw_bot_admin_status() TO service_role;
REVOKE EXECUTE ON FUNCTION public.hbw_bot_recent_errors(p_limit integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hbw_bot_recent_errors(p_limit integer) TO service_role;
REVOKE EXECUTE ON FUNCTION public.last_service_summary(p_query text, p_limit integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.last_service_summary(p_query text, p_limit integer) TO service_role;
REVOKE EXECUTE ON FUNCTION public.open_ro_brief(p_mode text, p_limit integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.open_ro_brief(p_mode text, p_limit integer) TO service_role;
REVOKE EXECUTE ON FUNCTION public.open_ro_detail(p_query text, p_limit integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.open_ro_detail(p_query text, p_limit integer) TO service_role;
REVOKE EXECUTE ON FUNCTION public.open_ro_lookup(p_query text, p_limit integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.open_ro_lookup(p_query text, p_limit integer) TO service_role;
REVOKE EXECUTE ON FUNCTION public.part_lookup(p_query text, p_limit integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.part_lookup(p_query text, p_limit integer) TO service_role;
REVOKE EXECUTE ON FUNCTION public.part_lookup_context(p_query text, p_limit integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.part_lookup_context(p_query text, p_limit integer) TO service_role;
REVOKE EXECUTE ON FUNCTION public.part_sales_summary(p_part_number text, p_start_date date, p_end_date date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.part_sales_summary(p_part_number text, p_start_date date, p_end_date date) TO service_role;
REVOKE EXECUTE ON FUNCTION public.service_recommendation_followups(p_query text, p_limit integer, p_months_back integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.service_recommendation_followups(p_query text, p_limit integer, p_months_back integer) TO service_role;
REVOKE EXECUTE ON FUNCTION public.service_recommendations_due(p_query text, p_limit integer, p_months_back integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.service_recommendations_due(p_query text, p_limit integer, p_months_back integer) TO service_role;
REVOKE EXECUTE ON FUNCTION public.service_ro_detail(p_ro_number text, p_limit integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.service_ro_detail(p_ro_number text, p_limit integer) TO service_role;
REVOKE EXECUTE ON FUNCTION public.test_single_motor_insert(p_model_number text, p_model_display text, p_dealer_price numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.test_single_motor_insert(p_model_number text, p_model_display text, p_dealer_price numeric) TO service_role;
REVOKE EXECUTE ON FUNCTION public.unit_inventory_lookup(p_query text, p_limit integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unit_inventory_lookup(p_query text, p_limit integer) TO service_role;
REVOKE EXECUTE ON FUNCTION public.update_brochure_models_bulk(p_rows jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_brochure_models_bulk(p_rows jsonb) TO service_role;
REVOKE EXECUTE ON FUNCTION public.update_brochure_models_bulk_v2(p_rows jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_brochure_models_bulk_v2(p_rows jsonb) TO service_role;
