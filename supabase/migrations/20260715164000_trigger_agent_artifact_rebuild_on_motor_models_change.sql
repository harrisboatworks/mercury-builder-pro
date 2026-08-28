-- Request a Vercel rebuild whenever motor_models changes so static pricing and
-- agent artifacts cannot silently lag the live quote-builder database.
-- Production prerequisite: a Vault secret named vercel_pricing_deploy_hook_url.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE IF NOT EXISTS public.agent_artifact_rebuild_state (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  requested_at timestamptz,
  last_dispatched_at timestamptz,
  last_request_id bigint,
  updated_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON public.agent_artifact_rebuild_state FROM anon, authenticated;
GRANT ALL ON public.agent_artifact_rebuild_state TO service_role;

INSERT INTO public.agent_artifact_rebuild_state (singleton)
VALUES (true)
ON CONFLICT (singleton) DO NOTHING;

CREATE OR REPLACE FUNCTION public.request_agent_artifact_rebuild()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.agent_artifact_rebuild_state (singleton, requested_at, updated_at)
  VALUES (true, clock_timestamp(), clock_timestamp())
  ON CONFLICT (singleton) DO UPDATE
  SET requested_at = EXCLUDED.requested_at,
      updated_at = EXCLUDED.updated_at;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.request_agent_artifact_rebuild() FROM PUBLIC;

DROP TRIGGER IF EXISTS motor_models_request_agent_artifact_rebuild ON public.motor_models;
CREATE TRIGGER motor_models_request_agent_artifact_rebuild
AFTER INSERT OR UPDATE OR DELETE ON public.motor_models
FOR EACH STATEMENT
EXECUTE FUNCTION public.request_agent_artifact_rebuild();

CREATE OR REPLACE FUNCTION public.dispatch_agent_artifact_rebuild()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  state_row public.agent_artifact_rebuild_state%ROWTYPE;
  deploy_hook_url text;
  request_id bigint;
BEGIN
  SELECT * INTO state_row
  FROM public.agent_artifact_rebuild_state
  WHERE singleton = true
  FOR UPDATE;

  IF state_row.requested_at IS NULL
     OR state_row.requested_at <= COALESCE(state_row.last_dispatched_at, '-infinity'::timestamptz)
     OR state_row.requested_at > clock_timestamp() - interval '2 minutes' THEN
    RETURN false;
  END IF;

  BEGIN
    SELECT decrypted_secret INTO deploy_hook_url
    FROM vault.decrypted_secrets
    WHERE name = 'vercel_pricing_deploy_hook_url'
      AND decrypted_secret IS NOT NULL
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    deploy_hook_url := NULL;
  END;

  IF deploy_hook_url IS NULL OR deploy_hook_url !~ '^https://api[.]vercel[.]com/' THEN
    RAISE WARNING 'vercel_pricing_deploy_hook_url is missing or invalid; rebuild remains pending';
    RETURN false;
  END IF;

  SELECT net.http_post(
    url := deploy_hook_url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('source', 'motor_models', 'requested_at', state_row.requested_at),
    timeout_milliseconds := 10000
  ) INTO request_id;

  UPDATE public.agent_artifact_rebuild_state
  SET last_dispatched_at = clock_timestamp(),
      last_request_id = request_id,
      updated_at = clock_timestamp()
  WHERE singleton = true;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.dispatch_agent_artifact_rebuild() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dispatch_agent_artifact_rebuild() TO service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'dispatch-agent-artifact-rebuild') THEN
    PERFORM cron.unschedule('dispatch-agent-artifact-rebuild');
  END IF;
  PERFORM cron.schedule(
    'dispatch-agent-artifact-rebuild',
    '*/2 * * * *',
    'SELECT public.dispatch_agent_artifact_rebuild();'
  );
END;
$$;
