-- Checkout creation previously stored motor_model_id but omitted quote_data.motor_id,
-- which the atomic paid claim requires. Repair only a pending deposit whose saved
-- quote, policy and promoted motor bindings all agree. Never rewrite a paid record,
-- an existing JSON motor binding, identity, amount, document or payment status.
BEGIN;

UPDATE public.customer_quotes AS cq
SET quote_data = cq.quote_data || jsonb_build_object('motor_id', cq.motor_model_id::text)
FROM public.saved_quotes AS sq
WHERE cq.saved_quote_id = sq.id
  AND cq.lead_source = 'deposit'
  AND cq.payment_status = 'pending'
  AND sq.deposit_status = 'pending'
  AND cq.motor_model_id IS NOT NULL
  AND jsonb_typeof(cq.quote_data) = 'object'
  AND NOT (cq.quote_data ? 'motor_id')
  AND cq.quote_data->>'payment_status' = 'pending'
  AND cq.quote_data->>'payment_type' = 'motor_deposit'
  AND cq.quote_data->>'saved_quote_id' = sq.id::text
  AND cq.quote_data->>'stripe_session_id' = cq.stripe_checkout_session_id
  AND cq.stripe_checkout_session_id ~ '^cs_(test_|live_)?[A-Za-z0-9]+$'
  AND coalesce(cq.quote_data->>'stripe_payment_intent', '') = ''
  AND coalesce(cq.quote_data->>'notification_status', '') = ''
  AND sq.quote_state->'motor'->>'id' = cq.motor_model_id::text
  AND cq.quote_data->'deposit_policy'->>'motorId' = cq.motor_model_id::text
  AND cq.deposit_amount > 0
  AND cq.deposit_amount = sq.deposit_amount
  AND cq.deposit_amount = CASE
    WHEN cq.quote_data->>'deposit_amount' ~ '^[0-9]+([.][0-9]+)?$'
    THEN (cq.quote_data->>'deposit_amount')::numeric
    ELSE NULL
  END;

COMMIT;
