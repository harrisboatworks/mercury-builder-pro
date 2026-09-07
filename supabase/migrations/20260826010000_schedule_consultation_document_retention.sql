-- Wire consultation-document-retention into the deployed pg_cron scheduler.
--
-- Ordering: must apply after 20260825010000 (jobs table + retention policy rows)
-- and 20260822234500 (consultation_documents). The Edge Function is deployed
-- separately; until that deploy, scheduled attempts will receive HTTP errors.
-- A later scheduled run will try again. This file does not upload or invoke
-- the function.
--
-- Credential pattern matches 20260501015307: reuse the service-role bearer
-- already present on a live cron job, else Vault `service_role_key`. No key is
-- embedded in this repository.
--
-- Rollback-safe:
--   SELECT cron.unschedule('consultation-document-retention-daily');
--   Keep this cleanup_old_data() replacement. It skips consultation_* policy
--   rows and unknown tables; restoring the 20251111000954 CASE (no ELSE)
--   while those policy rows still exist can fail at runtime. Do not delete
--   the policy rows as part of rollback. This migration does not drop tables,
--   alter buckets, or rewrite historical spec-sheets objects.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS TABLE(table_name text, records_deleted integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  policy RECORD;
  deleted_count integer;
  cutoff_date timestamptz;
  handled boolean;
BEGIN
  FOR policy IN
    SELECT * FROM public.data_retention_policies WHERE enabled = true
  LOOP
    deleted_count := 0;
    cutoff_date := now() - (policy.retention_days || ' days')::interval;
    handled := true;

    CASE policy.table_name
      WHEN 'financing_applications' THEN
        DELETE FROM public.financing_applications
        WHERE created_at < cutoff_date
          AND status IN ('declined', 'withdrawn')
          AND deleted_at IS NOT NULL;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;

      WHEN 'security_audit_log' THEN
        DELETE FROM public.security_audit_log
        WHERE created_at < cutoff_date;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;

      WHEN 'sin_audit_log' THEN
        DELETE FROM public.sin_audit_log
        WHERE created_at < cutoff_date;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;

      WHEN 'customer_quotes' THEN
        DELETE FROM public.customer_quotes
        WHERE created_at < cutoff_date
          AND lead_status IN ('lost', 'inactive');
        GET DIAGNOSTICS deleted_count = ROW_COUNT;

      WHEN 'contact_inquiries' THEN
        DELETE FROM public.contact_inquiries
        WHERE created_at < cutoff_date
          AND status = 'resolved';
        GET DIAGNOSTICS deleted_count = ROW_COUNT;

      WHEN 'consultation_documents' THEN
        -- Private PDFs and capability rows are storage-backed. The
        -- consultation-document-retention Edge Function owns purge so this
        -- SQL cleaner cannot leave orphaned objects.
        handled := false;

      WHEN 'consultation_document_jobs' THEN
        handled := false;

      ELSE
        handled := false;
    END CASE;

    IF handled THEN
      UPDATE public.data_retention_policies
      SET last_cleanup_at = now()
      WHERE id = policy.id;

      RETURN QUERY SELECT policy.table_name, deleted_count;
    END IF;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_data() IS
  'Automatically cleanup old data based on retention policies. Consultation document tables are excluded; they are purged by consultation-document-retention.';

REVOKE EXECUTE ON FUNCTION public.cleanup_old_data() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  service_role_key text;
  project_url text := 'https://eutsoqdpjurknjsshxes.supabase.co';
BEGIN
  SELECT substring(command from 'Bearer ([A-Za-z0-9_-]+[.][A-Za-z0-9_-]+[.][A-Za-z0-9_-]+)')
  INTO service_role_key
  FROM cron.job
  WHERE jobname = 'mercury-catalog-data-refresh'
  LIMIT 1;

  IF service_role_key IS NULL THEN
    BEGIN
      SELECT decrypted_secret INTO service_role_key
      FROM vault.decrypted_secrets
      WHERE name = 'service_role_key'
        AND decrypted_secret IS NOT NULL
      LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
      service_role_key := NULL;
    END;
  END IF;

  IF service_role_key IS NULL OR length(service_role_key) < 40 THEN
    RAISE EXCEPTION 'No service-role credential available to schedule consultation-document-retention-daily';
  END IF;

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'consultation-document-retention-daily') THEN
    PERFORM cron.unschedule('consultation-document-retention-daily');
  END IF;

  PERFORM cron.schedule(
    'consultation-document-retention-daily',
    '20 6 * * *',
    format($job$
      SELECT net.http_post(
        url := '%s/functions/v1/consultation-document-retention',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer %s'
        ),
        body := '{}'::jsonb
      ) AS request_id;
    $job$, project_url, service_role_key)
  );
END;
$$;
