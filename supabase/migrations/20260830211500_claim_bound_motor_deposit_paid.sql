-- Claim the durable customer quote and its canonical saved quote in one short
-- transaction. The webhook validates the signed Stripe session before calling
-- this function; the function rechecks the exact rows under locks so authority
-- cannot change between validation and the paid-state transition.
CREATE OR REPLACE FUNCTION public.claim_bound_motor_deposit_paid(
  p_customer_quote_id uuid,
  p_saved_quote_id uuid,
  p_expected_quote_data jsonb,
  p_expected_customer_email text,
  p_expected_customer_name text,
  p_expected_customer_phone text,
  p_expected_deposit_amount numeric,
  p_expected_saved_quote_email text,
  p_expected_saved_quote_amount numeric,
  p_expected_saved_quote_status text,
  p_paid_quote_data jsonb,
  p_deposit_paid_at timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_quote_data jsonb;
  v_customer_email text;
  v_customer_name text;
  v_customer_phone text;
  v_deposit_amount numeric;
  v_saved_quote_email text;
  v_saved_quote_amount numeric;
  v_saved_quote_status text;
  v_expected_deposit_text text;
  v_paid_deposit_text text;
BEGIN
  IF p_customer_quote_id IS NULL
    OR p_saved_quote_id IS NULL
    OR jsonb_typeof(p_expected_quote_data) IS DISTINCT FROM 'object'
    OR jsonb_typeof(p_paid_quote_data) IS DISTINCT FROM 'object'
    OR p_expected_customer_email IS NULL
    OR btrim(p_expected_customer_email) = ''
    OR p_expected_customer_name IS NULL
    OR btrim(p_expected_customer_name) = ''
    OR p_expected_customer_phone IS NULL
    OR btrim(p_expected_customer_phone) = ''
    OR p_expected_deposit_amount IS NULL
    OR p_expected_deposit_amount <= 0
    OR p_expected_saved_quote_email IS NULL
    OR btrim(p_expected_saved_quote_email) = ''
    OR p_expected_saved_quote_amount IS NULL
    OR p_expected_saved_quote_amount IS DISTINCT FROM p_expected_deposit_amount
    OR lower(btrim(p_expected_saved_quote_email))
      IS DISTINCT FROM lower(btrim(p_expected_customer_email))
    OR p_expected_saved_quote_status IS NULL
    OR p_expected_saved_quote_status NOT IN ('pending', 'paid')
    OR p_deposit_paid_at IS NULL
  THEN
    RETURN false;
  END IF;

  -- Always lock customer_quotes before saved_quotes. Keeping one lock order
  -- prevents concurrent webhook deliveries from deadlocking each other.
  SELECT
    cq.quote_data,
    cq.customer_email,
    cq.customer_name,
    cq.customer_phone,
    cq.deposit_amount
  INTO
    v_quote_data,
    v_customer_email,
    v_customer_name,
    v_customer_phone,
    v_deposit_amount
  FROM public.customer_quotes AS cq
  WHERE cq.id = p_customer_quote_id
    AND cq.lead_source = 'deposit'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  SELECT
    sq.email,
    sq.deposit_amount,
    sq.deposit_status
  INTO
    v_saved_quote_email,
    v_saved_quote_amount,
    v_saved_quote_status
  FROM public.saved_quotes AS sq
  WHERE sq.id = p_saved_quote_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_quote_data IS DISTINCT FROM p_expected_quote_data
    OR v_customer_email IS DISTINCT FROM p_expected_customer_email
    OR v_customer_name IS DISTINCT FROM p_expected_customer_name
    OR v_customer_phone IS DISTINCT FROM p_expected_customer_phone
    OR v_deposit_amount IS DISTINCT FROM p_expected_deposit_amount
    OR v_saved_quote_email IS DISTINCT FROM p_expected_saved_quote_email
    OR v_saved_quote_amount IS DISTINCT FROM p_expected_saved_quote_amount
    OR v_saved_quote_status IS DISTINCT FROM p_expected_saved_quote_status
  THEN
    RETURN false;
  END IF;

  v_expected_deposit_text := p_expected_quote_data ->> 'deposit_amount';
  v_paid_deposit_text := p_paid_quote_data ->> 'deposit_amount';
  IF (p_expected_quote_data ->> 'saved_quote_id') IS DISTINCT FROM p_saved_quote_id::text
    OR (p_expected_quote_data ->> 'payment_type') IS DISTINCT FROM 'motor_deposit'
    OR coalesce(p_expected_quote_data ->> 'stripe_session_id', '') = ''
    OR coalesce(p_expected_quote_data ->> 'motor_id', '') = ''
    OR jsonb_typeof(p_expected_quote_data -> 'motor_info') IS DISTINCT FROM 'object'
    OR (p_paid_quote_data ->> 'saved_quote_id') IS DISTINCT FROM p_saved_quote_id::text
    OR (p_paid_quote_data ->> 'payment_type') IS DISTINCT FROM 'motor_deposit'
    OR (p_paid_quote_data ->> 'payment_status') IS DISTINCT FROM 'paid'
    OR (p_paid_quote_data ->> 'notification_status') IS DISTINCT FROM 'processing'
    OR coalesce(p_paid_quote_data ->> 'stripe_payment_intent', '') = ''
    OR coalesce(p_paid_quote_data ->> 'notification_event_id', '') = ''
    OR coalesce(p_paid_quote_data ->> 'notification_lease_expires_at', '') = ''
    OR (p_paid_quote_data ->> 'stripe_session_id')
      IS DISTINCT FROM (p_expected_quote_data ->> 'stripe_session_id')
    OR (p_paid_quote_data ->> 'motor_id')
      IS DISTINCT FROM (p_expected_quote_data ->> 'motor_id')
    OR (p_paid_quote_data -> 'motor_info')
      IS DISTINCT FROM (p_expected_quote_data -> 'motor_info')
  THEN
    RETURN false;
  END IF;

  -- Validate numeric text before casting. Keeping this separate avoids both
  -- NULL three-valued logic and expression reordering around invalid casts.
  IF v_expected_deposit_text IS NULL
    OR v_expected_deposit_text !~ '^[0-9]+([.][0-9]+)?$'
    OR v_paid_deposit_text IS NULL
    OR v_paid_deposit_text !~ '^[0-9]+([.][0-9]+)?$'
  THEN
    RETURN false;
  END IF;

  IF v_expected_deposit_text::numeric IS DISTINCT FROM p_expected_deposit_amount
    OR v_paid_deposit_text::numeric IS DISTINCT FROM p_expected_deposit_amount
  THEN
    RETURN false;
  END IF;

  IF (p_expected_quote_data ->> 'payment_status') = 'pending' THEN
    IF coalesce(p_expected_quote_data ->> 'notification_status', '') <> ''
      OR coalesce(p_expected_quote_data ->> 'stripe_payment_intent', '') <> ''
      OR v_saved_quote_status <> 'pending'
    THEN
      RETURN false;
    END IF;
  ELSIF (p_expected_quote_data ->> 'payment_status') = 'paid' THEN
    IF (p_expected_quote_data ->> 'notification_status') IS DISTINCT FROM 'processing'
      OR coalesce(p_expected_quote_data ->> 'stripe_payment_intent', '') = ''
      OR coalesce(p_expected_quote_data ->> 'notification_event_id', '') = ''
      OR coalesce(p_expected_quote_data ->> 'notification_lease_expires_at', '') = ''
      OR (p_expected_quote_data ->> 'stripe_payment_intent')
        IS DISTINCT FROM (p_paid_quote_data ->> 'stripe_payment_intent')
    THEN
      RETURN false;
    END IF;
  ELSE
    RETURN false;
  END IF;

  IF v_saved_quote_status = 'pending' THEN
    UPDATE public.saved_quotes
    SET
      deposit_status = 'paid',
      deposit_amount = p_expected_deposit_amount,
      deposit_paid_at = p_deposit_paid_at
    WHERE id = p_saved_quote_id;
  END IF;

  UPDATE public.customer_quotes
  SET
    lead_status = 'scheduled',
    quote_data = p_paid_quote_data
  WHERE id = p_customer_quote_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_bound_motor_deposit_paid(
  uuid,
  uuid,
  jsonb,
  text,
  text,
  text,
  numeric,
  text,
  numeric,
  text,
  jsonb,
  timestamptz
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.claim_bound_motor_deposit_paid(
  uuid,
  uuid,
  jsonb,
  text,
  text,
  text,
  numeric,
  text,
  numeric,
  text,
  jsonb,
  timestamptz
) TO service_role;
