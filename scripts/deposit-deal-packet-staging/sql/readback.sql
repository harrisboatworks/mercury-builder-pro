-- Expected readbacks after a staging deposit. Fixture IDs only.

SELECT id, model, model_display, horsepower, mercury_model_no, model_number,
       stock_quantity, in_stock, availability
FROM public.motor_models
WHERE id = '36363636-3636-4636-8636-363636363636';

SELECT id, email, deposit_status, deposit_amount, quote_pdf_path, quote_pdf_sha256,
       customer_full_name, customer_phone, customer_address_line1, customer_city,
       customer_region, customer_postal_code, customer_country
FROM public.saved_quotes
WHERE id IN (
  '31313131-3131-4131-8131-313131313131',
  '34343434-3434-4343-8343-343434343434'
)
ORDER BY id;

SELECT id, saved_quote_id, lead_source, payment_status, payment_paid_at,
       stripe_checkout_session_id, stripe_payment_intent_id,
       customer_email, quote_data
FROM public.customer_quotes
WHERE id IN (
  '32323232-3232-4232-8222-323232323232',
  '35353535-3535-4353-8353-353535353535'
)
   OR saved_quote_id IN (
  '31313131-3131-4131-8131-313131313131',
  '34343434-3434-4343-8343-343434343434'
)
ORDER BY id;

SELECT customer_quote_id, saved_quote_id, audience, status, provider_id,
       attempt_count, last_error, sent_at
FROM public.deposit_email_deliveries
WHERE saved_quote_id IN (
  '31313131-3131-4131-8131-313131313131',
  '34343434-3434-4343-8343-343434343434'
)
ORDER BY saved_quote_id, audience;

-- Historical control must stay paid, without an outbox marker or delivery rows.
SELECT cq.id,
       cq.payment_status,
       cq.quote_data->>'staging_historical_control' AS fingerprint,
       cq.quote_data ? 'deposit_outbox_schema' AS has_outbox_schema,
       cq.quote_data->>'notification_status' AS notification_status,
       (
         SELECT count(*)
         FROM public.deposit_email_deliveries d
         WHERE d.customer_quote_id = cq.id
       ) AS delivery_rows
FROM public.customer_quotes cq
WHERE cq.id = '35353535-3535-4353-8353-353535353535';
