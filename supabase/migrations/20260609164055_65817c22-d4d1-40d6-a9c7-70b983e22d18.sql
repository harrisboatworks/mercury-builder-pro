-- 1. financing_submission_logs: replace open insert with scoped policies
DROP POLICY IF EXISTS "Anyone can insert financing submission logs"
  ON public.financing_submission_logs;

-- Authenticated callers can only log rows attributed to themselves.
CREATE POLICY "Authenticated users log their own submission events"
  ON public.financing_submission_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Anonymous (guest) submitters can only log unattributed rows.
-- We intentionally do NOT require application_id here because SIN-encryption
-- failures occur before the financing_applications row is inserted, and we
-- want to keep that telemetry. Spam risk is bounded: table is admin-read-only
-- and writes are still gated by RLS (no user_id impersonation possible).
CREATE POLICY "Anonymous submitters log unattributed events"
  ON public.financing_submission_logs
  FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);

-- 2. motor_models_price_backup_20260603: lock down (Option B - keep data, make private)
REVOKE ALL ON public.motor_models_price_backup_20260603 FROM anon, authenticated, PUBLIC;
GRANT ALL ON public.motor_models_price_backup_20260603 TO service_role;
ALTER TABLE public.motor_models_price_backup_20260603 ENABLE ROW LEVEL SECURITY;
-- No policies created -> anon/authenticated cannot SELECT/INSERT/UPDATE/DELETE.
-- service_role bypasses RLS so admin tooling and edge functions retain access.