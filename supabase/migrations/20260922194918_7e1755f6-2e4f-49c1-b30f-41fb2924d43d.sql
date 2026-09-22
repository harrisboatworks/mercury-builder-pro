
CREATE OR REPLACE FUNCTION public.weekly_report_is_test_email(p_email text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT p_email IS NULL
     OR btrim(p_email) = ''
     OR p_email ~* '(@example\.(com|ca)|^test@|placeholder|soft-lead\.local|@test\.)';
$$;
REVOKE ALL ON FUNCTION public.weekly_report_is_test_email(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.weekly_report_is_test_email(text) TO service_role, supabase_read_only_user;
GRANT EXECUTE ON FUNCTION public.weekly_report_metrics(timestamptz, timestamptz) TO supabase_read_only_user;
GRANT EXECUTE ON FUNCTION public.weekly_report_week_core(timestamptz, timestamptz) TO supabase_read_only_user;
GRANT EXECUTE ON FUNCTION public.weekly_report_test_sessions(timestamptz, timestamptz) TO supabase_read_only_user;
