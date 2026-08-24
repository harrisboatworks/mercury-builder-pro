-- Synthetic staging + historical-control rows only.
-- Apply only after STAGING_ACCEPTANCE.md fail-closed guards pass.
-- Do not run against eutsoqdpjurknjsshxes.

BEGIN;

CREATE TABLE IF NOT EXISTS public.motor_models (
  id uuid PRIMARY KEY,
  model text NOT NULL,
  model_display text,
  horsepower numeric,
  mercury_model_no text,
  model_number text,
  stock_quantity numeric,
  in_stock boolean,
  availability text
);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.motor_models TO service_role;

SET LOCAL ROLE service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.saved_quotes)
     OR EXISTS (SELECT 1 FROM public.customer_quotes)
     OR EXISTS (SELECT 1 FROM public.motor_models)
  THEN
    RAISE EXCEPTION
      'deposit staging seed refuses a populated database; saved_quotes, customer_quotes, and motor_models must all be empty'
      USING ERRCODE = 'P0001';
  END IF;
END
$$;

INSERT INTO public.motor_models (
  id,
  model,
  model_display,
  horsepower,
  mercury_model_no,
  model_number,
  stock_quantity,
  in_stock,
  availability
) VALUES (
  '36363636-3636-4636-8636-363636363636',
  'Staging Lovelace 90',
  'Staging Lovelace 90',
  90,
  'STG90LOVELACE',
  'STG90LOVELACE',
  1,
  true,
  'In Stock'
);

INSERT INTO public.saved_quotes (
  id,
  email,
  expires_at,
  resume_token,
  quote_state,
  is_soft_lead,
  customer_full_name,
  customer_phone,
  customer_address_line1,
  customer_city,
  customer_region,
  customer_postal_code,
  customer_country,
  deposit_status,
  deposit_amount,
  deposit_paid_at,
  quote_pdf_path,
  quote_pdf_sha256
) VALUES (
  '34343434-3434-4343-8343-343434343434',
  'historical@example.invalid',
  '2099-01-01T00:00:00Z',
  'dep_343434343434343434343434',
  '{"motor":{"id":"36363636-3636-4636-8636-363636363636","model":"Staging Historical 90"}}'::jsonb,
  false,
  'Historical Control',
  '5555550199',
  '99 Historical Control Road',
  'Exampleville',
  'ON',
  'K0K 0A0',
  'Canada',
  'paid',
  500,
  '2024-01-01T00:00:00Z',
  'saved-quotes/34343434-3434-4343-8343-343434343434/quote.pdf',
  '1a43268bacbf0a74d6f3c8816c3e0d826f1582944278bc3a2cdbf776ee989adb'
);

INSERT INTO public.customer_quotes (
  id,
  lead_source,
  saved_quote_id,
  customer_name,
  customer_email,
  customer_phone,
  customer_address_line1,
  customer_city,
  customer_region,
  customer_postal_code,
  customer_country,
  payment_status,
  payment_paid_at,
  stripe_checkout_session_id,
  deposit_amount,
  base_price,
  final_price,
  loan_amount,
  monthly_payment,
  term_months,
  total_cost,
  penalty_applied,
  quote_data
) VALUES (
  '35353535-3535-4353-8353-353535353535',
  'deposit',
  '34343434-3434-4343-8343-343434343434',
  'Historical Control',
  'historical@example.invalid',
  '5555550199',
  '99 Historical Control Road',
  'Exampleville',
  'ON',
  'K0K 0A0',
  'Canada',
  'paid',
  '2024-01-01T00:00:00Z',
  'cs_test_historical_control_35353535',
  500,
  0,
  0,
  0,
  0,
  0,
  0,
  false,
  '{"payment_status":"paid","saved_quote_id":"34343434-3434-4343-8343-343434343434","notification_status":"not_sent","staging_historical_control":"deposit-deal-packet-staging/v1"}'::jsonb
);

INSERT INTO public.saved_quotes (
  id,
  email,
  expires_at,
  resume_token,
  quote_state,
  is_soft_lead,
  customer_full_name,
  customer_phone,
  customer_address_line1,
  customer_city,
  customer_region,
  customer_postal_code,
  customer_country,
  deposit_status,
  deposit_amount,
  quote_pdf_path,
  quote_pdf_sha256
) VALUES (
  '31313131-3131-4131-8131-313131313131',
  'ada@example.invalid',
  '2099-01-01T00:00:00Z',
  'dep_313131313131313131313131',
  '{"motor":{"id":"36363636-3636-4636-8636-363636363636","model":"Staging Lovelace 90"},"purchasePath":"motor_only","depositPolicySnapshot":{"schema":"deposit-policy/v1","motorId":"36363636-3636-4636-8636-363636363636","stockClassification":"in_stock","policyCode":"in_stock_refundable","stockQuantity":1,"inStock":true,"availability":"In Stock","purchasePath":"motor_only"}}'::jsonb,
  false,
  'Staging Lovelace',
  '5555550100',
  '1 Example Invalid Road',
  'Exampleville',
  'ON',
  'K0K 0A0',
  'Canada',
  'pending',
  500,
  'saved-quotes/31313131-3131-4131-8131-313131313131/quote.pdf',
  'e7914d99efa8418be53d3f8acd8809c6cc87f221bd097358ada61c79e747cadc'
);

COMMIT;
