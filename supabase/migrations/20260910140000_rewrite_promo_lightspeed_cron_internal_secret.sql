-- Guarded caller rewrite for the two requireAdmin cron endpoints.
--
-- Scope: check-expiring-promotions-daily and lightspeed-motor-models-sync-daily only.
-- Other Lightspeed jobs, the seven service-role jobs, and voice/ElevenLabs callers
-- are intentionally untouched.
--
-- Vault names EDGE_INTERNAL_SECRET and CRON_SECRET are a PROPOSED NEW database
-- naming contract. They require owner acceptance. They are NOT an established
-- Vault convention. Existing committed Vault names are service_role_key,
-- dropbox-oauth-token, sin-encryption-key, and vercel_pricing_deploy_hook_url.
-- Edge Function env variable names do not imply Vault names.
--
-- Why this proposal is not service_role_key: that established Vault name is a
-- JWT used as Authorization: Bearer for other callers. requireAdmin compares
-- x-internal-secret to Deno.env.get('EDGE_INTERNAL_SECRET') ||
-- Deno.env.get('CRON_SECRET'), not to the service-role JWT. Putting
-- service_role_key in the internal header would not authenticate unless those
-- values were identical; this proposal does not assume or require that. The service-role bearer path
-- stays separate. The internal credential is referenced at runtime; the existing bearer is retained for transition compatibility.
--
-- Auth contract (source, not a live-provisioning claim):
--   requireAdmin selects EDGE_INTERNAL_SECRET || CRON_SECRET (first wins; not
--   either independently) and accepts header x-internal-secret. This file
--   proposes looking up those same strings in Vault after owner acceptance.
--   Missing, empty, unreadable, duplicate, or incompatible state aborts.
--   This migration does not create a secret and does not treat the names as
--   already provisioned.
--
-- Command rewrite: validate the entire original command against a single
-- SELECT net.http_post grammar (named url/headers/body, optional numeric
-- timeout only). Then insert exactly one internal-header clause into the
-- existing jsonb_build_object so every other byte is unchanged. Extra
-- statements, unknown parameters, timeout expressions, different bodies,
-- extra calls, comment-only matches, or duplicate auth keys abort.
-- Reruns succeed only when removing that exact clause recovers a strictly
-- valid original. Malformed preexisting internal headers abort.
--
-- Gateway compatibility: verify_jwt = false is required for a custom header to
-- reach the function. Custom-header-only traffic through the gateway is unproven
-- in this repository, so the existing Authorization bearer is retained.
--
-- DO NOT APPLY until an owner verifies, without recording secret values:
--   1. owner accepts the proposed Vault names, or names a different accepted
--      pair that still matches the selected Edge env values;
--   2. Vault has exactly one EDGE_INTERNAL_SECRET row, or exactly one
--      CRON_SECRET row when Edge will also select CRON_SECRET;
--   3. that Vault value matches the selected Edge Function secret;
--   4. live cron commands still match the supported original grammar, schedules,
--      and URLs, and still lack a well-formed internal header;
--   5. no duplicate job names and no extra jobs targeting these two URLs;
--   6. each existing cron execution role can read the selected Vault reference
--      at runtime. Migration-owner access alone does not establish that.
-- Applying this file is a production scheduler write and is not authorized by
-- the existence of this source patch. Keep a command snapshot outside git for
-- rollback (cron.alter_job of the same job_id). This file has no down-migration
-- and must not restore a historical JWT.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $migration$
DECLARE
  selected_secret_name text;
  edge_secret_rows integer;
  edge_decrypted_rows integer;
  cron_secret_rows integer;
  cron_decrypted_rows integer;
  edge_value_present boolean;
  cron_value_present boolean;
  target record;
  match_count integer;
  extra_caller_count integer;
  job_id bigint;
  current_schedule text;
  current_command text;
  original_command_grammar text;
  auth_pair_grammar text := $re$('Authorization'[[:space:]]*,[[:space:]]*'Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+')$re$;
  internal_header_clause text;
  clause_hits integer;
  recovered_command text;
  next_command text;
  pair_hits integer;
