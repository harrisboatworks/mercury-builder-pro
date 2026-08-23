RESET ROLE;
SELECT set_config('accept.uid', '', false);
SELECT set_config('accept.role', '', false);

SELECT public.accept_record(
  'migration_saved_quote_identity_columns',
  (
    SELECT COUNT(*) = 8
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'saved_quotes'
      AND column_name IN (
        'customer_full_name', 'customer_phone', 'customer_address_line1',
        'customer_address_line2', 'customer_city', 'customer_region',
        'customer_postal_code', 'customer_country'
      )
  ),
  ''
);

SELECT public.accept_record(
  'migration_customer_quote_join_columns',
  (
    SELECT COUNT(*) = 12
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'customer_quotes'
      AND column_name IN (
        'saved_quote_id', 'stripe_checkout_session_id', 'stripe_payment_intent_id',
        'payment_status', 'payment_paid_at', 'stripe_billing_address',
        'customer_address_line1', 'customer_address_line2', 'customer_city',
        'customer_region', 'customer_postal_code', 'customer_country'
      )
  ),
  'six payment/join columns plus six submitted-address columns'
);

SELECT public.accept_record(
  'historical_join_promoted_without_paid',
  COALESCE((
    SELECT
      saved_quote_id = '11111111-1111-4111-8111-111111111111'
      AND stripe_checkout_session_id = 'cs_test_99mh001'
      AND stripe_payment_intent_id = 'pi_test_99mh001'
      AND payment_status IS NULL
      AND payment_paid_at IS NULL
      AND stripe_billing_address IS NULL
    FROM public.customer_quotes
    WHERE id = '22222222-2222-4222-8222-222222222222'
  ), false),
  ''
);

SELECT public.accept_record(
  'historical_saved_quote_not_promoted_paid',
  COALESCE((
    SELECT deposit_status IS NOT DISTINCT FROM 'pending' AND deposit_paid_at IS NULL
    FROM public.saved_quotes
    WHERE id = '11111111-1111-4111-8111-111111111111'
  ), false),
  ''
);

SELECT public.accept_record(
  'historical_no_outbox_seed',
  NOT EXISTS (SELECT 1 FROM public.deposit_email_deliveries),
  ''
);

SELECT public.accept_record(
  'orphan_saved_quote_id_not_promoted',
  COALESCE((
    SELECT
      saved_quote_id IS NULL
      AND stripe_checkout_session_id = 'cs_test_orphan001'
      AND stripe_payment_intent_id = 'pi_test_orphan001'
      AND payment_status IS NULL
    FROM public.customer_quotes
    WHERE id = '99999999-9999-4999-8999-999999999999'
  ), false),
  ''
);

