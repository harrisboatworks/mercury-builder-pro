-- Verification queries after hosted-bootstrap.sql and
-- supabase/migrations/20260823120000_deposit_deal_packet.sql.
-- Fixture-free. Safe to run before or after seed.sql.

SELECT 'marker_is_hosted_staging_v1' AS check_id,
       EXISTS (
         SELECT 1
         FROM public.deposit_staging_marker
         WHERE id = 'deposit-deal-packet-staging/hosted-bootstrap/v1'
           AND schema_surface = 'deposit-deal-packet-hosted-bootstrap/v1'
           AND target_project_ref = 'ccozickwrpautlxknsjk'
       ) AS passed;

SELECT 'quotes_bucket_is_private_pdf' AS check_id,
       EXISTS (
         SELECT 1
         FROM storage.buckets
         WHERE id = 'quotes'
           AND public IS FALSE
           AND file_size_limit = 5242880
           AND allowed_mime_types = ARRAY['application/pdf']::text[]
       ) AS passed;

SELECT 'saved_quotes_edge_columns' AS check_id,
       (
         SELECT count(*) = 22
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'saved_quotes'
           AND column_name IN (
             'id', 'user_id', 'email', 'resume_token', 'quote_state', 'expires_at',
             'created_at', 'updated_at', 'is_soft_lead',
             'deposit_status', 'deposit_amount', 'deposit_paid_at',
             'quote_pdf_path', 'quote_pdf_sha256',
             'customer_full_name', 'customer_phone',
             'customer_address_line1', 'customer_address_line2',
             'customer_city', 'customer_region', 'customer_postal_code',
             'customer_country'
           )
       ) AS passed;

SELECT 'customer_quotes_edge_columns' AS check_id,
       (
         SELECT count(*) = 33
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'customer_quotes'
           AND column_name IN (
             'id', 'user_id', 'anonymous_session_id',
             'customer_name', 'customer_email', 'customer_phone',
             'lead_source', 'lead_status', 'quote_data',
             'deposit_amount', 'motor_model_id',
             'base_price', 'final_price', 'loan_amount',
             'monthly_payment', 'term_months', 'total_cost',
             'tradein_value_pre_penalty', 'tradein_value_final',
             'penalty_applied', 'created_at',
             'saved_quote_id', 'stripe_checkout_session_id',
             'stripe_payment_intent_id', 'payment_status', 'payment_paid_at',
             'customer_address_line1', 'customer_address_line2',
             'customer_city', 'customer_region', 'customer_postal_code',
             'customer_country', 'stripe_billing_address'
           )
       ) AS passed;

SELECT 'deposit_email_deliveries_exists' AS check_id,
       to_regclass('public.deposit_email_deliveries') IS NOT NULL AS passed;

SELECT 'has_role_exists' AS check_id,
       to_regprocedure('public.has_role(uuid, public.app_role)') IS NOT NULL AS passed;
