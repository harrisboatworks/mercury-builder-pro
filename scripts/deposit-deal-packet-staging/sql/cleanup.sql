-- Deletes only the current-run staging UUID + expected example.invalid pairs,
-- plus the committed historical-control and motor fixtures.
-- Apply only against the isolated project after STAGING_ACCEPTANCE.md guards pass.

BEGIN;
\ir require-run-saved-quote-id.sql
SET LOCAL ROLE service_role;

DELETE FROM public.customer_quotes
WHERE (
  id = '32323232-3232-4232-8222-323232323232'
  AND customer_email = 'ada@example.invalid'
)
   OR (
  id = '35353535-3535-4353-8353-353535353535'
  AND customer_email = 'historical@example.invalid'
)
   OR (
  saved_quote_id = lower(btrim(current_setting('deposit_staging.saved_quote_id', false)))::uuid
  AND customer_email = 'ada@example.invalid'
)
   OR (
  saved_quote_id = '34343434-3434-4343-8343-343434343434'
  AND customer_email = 'historical@example.invalid'
);

DELETE FROM public.saved_quotes
WHERE (
  id = lower(btrim(current_setting('deposit_staging.saved_quote_id', false)))::uuid
  AND email = 'ada@example.invalid'
)
   OR (
  id = '34343434-3434-4343-8343-343434343434'
  AND email = 'historical@example.invalid'
);

DELETE FROM public.motor_models
WHERE id = '36363636-3636-4636-8636-363636363636'
  AND model = 'Staging Lovelace 90'
  AND model_number = 'STG90LOVELACE'
  AND mercury_model_no = 'STG90LOVELACE';

COMMIT;