SELECT public.accept_record(
  'anon_execute_deposit_authority_caller',
  has_function_privilege('anon', 'public.deposit_authority_caller()', 'EXECUTE'),
  ''
);
SELECT public.accept_record(
  'authenticated_execute_deposit_authority_caller',
  has_function_privilege('authenticated', 'public.deposit_authority_caller()', 'EXECUTE'),
  ''
);
SELECT public.accept_record(
  'service_role_execute_deposit_authority_caller',
  has_function_privilege('service_role', 'public.deposit_authority_caller()', 'EXECUTE'),
  ''
);
SELECT public.accept_record(
  'anon_execute_quote_data_helper',
  has_function_privilege(
    'anon',
    'public.deposit_quote_data_authority_changed(jsonb,jsonb)',
    'EXECUTE'
  ),
  ''
);
SELECT public.accept_record(
  'anon_no_execute_enforce_authority',
  NOT has_function_privilege('anon', 'public.enforce_customer_quotes_deposit_authority()', 'EXECUTE'),
  ''
);
SELECT public.accept_record(
  'authenticated_no_execute_enforce_authority',
  NOT has_function_privilege('authenticated', 'public.enforce_customer_quotes_deposit_authority()', 'EXECUTE'),
  ''
);
SELECT public.accept_record(
  'anon_no_execute_enforce_delete',
  NOT has_function_privilege('anon', 'public.enforce_customer_quotes_deposit_delete()', 'EXECUTE'),
  ''
);
SELECT public.accept_record(
  'anon_no_execute_claim_rpc',
  NOT has_function_privilege(
    'anon',
    'public.claim_deposit_email_delivery(uuid,text,uuid,integer)',
    'EXECUTE'
  ),
  ''
);
SELECT public.accept_record(
  'authenticated_no_execute_claim_rpc',
  NOT has_function_privilege(
    'authenticated',
    'public.claim_deposit_email_delivery(uuid,text,uuid,integer)',
    'EXECUTE'
  ),
  ''
);
SELECT public.accept_record(
  'service_role_execute_claim_rpc',
  has_function_privilege(
    'service_role',
    'public.claim_deposit_email_delivery(uuid,text,uuid,integer)',
    'EXECUTE'
  ),
  ''
);
SELECT public.accept_record(
  'service_role_no_delete_grant_on_deliveries',
  NOT has_table_privilege('service_role', 'public.deposit_email_deliveries', 'DELETE'),
  ''
);
SELECT public.accept_record(
  'anon_no_select_grant_on_deliveries',
  NOT has_table_privilege('anon', 'public.deposit_email_deliveries', 'SELECT'),
  ''
);
SELECT public.accept_record(
  'authenticated_select_only_on_deliveries',
  has_table_privilege('authenticated', 'public.deposit_email_deliveries', 'SELECT')
    AND NOT has_table_privilege('authenticated', 'public.deposit_email_deliveries', 'INSERT')
    AND NOT has_table_privilege('authenticated', 'public.deposit_email_deliveries', 'UPDATE')
    AND NOT has_table_privilege('authenticated', 'public.deposit_email_deliveries', 'DELETE'),
  ''
);

SET ROLE anon;
SELECT set_config('accept.uid', '', false);
SELECT set_config('accept.role', 'anon', false);
SELECT public.accept_record('anon_authority_caller_false', NOT public.deposit_authority_caller(), '');
SELECT public.accept_expect_sqlstate(
  'anon_insert_payment_status_rejected',
  '42501',
  $sql$
    INSERT INTO public.customer_quotes (
      id, customer_name, customer_email, lead_source, payment_status, quote_data
    ) VALUES (
      'abababab-abab-4bab-8bab-abababababab',
      'Ada Lovelace',
      'ada@example.com',
      'website',
      'paid',
      '{}'::jsonb
    )
  $sql$
);
SELECT public.accept_expect_sqlstate(
  'anon_select_deliveries_denied',
  '42501',
  'SELECT count(*) FROM public.deposit_email_deliveries'
);
SELECT public.accept_expect_sqlstate(
  'anon_claim_rpc_denied',
  '42501',
  $sql$
    SELECT public.claim_deposit_email_delivery(
      '22222222-2222-4222-8222-222222222222',
      'customer',
      '01010101-0101-4101-8101-010101010101',
      120
    )
  $sql$
);
RESET ROLE;

SET ROLE authenticated;
SELECT set_config('accept.uid', '44444444-4444-4444-8444-444444444444', false);
SELECT set_config('accept.role', 'authenticated', false);
SELECT public.accept_record('user_authority_caller_false', NOT public.deposit_authority_caller(), '');
SELECT public.accept_expect_sqlstate(
  'authenticated_insert_deposit_rejected',
  '42501',
  $sql$
    INSERT INTO public.customer_quotes (
      id, customer_name, customer_email, lead_source, quote_data
    ) VALUES (
      'acacacac-acac-4cac-8cac-acacacacacac',
      'Ada Lovelace',
      'ada@example.com',
      'deposit',
      '{}'::jsonb
    )
  $sql$
);
RESET ROLE;

SET ROLE service_role;
SELECT set_config('accept.uid', '', false);
SELECT set_config('accept.role', 'service_role', false);
SELECT public.accept_record('service_role_authority_caller_true', public.deposit_authority_caller(), '');

INSERT INTO public.saved_quotes (
  id, email, resume_token, quote_state, deposit_status
) VALUES (
  '55555555-5555-4555-8555-555555555555',
  'ada@example.com',
  'dep_accept_fresh_001',
  '{}'::jsonb,
  'pending'
);

