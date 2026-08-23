-- Hosted-staging bootstrap for the motor deposit deal packet.
-- Not a migration. Do not place this under supabase/migrations.
-- Do not run against eutsoqdpjurknjsshxes.
--
-- Apply only against isolated branch project ccozickwrpautlxknsjk after
-- STAGING_ACCEPTANCE.md fail-closed guards pass. Creates the baseline public
-- surface required BEFORE supabase/migrations/20260823120000_deposit_deal_packet.sql.
--
-- Marker: deposit-deal-packet-staging/hosted-bootstrap/v1
-- Surface: deposit-deal-packet-hosted-bootstrap/v1
--
-- This SQL cannot independently identify the hosted branch. The committed
-- nonce is only operator intent acknowledgement. Actual project identity is
-- enforced externally by the Supabase connector/CLI target
-- project_id ccozickwrpautlxknsjk plus the staging guards.
-- deposit_staging.* GUCs are excluded from the pg_settings ref scan so the
-- nonce cannot self-identify as the branch.
--
-- Session GUC required in the same psql session, before this file:
--   SET deposit_staging.allow_nonce TO 'deposit-deal-packet-staging/ccozickwrpautlxknsjk'
-- Optional:
--   SET deposit_staging.project_ref TO '<ref>'  -- production/unexpected refs still fail

BEGIN;

DO $$
DECLARE
  production_ref text := 'eutsoqdpjurknjsshxes';
  staging_ref text := 'ccozickwrpautlxknsjk';
  nonce_expected text := 'deposit-deal-packet-staging/ccozickwrpautlxknsjk';
  detected text := nullif(btrim(current_setting('deposit_staging.project_ref', true)), '');
  nonce text := nullif(btrim(current_setting('deposit_staging.allow_nonce', true)), '');
  blob text := '';
  rec record;
BEGIN
  blob := concat_ws(' ',
    current_database(),
    current_setting('cluster_name', true),
    current_setting('application_name', true),
    coalesce(
      (
        SELECT shobj_description(d.oid, 'pg_database')
        FROM pg_catalog.pg_database d
        WHERE d.datname = current_database()
      ),
      ''
    )
  );

  FOR rec IN
    SELECT setting
    FROM pg_catalog.pg_settings
    WHERE name NOT LIKE 'deposit_staging.%'
      AND (
        setting ILIKE '%' || production_ref || '%'
        OR setting ILIKE '%' || staging_ref || '%'
      )
  LOOP
    blob := blob || ' ' || coalesce(rec.setting, '');
  END LOOP;

  IF detected IS NULL AND blob ILIKE '%' || production_ref || '%' THEN
    detected := production_ref;
  END IF;

  IF detected IS NOT NULL AND detected ILIKE '%' || production_ref || '%' THEN
    RAISE EXCEPTION
      'hosted staging bootstrap refuses production project eutsoqdpjurknjsshxes'
      USING ERRCODE = 'P0001';
  END IF;

  IF detected IS NOT NULL AND detected IS DISTINCT FROM staging_ref THEN
    RAISE EXCEPTION
      'hosted staging bootstrap refuses unexpected project ref %',
      detected
      USING ERRCODE = 'P0001';
  END IF;

  IF nonce IS DISTINCT FROM nonce_expected THEN
    RAISE EXCEPTION
      'hosted staging bootstrap requires SET deposit_staging.allow_nonce TO ''deposit-deal-packet-staging/ccozickwrpautlxknsjk'' as operator intent acknowledgement'
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN NOSUPERUSER NOBYPASSRLS INHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN NOSUPERUSER NOBYPASSRLS INHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN NOSUPERUSER BYPASSRLS INHERIT;
  END IF;
END;
$$;

DO $$
BEGIN
  EXECUTE format('GRANT anon, authenticated, service_role TO %I', current_user);
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE
      'hosted staging bootstrap skipped GRANT of anon/authenticated/service_role to %; hosted membership is assumed',
      current_user;
END;
$$;

CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY
);

