-- Deletes only fixture UUID + expected example.invalid identity pairs.
-- Apply only against the isolated project after STAGING_ACCEPTANCE.md guards pass.

BEGIN;
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
  saved_quote_id = '31313131-3131-4131-8131-313131313131'
  AND customer_email = 'ada@example.invalid'
)
   OR (
  saved_quote_id = '34343434-3434-4343-8343-343434343434'
  AND customer_email = 'historical@example.invalid'
);

DELETE FROM public.saved_quotes
WHERE (
  id = '31313131-3131-4131-8131-313131313131'
  AND email = 'ada@example.invalid'
)
   OR (
  id = '34343434-3434-4343-8343-343434343434'
  AND email = 'historical@example.invalid'
);

COMMIT;
