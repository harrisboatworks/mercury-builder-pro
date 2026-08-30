-- Synthetic local stubs only. Not a Supabase clone and not for any remote host.
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
END
$$;

GRANT anon, authenticated, service_role TO CURRENT_USER;

CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY
);

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('accept.uid', true), '')::uuid;
$$;

CREATE OR REPLACE FUNCTION auth.role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('accept.role', true), '');
$$;

CREATE OR REPLACE FUNCTION auth.jwt()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_build_object(
    'sub', NULLIF(current_setting('accept.uid', true), ''),
    'role', NULLIF(current_setting('accept.role', true), '')
  );
$$;

GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.role() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.jwt() TO anon, authenticated, service_role;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

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

CREATE TABLE public.saved_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  resume_token text UNIQUE NOT NULL,
  quote_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  deposit_status text,
  deposit_amount numeric,
  deposit_paid_at timestamptz,
  quote_pdf_path text,
  quote_pdf_sha256 text
);

CREATE TABLE public.customer_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL DEFAULT 'Ada Lovelace',
  customer_email text NOT NULL DEFAULT 'ada@example.com',
  lead_source text,
  quote_data jsonb
);

REVOKE ALL ON TABLE public.saved_quotes FROM PUBLIC;
REVOKE ALL ON TABLE public.customer_quotes FROM PUBLIC;
REVOKE ALL ON TABLE public.user_roles FROM PUBLIC;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.saved_quotes TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.customer_quotes TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.user_roles TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;

INSERT INTO auth.users (id) VALUES
  ('33333333-3333-4333-8333-333333333333'),
  ('44444444-4444-4444-8444-444444444444');

INSERT INTO public.user_roles (user_id, role) VALUES
  ('33333333-3333-4333-8333-333333333333', 'admin'),
  ('44444444-4444-4444-8444-444444444444', 'user');

CREATE TABLE public.accept_results (
  ordinal serial PRIMARY KEY,
  name text NOT NULL,
  passed boolean NOT NULL,
  detail text
);

CREATE OR REPLACE FUNCTION public.accept_record(p_name text, p_passed boolean, p_detail text DEFAULT '')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  INSERT INTO public.accept_results (name, passed, detail)
  VALUES (p_name, COALESCE(p_passed, false), COALESCE(p_detail, ''));
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_expect_sqlstate(p_name text, p_sqlstate text, p_sql text)
RETURNS void
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  BEGIN
    EXECUTE p_sql;
    PERFORM public.accept_record(p_name, false, 'expected sqlstate ' || p_sqlstate || ' but statement succeeded');
  EXCEPTION WHEN OTHERS THEN
    PERFORM public.accept_record(
      p_name,
      SQLSTATE = p_sqlstate,
      SQLSTATE || ': ' || SQLERRM
    );
  END;
END;
$$;

GRANT SELECT ON TABLE public.accept_results TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_record(text, boolean, text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_expect_sqlstate(text, text, text) TO PUBLIC;