BEGIN
  BEGIN
    PERFORM 1
    FROM vault.secrets
    WHERE name IN ('EDGE_INTERNAL_SECRET', 'CRON_SECRET')
    FOR UPDATE;
  EXCEPTION
    WHEN undefined_table THEN
      RAISE EXCEPTION 'vault.secrets is unavailable; cannot resolve a proposed internal-secret reference';
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Unable to read vault.secrets while resolving the proposed internal-secret reference';
  END;

  SELECT count(*)
  INTO edge_secret_rows
  FROM vault.secrets
  WHERE name = 'EDGE_INTERNAL_SECRET';

  SELECT count(*)
  INTO cron_secret_rows
  FROM vault.secrets
  WHERE name = 'CRON_SECRET';

  BEGIN
    SELECT count(*)
    INTO edge_decrypted_rows
    FROM vault.decrypted_secrets
    WHERE name = 'EDGE_INTERNAL_SECRET';

    SELECT count(*)
    INTO cron_decrypted_rows
    FROM vault.decrypted_secrets
    WHERE name = 'CRON_SECRET';
  EXCEPTION
    WHEN undefined_table THEN
      RAISE EXCEPTION 'vault.decrypted_secrets is unavailable; cannot validate the proposed internal-secret reference';
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Unable to read vault.decrypted_secrets while validating the proposed internal-secret reference';
  END;

  IF edge_secret_rows > 1 OR edge_decrypted_rows > 1 THEN
    RAISE EXCEPTION 'Duplicate proposed vault name EDGE_INTERNAL_SECRET; refusing to pick one row';
  END IF;

  IF cron_secret_rows > 1 OR cron_decrypted_rows > 1 THEN
    RAISE EXCEPTION 'Duplicate proposed vault name CRON_SECRET; refusing to pick one row';
  END IF;

  IF edge_secret_rows <> edge_decrypted_rows THEN
    RAISE EXCEPTION 'Proposed vault name EDGE_INTERNAL_SECRET has incompatible catalog/value row counts';
  END IF;

  IF cron_secret_rows <> cron_decrypted_rows THEN
    RAISE EXCEPTION 'Proposed vault name CRON_SECRET has incompatible catalog/value row counts';
  END IF;

  IF edge_secret_rows = 1 THEN
    SELECT EXISTS (
      SELECT 1
      FROM vault.decrypted_secrets
      WHERE name = 'EDGE_INTERNAL_SECRET'
        AND decrypted_secret IS NOT NULL
        AND length(btrim(decrypted_secret)) > 0
    )
    INTO edge_value_present;

    IF NOT edge_value_present THEN
      RAISE EXCEPTION 'proposed vault secret EDGE_INTERNAL_SECRET is present but empty or unreadable';
    END IF;
    selected_secret_name := 'EDGE_INTERNAL_SECRET';
  ELSIF cron_secret_rows = 1 THEN
    SELECT EXISTS (
      SELECT 1
      FROM vault.decrypted_secrets
      WHERE name = 'CRON_SECRET'
        AND decrypted_secret IS NOT NULL
        AND length(btrim(decrypted_secret)) > 0
    )
    INTO cron_value_present;

    IF NOT cron_value_present THEN
      RAISE EXCEPTION 'proposed vault secret CRON_SECRET is present but empty or unreadable';
    END IF;
    selected_secret_name := 'CRON_SECRET';
  ELSE
    RAISE EXCEPTION 'Proposed internal-secret vault reference is missing. Owner must accept and provision exactly one vault.secrets name EDGE_INTERNAL_SECRET (preferred; matches requireAdmin first-wins) or CRON_SECRET only when Edge will also select CRON_SECRET. Edge env names do not imply Vault names. This migration does not create that secret.';
  END IF;

  -- Keep the error branch dependent on an aggregate. A constant 1/0 is
  -- evaluated by PostgreSQL during planning even when the valid branch wins.
  internal_header_clause := format(
    $c$, 'x-internal-secret', (SELECT CASE WHEN count(*) = 1 AND bool_and(decrypted_secret IS NOT NULL AND length(btrim(decrypted_secret)) > 0) THEN min(decrypted_secret) ELSE (1 / (count(*) - count(*)))::text END FROM vault.decrypted_secrets WHERE name = %L)$c$,
    selected_secret_name
  );

  FOR target IN
    SELECT *
    FROM (
      VALUES
        (
          'check-expiring-promotions-daily',
          '0 13 * * *',
          'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/check-expiring-promotions'
        ),
        (
          'lightspeed-motor-models-sync-daily',
          '15 2 * * *',
          'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/sync-lightspeed-inventory'
        )
    ) AS t(job_name, expected_schedule, expected_url)
  LOOP
    PERFORM 1
    FROM cron.job
    WHERE jobname = target.job_name
    FOR UPDATE;

    SELECT count(*)
    INTO match_count
    FROM cron.job
    WHERE jobname = target.job_name;

    IF match_count = 0 THEN
      RAISE EXCEPTION 'Required cron job % is missing; refusing to invent a schedule', target.job_name;
    END IF;

    IF match_count > 1 THEN
      RAISE EXCEPTION 'Cron job % is ambiguous (% rows)', target.job_name, match_count;
    END IF;

    SELECT count(*)
    INTO extra_caller_count
    FROM cron.job
    WHERE jobname IS DISTINCT FROM target.job_name
      AND position(target.expected_url in command) > 0;

    IF extra_caller_count > 0 THEN
      RAISE EXCEPTION 'Ambiguous extra caller(s) for %; refusing to rewrite a subset', target.job_name;
    END IF;

    SELECT j.jobid, j.schedule, j.command
    INTO job_id, current_schedule, current_command
    FROM cron.job j
    WHERE j.jobname = target.job_name
    FOR UPDATE;

    IF current_schedule IS DISTINCT FROM target.expected_schedule THEN
      RAISE EXCEPTION 'Cron job % schedule is incompatible with the preserved schedule', target.job_name;
    END IF;

    IF current_command IS NULL OR length(btrim(current_command)) = 0 THEN
      RAISE EXCEPTION 'Cron job % command is empty', target.job_name;
    END IF;

    original_command_grammar := format(
      $re$^[[:space:]]*SELECT[[:space:]]+net\.http_post\([[:space:]]*url[[:space:]]*:=[[:space:]]*'%s'[[:space:]]*,[[:space:]]*headers[[:space:]]*:=[[:space:]]*jsonb_build_object\([[:space:]]*'Content-Type'[[:space:]]*,[[:space:]]*'application/json'[[:space:]]*,[[:space:]]*'Authorization'[[:space:]]*,[[:space:]]*'Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+'[[:space:]]*\)[[:space:]]*,[[:space:]]*body[[:space:]]*:=[[:space:]]*'\{\}'::jsonb([[:space:]]*,[[:space:]]*timeout_milliseconds[[:space:]]*:=[[:space:]]*[0-9]+)?[[:space:]]*\)[[:space:]]+AS[[:space:]]+request_id[[:space:]]*;[[:space:]]*\Z$re$,
      regexp_replace(target.expected_url, $esc$([\\.^$|?*+()[\]{}])$esc$, $esc$\\\1$esc$, 'g')
    );

    clause_hits := (
      length(current_command) - length(replace(current_command, internal_header_clause, ''))
    ) / length(internal_header_clause);

    IF clause_hits > 1 THEN
      RAISE EXCEPTION 'Cron job % has a duplicate inserted internal header clause', target.job_name;
    END IF;

    IF clause_hits = 1 THEN
      recovered_command := replace(current_command, internal_header_clause, '');
      IF recovered_command !~ original_command_grammar THEN
        RAISE EXCEPTION 'Cron job % internal header is present but does not recover a strictly valid original command', target.job_name;
      END IF;
      IF regexp_replace(recovered_command, auth_pair_grammar, $rep$\1$rep$ || internal_header_clause)
         IS DISTINCT FROM current_command THEN
        RAISE EXCEPTION 'Cron job % internal header clause is in an unexpected position', target.job_name;
      END IF;
      CONTINUE;
    END IF;

    IF position('x-internal-secret' in lower(current_command)) > 0 THEN
      RAISE EXCEPTION 'Cron job % has a malformed preexisting internal header', target.job_name;
    END IF;

    IF current_command !~ original_command_grammar THEN
      RAISE EXCEPTION 'Cron job % command is outside the supported original net.http_post grammar', target.job_name;
    END IF;

    SELECT count(*)
    INTO pair_hits
    FROM regexp_matches(current_command, auth_pair_grammar, 'g');

    IF pair_hits <> 1 THEN
      RAISE EXCEPTION 'Cron job % Authorization header constructor is not a single supported pair', target.job_name;
    END IF;

    next_command := regexp_replace(current_command, auth_pair_grammar, $rep$\1$rep$ || internal_header_clause);

    IF next_command = current_command
       OR replace(next_command, internal_header_clause, '') IS DISTINCT FROM current_command
       OR next_command !~ ('x-internal-secret')
    THEN
      RAISE EXCEPTION 'Cron job % refused a non-narrow header insertion', target.job_name;
    END IF;

    PERFORM cron.alter_job(
      job_id := job_id,
      command := next_command
    );
  END LOOP;
END
$migration$;
