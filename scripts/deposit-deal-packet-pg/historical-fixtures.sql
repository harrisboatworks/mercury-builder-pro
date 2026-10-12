-- Synthetic historical rows inserted before the deal-packet migration.
-- quote_data claims paid; authoritative payment columns do not exist yet.

INSERT INTO public.saved_quotes (
  id, email, resume_token, quote_state, deposit_status, deposit_amount
) VALUES (
  '11111111-1111-4111-8111-111111111111',
  'ada@example.com',
  'dep_accept_hist_001',
  '{"motor":{"id":"motor-99mh"}}'::jsonb,
  'pending',
  500
);

INSERT INTO public.customer_quotes (
  id, customer_name, customer_email, lead_source, quote_data
) VALUES (
  '22222222-2222-4222-8222-222222222222',
  'Ada Lovelace',
  'ada@example.com',
  'deposit',
  jsonb_build_object(
    'saved_quote_id', '11111111-1111-4111-8111-111111111111',
    'stripe_session_id', 'cs_test_99mh001',
    'stripe_payment_intent', 'pi_test_99mh001',
    'payment_status', 'paid'
  )
);

INSERT INTO public.customer_quotes (
  id, customer_name, customer_email, lead_source, quote_data
) VALUES (
  '99999999-9999-4999-8999-999999999999',
  'Ada Lovelace',
  'ada@example.com',
  'deposit',
  jsonb_build_object(
    'saved_quote_id', '66666666-6666-4666-8666-666666666666',
    'stripe_session_id', 'cs_test_orphan001',
    'stripe_payment_intent', 'pi_test_orphan001',
    'payment_status', 'paid'
  )
);
