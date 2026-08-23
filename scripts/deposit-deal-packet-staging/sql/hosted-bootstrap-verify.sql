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

SELECT 'has_role_execute_not_anon' AS check_id,
       (
         NOT has_function_privilege('anon', 'public.has_role(uuid, public.app_role)', 'EXECUTE')
         AND has_function_privilege('authenticated', 'public.has_role(uuid, public.app_role)', 'EXECUTE')
         AND has_function_privilege('service_role', 'public.has_role(uuid, public.app_role)', 'EXECUTE')
       ) AS passed;

SELECT 'marker_rls_enabled' AS check_id,
       EXISTS (
         SELECT 1
         FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = 'public'
           AND c.relname = 'deposit_staging_marker'
           AND c.relrowsecurity
       ) AS passed;

SELECT 'marker_privileges_locked' AS check_id,
       (
         SELECT
           NOT EXISTS (
             SELECT 1
             FROM aclexplode(COALESCE(c.relacl, acldefault('r'::"char", c.relowner))) acl
             WHERE acl.grantee = 0
                OR EXISTS (
                  SELECT 1
                  FROM pg_roles r
                  WHERE r.oid = acl.grantee
                    AND r.rolname IN ('anon', 'authenticated')
                )
           )
           AND EXISTS (
             SELECT 1
             FROM aclexplode(COALESCE(c.relacl, acldefault('r'::"char", c.relowner))) acl
             JOIN pg_roles r ON r.oid = acl.grantee
             WHERE r.rolname = 'service_role'
               AND acl.privilege_type = 'SELECT'
           )
           AND NOT EXISTS (
             SELECT 1
             FROM aclexplode(COALESCE(c.relacl, acldefault('r'::"char", c.relowner))) acl
             JOIN pg_roles r ON r.oid = acl.grantee
             WHERE r.rolname = 'service_role'
               AND acl.privilege_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
           )
         FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = 'public'
           AND c.relname = 'deposit_staging_marker'
       ) AS passed;

SELECT 'marker_applying_role_can_select' AS check_id,
       has_table_privilege(current_user, 'public.deposit_staging_marker', 'SELECT') AS passed;

WITH wanted(rel, rol, privs) AS (
  VALUES
    ('user_roles', 'authenticated', ARRAY['SELECT']::text[]),
    ('user_roles', 'service_role', ARRAY['SELECT']::text[]),
    ('saved_quotes', 'authenticated', ARRAY['DELETE', 'INSERT', 'SELECT', 'UPDATE']::text[]),
    ('saved_quotes', 'service_role', ARRAY['DELETE', 'INSERT', 'SELECT', 'UPDATE']::text[]),
    ('customer_quotes', 'authenticated', ARRAY['DELETE', 'INSERT', 'SELECT', 'UPDATE']::text[]),
    ('customer_quotes', 'service_role', ARRAY['DELETE', 'INSERT', 'SELECT', 'UPDATE']::text[]),
    ('deposit_staging_marker', 'service_role', ARRAY['SELECT']::text[]),
    ('deposit_email_deliveries', 'authenticated', ARRAY['SELECT']::text[]),
    ('deposit_email_deliveries', 'service_role', ARRAY['INSERT', 'SELECT', 'UPDATE']::text[])
),
actual AS (
  SELECT
    c.relname AS rel,
    CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE r.rolname END AS rol,
    array_agg(acl.privilege_type ORDER BY acl.privilege_type) AS privs
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  CROSS JOIN LATERAL aclexplode(COALESCE(c.relacl, '{}'::aclitem[])) acl
  LEFT JOIN pg_roles r ON r.oid = acl.grantee
  WHERE n.nspname = 'public'
    AND c.relname IN (
      'user_roles', 'saved_quotes', 'customer_quotes',
      'deposit_staging_marker', 'deposit_email_deliveries'
    )
    AND (acl.grantee = 0 OR r.rolname IN ('anon', 'authenticated', 'service_role'))
  GROUP BY 1, 2
)
SELECT 'public_table_acls_exact' AS check_id,
       (
         NOT EXISTS (
           SELECT 1
           FROM actual a
           WHERE NOT EXISTS (
             SELECT 1
             FROM wanted w
             WHERE w.rel = a.rel
               AND w.rol = a.rol
               AND w.privs = a.privs
           )
         )
         AND NOT EXISTS (
           SELECT 1
           FROM wanted w
           WHERE NOT EXISTS (
             SELECT 1
             FROM actual a
             WHERE a.rel = w.rel
               AND a.rol = w.rol
               AND a.privs = w.privs
           )
         )
       ) AS passed;

