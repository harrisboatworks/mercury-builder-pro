-- Local-only. Replays the previous hosted privilege steps after
-- ALTER DEFAULT PRIVILEGES ALL grants. Not applied to any remote project.

GRANT ALL ON TABLE public.user_roles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.saved_quotes TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.customer_quotes TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.deposit_staging_marker TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.deposit_email_deliveries TO anon, authenticated, service_role;

REVOKE ALL ON TABLE public.user_roles FROM PUBLIC;
REVOKE ALL ON TABLE public.saved_quotes FROM PUBLIC;
REVOKE ALL ON TABLE public.customer_quotes FROM PUBLIC;
REVOKE ALL ON TABLE public.deposit_staging_marker FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.deposit_email_deliveries FROM PUBLIC, anon;

GRANT SELECT ON TABLE public.user_roles TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.saved_quotes TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.customer_quotes TO authenticated, service_role;
GRANT SELECT ON TABLE public.deposit_staging_marker TO service_role;
GRANT SELECT ON TABLE public.deposit_email_deliveries TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.deposit_email_deliveries TO service_role;
