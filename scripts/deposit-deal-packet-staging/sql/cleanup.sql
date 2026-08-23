-- Deletes only the four committed fixture IDs.
-- Apply only against the isolated project after STAGING_ACCEPTANCE.md guards pass.

BEGIN;

DELETE FROM public.customer_quotes
WHERE id IN (
  '32323232-3232-4232-8222-323232323232',
  '35353535-3535-4353-8353-353535353535'
)
   OR saved_quote_id IN (
  '31313131-3131-4131-8131-313131313131',
  '34343434-3434-4343-8343-343434343434'
);

DELETE FROM public.saved_quotes
WHERE id IN (
  '31313131-3131-4131-8131-313131313131',
  '34343434-3434-4343-8343-343434343434'
);

COMMIT;