WITH watched(oid) AS (
  SELECT to_regprocedure('public.has_role(uuid, public.app_role)')
  UNION ALL SELECT to_regprocedure('public.claim_deposit_email_delivery(uuid, text, uuid, integer)')
  UNION ALL SELECT to_regprocedure('public.complete_deposit_email_delivery(uuid, text, uuid, text)')
  UNION ALL SELECT to_regprocedure('public.fail_deposit_email_delivery(uuid, text, uuid, text)')
  UNION ALL SELECT to_regprocedure('public.deposit_authority_caller()')
  UNION ALL SELECT to_regprocedure('public.deposit_quote_data_authority_changed(jsonb, jsonb)')
  UNION ALL SELECT to_regprocedure('public.enforce_customer_quotes_deposit_authority()')
  UNION ALL SELECT to_regprocedure('public.enforce_customer_quotes_deposit_delete()')
  UNION ALL SELECT to_regprocedure('public.enforce_saved_quotes_deposit_authority()')
  UNION ALL SELECT to_regprocedure('public.enforce_saved_quote_bound_identity()')
),
wanted(oid, rol, privs) AS (
  SELECT to_regprocedure('public.has_role(uuid, public.app_role)'), 'authenticated', ARRAY['EXECUTE']::text[]
  UNION ALL SELECT to_regprocedure('public.has_role(uuid, public.app_role)'), 'service_role', ARRAY['EXECUTE']::text[]
  UNION ALL SELECT to_regprocedure('public.claim_deposit_email_delivery(uuid, text, uuid, integer)'), 'service_role', ARRAY['EXECUTE']::text[]
  UNION ALL SELECT to_regprocedure('public.complete_deposit_email_delivery(uuid, text, uuid, text)'), 'service_role', ARRAY['EXECUTE']::text[]
  UNION ALL SELECT to_regprocedure('public.fail_deposit_email_delivery(uuid, text, uuid, text)'), 'service_role', ARRAY['EXECUTE']::text[]
  UNION ALL SELECT to_regprocedure('public.deposit_authority_caller()'), 'anon', ARRAY['EXECUTE']::text[]
  UNION ALL SELECT to_regprocedure('public.deposit_authority_caller()'), 'authenticated', ARRAY['EXECUTE']::text[]
  UNION ALL SELECT to_regprocedure('public.deposit_authority_caller()'), 'service_role', ARRAY['EXECUTE']::text[]
  UNION ALL SELECT to_regprocedure('public.deposit_quote_data_authority_changed(jsonb, jsonb)'), 'anon', ARRAY['EXECUTE']::text[]
  UNION ALL SELECT to_regprocedure('public.deposit_quote_data_authority_changed(jsonb, jsonb)'), 'authenticated', ARRAY['EXECUTE']::text[]
  UNION ALL SELECT to_regprocedure('public.deposit_quote_data_authority_changed(jsonb, jsonb)'), 'service_role', ARRAY['EXECUTE']::text[]
),
actual AS (
  SELECT
    p.oid,
    CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE r.rolname END AS rol,
    array_agg(acl.privilege_type ORDER BY acl.privilege_type) AS privs
  FROM watched w
  JOIN pg_proc p ON p.oid = w.oid
  CROSS JOIN LATERAL aclexplode(COALESCE(p.proacl, '{}'::aclitem[])) acl
  LEFT JOIN pg_roles r ON r.oid = acl.grantee
  WHERE acl.grantee = 0 OR r.rolname IN ('anon', 'authenticated', 'service_role')
  GROUP BY 1, 2
)
SELECT 'public_function_acls_exact' AS check_id,
       (
         NOT EXISTS (SELECT 1 FROM watched WHERE oid IS NULL)
         AND NOT EXISTS (
           SELECT 1
           FROM actual a
           WHERE NOT EXISTS (
             SELECT 1
             FROM wanted w
             WHERE w.oid = a.oid
               AND w.rol = a.rol
               AND w.privs = a.privs
           )
         )
         AND NOT EXISTS (
           SELECT 1
           FROM wanted w
           WHERE w.oid IS NULL
              OR NOT EXISTS (
                SELECT 1
                FROM actual a
                WHERE a.oid = w.oid
                  AND a.rol = w.rol
                  AND a.privs = w.privs
              )
         )
       ) AS passed;