DO $$
BEGIN
  IF to_regprocedure('auth.uid()') IS NULL THEN
    EXECUTE $fn$
      CREATE FUNCTION auth.uid()
      RETURNS uuid
      LANGUAGE sql
      STABLE
      AS $body$
        SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
      $body$
    $fn$;
  END IF;
  IF to_regprocedure('auth.role()') IS NULL THEN
    EXECUTE $fn$
      CREATE FUNCTION auth.role()
      RETURNS text
      LANGUAGE sql
      STABLE
      AS $body$
        SELECT NULLIF(current_setting('request.jwt.claim.role', true), '');
      $body$
    $fn$;
  END IF;
END;
$$;

GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE IF NOT EXISTS public.saved_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text NOT NULL,
  resume_token text UNIQUE NOT NULL,
  quote_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_soft_lead boolean NOT NULL DEFAULT false,
  deposit_status text,
  deposit_amount numeric,
  deposit_paid_at timestamptz,
  quote_pdf_path text,
  quote_pdf_sha256 text
);

CREATE INDEX IF NOT EXISTS idx_saved_quotes_email ON public.saved_quotes (email);
CREATE INDEX IF NOT EXISTS idx_saved_quotes_expires ON public.saved_quotes (expires_at);

CREATE TABLE IF NOT EXISTS public.customer_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  anonymous_session_id text,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  lead_source text,
  lead_status text,
  quote_data jsonb,
  deposit_amount numeric,
  motor_model_id uuid,
  base_price numeric NOT NULL DEFAULT 0,
  final_price numeric NOT NULL DEFAULT 0,
  loan_amount numeric NOT NULL DEFAULT 0,
  monthly_payment numeric NOT NULL DEFAULT 0,
  term_months integer NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  tradein_value_pre_penalty numeric,
  tradein_value_final numeric,
  penalty_applied boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_quotes_lead_source
  ON public.customer_quotes (lead_source);

ALTER TABLE public.saved_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read all saved quotes" ON public.saved_quotes;
CREATE POLICY "Admins can read all saved quotes"
  ON public.saved_quotes
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Users can view own saved quotes" ON public.saved_quotes;
CREATE POLICY "Users can view own saved quotes"
  ON public.saved_quotes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can read all quotes" ON public.customer_quotes;
CREATE POLICY "Admins can read all quotes"
  ON public.customer_quotes
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Authenticated users can read their own quotes" ON public.customer_quotes;
CREATE POLICY "Authenticated users can read their own quotes"
  ON public.customer_quotes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

REVOKE ALL ON TABLE public.saved_quotes FROM PUBLIC;
REVOKE ALL ON TABLE public.customer_quotes FROM PUBLIC;
REVOKE ALL ON TABLE public.user_roles FROM PUBLIC;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.user_roles TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.saved_quotes TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.customer_quotes TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

CREATE SCHEMA IF NOT EXISTS storage;

CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL,
  public boolean NOT NULL DEFAULT false,
  file_size_limit bigint,
  allowed_mime_types text[]
);

CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text NOT NULL,
  name text NOT NULL,
  UNIQUE (bucket_id, name)
);

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'quotes',
  'quotes',
  false,
  5242880,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Service role manages private quote documents" ON storage.objects;
CREATE POLICY "Service role manages private quote documents"
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'quotes')
  WITH CHECK (bucket_id = 'quotes');

CREATE TABLE IF NOT EXISTS public.deposit_staging_marker (
  id text PRIMARY KEY,
  schema_surface text NOT NULL,
  target_project_ref text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.deposit_staging_marker (
  id,
  schema_surface,
  target_project_ref
) VALUES (
  'deposit-deal-packet-staging/hosted-bootstrap/v1',
  'deposit-deal-packet-hosted-bootstrap/v1',
  'ccozickwrpautlxknsjk'
)
ON CONFLICT (id) DO UPDATE
SET
  schema_surface = EXCLUDED.schema_surface,
  target_project_ref = EXCLUDED.target_project_ref,
  applied_at = now();

ALTER TABLE public.deposit_staging_marker ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.deposit_staging_marker FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.deposit_staging_marker TO service_role;

COMMENT ON TABLE public.deposit_staging_marker IS
  'Hosted-staging schema-surface marker. Not proof of the connected project. Never apply this bootstrap to eutsoqdpjurknjsshxes.';

COMMIT;