INSERT INTO public.customer_quotes (
  id, customer_name, customer_email, lead_source, saved_quote_id, payment_status, quote_data
) VALUES (
  '77777777-7777-4777-8777-777777777777',
  'Ada Lovelace',
  'ada@example.com',
  'deposit',
  '55555555-5555-4555-8555-555555555555',
  'pending',
  '{}'::jsonb
);

INSERT INTO public.saved_quotes (
  id, email, resume_token, quote_state, deposit_status
) VALUES (
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'ada@example.com',
  'dep_accept_delete_001',
  '{}'::jsonb,
  'pending'
);

INSERT INTO public.customer_quotes (
  id, customer_name, customer_email, lead_source, saved_quote_id, payment_status, quote_data
) VALUES (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Ada Lovelace',
  'ada@example.com',
  'deposit',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'pending',
  '{}'::jsonb
);

INSERT INTO public.customer_quotes (
  id, customer_name, customer_email, lead_source, quote_data
) VALUES (
  '88888888-8888-4888-8888-888888888888',
  'Ada Lovelace',
  'ada@example.com',
  'website',
  '{}'::jsonb
);

INSERT INTO public.saved_quotes (
  id, email, resume_token, quote_state, deposit_status
) VALUES (
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'ada@example.com',
  'dep_accept_claim_001',
  '{}'::jsonb,
  'pending'
);

INSERT INTO public.customer_quotes (
  id, customer_name, customer_email, lead_source, saved_quote_id, payment_status, quote_data
) VALUES (
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'Ada Lovelace',
  'ada@example.com',
  'deposit',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'paid',
  '{}'::jsonb
);

INSERT INTO public.deposit_email_deliveries (
  customer_quote_id, saved_quote_id, audience, status
) VALUES
  ('77777777-7777-4777-8777-777777777777', '55555555-5555-4555-8555-555555555555', 'customer', 'pending'),
  ('77777777-7777-4777-8777-777777777777', '55555555-5555-4555-8555-555555555555', 'hbw', 'pending'),
  ('77777777-7777-4777-8777-777777777777', '55555555-5555-4555-8555-555555555555', 'grok_bot', 'pending'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'customer', 'pending');

SELECT public.accept_record(
  'service_role_insert_deposit_allowed',
  EXISTS (
    SELECT 1 FROM public.customer_quotes
    WHERE id = '77777777-7777-4777-8777-777777777777'
      AND lead_source = 'deposit'
  ),
  ''
);
RESET ROLE;

SET ROLE authenticated;
SELECT set_config('accept.uid', '44444444-4444-4444-8444-444444444444', false);
SELECT set_config('accept.role', 'authenticated', false);
SELECT public.accept_expect_sqlstate(
  'authenticated_update_saved_quote_id_rejected',
  '42501',
  $sql$
    UPDATE public.customer_quotes
    SET saved_quote_id = '11111111-1111-4111-8111-111111111111'
    WHERE id = '88888888-8888-4888-8888-888888888888'
  $sql$
);
SELECT public.accept_expect_sqlstate(
  'authenticated_update_quote_data_authority_rejected',
  '42501',
  $sql$
    UPDATE public.customer_quotes
    SET quote_data = jsonb_build_object('payment_status', 'paid', 'deposit_outbox_schema', 1)
    WHERE id = '77777777-7777-4777-8777-777777777777'
  $sql$
);
SELECT public.accept_expect_sqlstate(
  'authenticated_delete_deposit_rejected',
  '42501',
  $sql$
    DELETE FROM public.customer_quotes
    WHERE id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  $sql$
);
SELECT public.accept_record(
  'nonadmin_select_deliveries_rls_empty',
  (SELECT count(*) FROM public.deposit_email_deliveries) = 0,
  ''
);
SELECT public.accept_expect_sqlstate(
  'authenticated_insert_deliveries_denied',
  '42501',
  $sql$
    INSERT INTO public.deposit_email_deliveries (
      customer_quote_id, saved_quote_id, audience
    ) VALUES (
      '77777777-7777-4777-8777-777777777777',
      '55555555-5555-4555-8555-555555555555',
      'customer'
    )
  $sql$
);
SELECT public.accept_expect_sqlstate(
  'authenticated_claim_rpc_denied',
  '42501',
  $sql$
    SELECT public.claim_deposit_email_delivery(
      '77777777-7777-4777-8777-777777777777',
      'customer',
      '01010101-0101-4101-8101-010101010101',
      120
    )
  $sql$
);
RESET ROLE;
SELECT public.accept_record(
  'nested_helper_error_is_business_not_missing_execute',
  EXISTS (
    SELECT 1 FROM public.accept_results
    WHERE name = 'authenticated_update_saved_quote_id_rejected'
      AND passed
      AND detail LIKE '%deposit payment fields are service-managed%'
  ),
  ''
);

