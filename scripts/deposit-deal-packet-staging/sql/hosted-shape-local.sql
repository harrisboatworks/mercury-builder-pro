-- Local-only hosted-shape fixture for PostgreSQL acceptance.
-- Not applied to any remote Supabase project.
-- Recreates the isolated-branch privilege layout:
--   auth/storage owned by supabase_admin
--   auth.users owned by supabase_auth_admin
--   storage.buckets / storage.objects owned by supabase_storage_admin
--   deposit_hosted_runner has USAGE and SELECT/INSERT/UPDATE/REFERENCES,
--   not schema CREATE, and is not a member of those owner roles.

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
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_admin') THEN
    CREATE ROLE supabase_admin NOLOGIN NOSUPERUSER NOBYPASSRLS INHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    CREATE ROLE supabase_auth_admin NOLOGIN NOSUPERUSER NOBYPASSRLS INHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_storage_admin') THEN
    CREATE ROLE supabase_storage_admin NOLOGIN NOSUPERUSER NOBYPASSRLS INHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'deposit_hosted_runner') THEN
    CREATE ROLE deposit_hosted_runner
      NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS INHERIT;
  END IF;
END;
$$;

GRANT service_role TO deposit_hosted_runner;

CREATE SCHEMA auth AUTHORIZATION supabase_admin;
CREATE SCHEMA storage AUTHORIZATION supabase_admin;

CREATE TABLE auth.users (
  id uuid PRIMARY KEY
);
ALTER TABLE auth.users OWNER TO supabase_auth_admin;

CREATE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
ALTER FUNCTION auth.uid() OWNER TO supabase_auth_admin;

CREATE FUNCTION auth.role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.role', true), '');
$$;
ALTER FUNCTION auth.role() OWNER TO supabase_auth_admin;

CREATE TABLE storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL,
  public boolean NOT NULL DEFAULT false,
  file_size_limit bigint,
  allowed_mime_types text[]
);
ALTER TABLE storage.buckets OWNER TO supabase_storage_admin;

CREATE TABLE storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text NOT NULL,
  name text NOT NULL,
  UNIQUE (bucket_id, name)
);
ALTER TABLE storage.objects OWNER TO supabase_storage_admin;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON SCHEMA auth FROM PUBLIC;
REVOKE ALL ON SCHEMA storage FROM PUBLIC;
REVOKE CREATE ON SCHEMA auth FROM deposit_hosted_runner, anon, authenticated, service_role;
REVOKE CREATE ON SCHEMA storage FROM deposit_hosted_runner, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA auth TO deposit_hosted_runner, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA storage TO deposit_hosted_runner, anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, REFERENCES ON TABLE auth.users TO deposit_hosted_runner;
GRANT SELECT, INSERT, UPDATE, REFERENCES ON TABLE storage.buckets TO deposit_hosted_runner;
GRANT SELECT, INSERT, UPDATE, REFERENCES ON TABLE storage.objects TO deposit_hosted_runner;
GRANT EXECUTE ON FUNCTION auth.uid() TO deposit_hosted_runner, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.role() TO deposit_hosted_runner, anon, authenticated, service_role;

ALTER SCHEMA public OWNER TO deposit_hosted_runner;
GRANT USAGE, CREATE ON SCHEMA public TO deposit_hosted_runner;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