SET ROLE authenticated;
SELECT set_config('accept.uid', '33333333-3333-4333-8333-333333333333', false);
SELECT set_config('accept.role', 'authenticated', false);
SELECT public.accept_record('admin_authority_caller_true', public.deposit_authority_caller(), '');
SELECT public.accept_record(
  'admin_select_deliveries_allowed',
  (SELECT count(*) FROM public.deposit_email_deliveries) >= 3,
  ''
);
SELECT public.accept_expect_sqlstate(
  'admin_claim_rpc_denied',
  '42501',
  $sql$
    SELECT public.claim_deposit_email_delivery(
      '77777777-7777-4777-8777-777777777777',
      'hbw',
      '02020202-0202-4202-8202-020202020202',
      120
    )
  $sql$
);
DELETE FROM public.customer_quotes
WHERE id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
SELECT public.accept_record(
  'admin_delete_deposit_allowed',
  NOT EXISTS (
    SELECT 1 FROM public.customer_quotes
    WHERE id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ),
  ''
);
RESET ROLE;

SET ROLE service_role;
SELECT set_config('accept.role', 'service_role', false);
SELECT public.accept_expect_sqlstate(
  'service_role_delete_deliveries_denied',
  '42501',
  'DELETE FROM public.deposit_email_deliveries WHERE audience = ''grok_bot'''
);

SELECT public.accept_record(
  'claim_first_token_wins',
  COALESCE((
    SELECT status = 'sending' AND claim_token = '01010101-0101-4101-8101-010101010101'
    FROM public.claim_deposit_email_delivery(
      '77777777-7777-4777-8777-777777777777',
      'customer',
      '01010101-0101-4101-8101-010101010101',
      120
    )
  ), false),
  ''
);

SELECT public.accept_record(
  'claim_second_token_denied_while_leased',
  (
    SELECT public.claim_deposit_email_delivery(
      '77777777-7777-4777-8777-777777777777',
      'customer',
      '02020202-0202-4202-8202-020202020202',
      120
    )
  ) IS NULL,
  ''
);

SELECT public.accept_record(
  'complete_wrong_token_denied',
  (
    SELECT public.complete_deposit_email_delivery(
      '77777777-7777-4777-8777-777777777777',
      'customer',
      '02020202-0202-4202-8202-020202020202',
      're_wrong'
    )
  ) IS NULL,
  ''
);

SELECT public.accept_record(
  'fail_wrong_token_denied',
  (
    SELECT public.fail_deposit_email_delivery(
      '77777777-7777-4777-8777-777777777777',
      'customer',
      '02020202-0202-4202-8202-020202020202',
      'should_not_fail'
    )
  ) IS NULL,
  ''
);

SELECT public.accept_record(
  'complete_correct_token_sent',
  COALESCE((
    SELECT status = 'sent' AND provider_id = 're_customer'
    FROM public.complete_deposit_email_delivery(
      '77777777-7777-4777-8777-777777777777',
      'customer',
      '01010101-0101-4101-8101-010101010101',
      're_customer'
    )
  ), false),
  ''
);

SELECT public.accept_record(
  'claim_after_sent_denied',
  (
    SELECT public.claim_deposit_email_delivery(
      '77777777-7777-4777-8777-777777777777',
      'customer',
      '03030303-0303-4303-8303-030303030303',
      120
    )
  ) IS NULL,
  ''
);

SELECT public.accept_record(
  'historical_still_has_no_outbox_after_fresh_seed',
  NOT EXISTS (
    SELECT 1 FROM public.deposit_email_deliveries
    WHERE customer_quote_id = '22222222-2222-4222-8222-222222222222'
  ),
  ''
);
RESET ROLE;
SELECT set_config('accept.uid', '', false);
SELECT set_config('accept.role', '', false);
