-- Durable delivery audit for quote email, plus idempotency.
--
-- Not append-only: claim completion updates the row it claimed. Rows are
-- insert-then-complete, and only service_role can do either.
--
-- Replaces the previous pattern in send-quote-email, which did:
--   customer_quotes.update({notes}).eq('quote_number', <caller supplied>)
-- from a public (verify_jwt = false) function using the service-role client.
-- That let any anonymous caller overwrite the notes field of any quote row by
-- naming its quote number, and it recorded a send that may never have happened.
--
-- Both customer-initiated and admin-initiated sends are audited here. Callers
-- never choose the row contents: the edge function supplies validated fields
-- and the RPCs below are the only write path.

CREATE TABLE IF NOT EXISTS public.quote_email_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text NOT NULL UNIQUE,
  email_type text NOT NULL,
  quote_number text NOT NULL,
  quote_id uuid NULL,
  -- The recipient address is never stored in the clear; a hash is enough to
  -- prove "this address was mailed" without creating another PII surface.
  recipient_sha256 text NOT NULL,
  initiator text NOT NULL DEFAULT 'customer',
  status text NOT NULL DEFAULT 'sending',
  provider_message_id text NULL,
  attachment_status text NULL,
  error_detail text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz NULL,
  CONSTRAINT quote_email_deliveries_status_check
    CHECK (status IN ('sending', 'sent', 'failed'))
);

CREATE INDEX IF NOT EXISTS quote_email_deliveries_quote_id_idx
  ON public.quote_email_deliveries (quote_id) WHERE quote_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS quote_email_deliveries_quote_number_idx
  ON public.quote_email_deliveries (quote_number);
CREATE INDEX IF NOT EXISTS quote_email_deliveries_created_at_idx
  ON public.quote_email_deliveries (created_at DESC);

ALTER TABLE public.quote_email_deliveries ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated: RLS default-denies. service_role bypasses
-- RLS, and admins read through the SECURITY DEFINER reader below.
REVOKE ALL ON TABLE public.quote_email_deliveries FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.claim_quote_email_delivery_v1(
  _idempotency_key text,
  _email_type text,
  _quote_number text,
  _quote_id uuid,
  _recipient_sha256 text,
  _initiator text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  existing public.quote_email_deliveries%ROWTYPE;
  new_id uuid;
BEGIN
  IF COALESCE(_idempotency_key, '') = '' OR COALESCE(_recipient_sha256, '') = '' THEN
    RAISE EXCEPTION 'idempotency key and recipient hash are required';
  END IF;

  INSERT INTO public.quote_email_deliveries AS d (
    idempotency_key, email_type, quote_number, quote_id, recipient_sha256, initiator, status
  )
  VALUES (
    _idempotency_key, _email_type, _quote_number, _quote_id, _recipient_sha256,
    COALESCE(NULLIF(_initiator, ''), 'customer'), 'sending'
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING d.id INTO new_id;

  IF new_id IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'claimed', 'delivery_id', new_id);
  END IF;

  SELECT * INTO existing
  FROM public.quote_email_deliveries
  WHERE idempotency_key = _idempotency_key;

  -- Key squatting guard. A caller who learns a quote id must not be able to
  -- reuse its key with a different recipient, email type or quote and thereby
  -- suppress the legitimate send. Any identity mismatch is refused outright.
  IF existing.recipient_sha256 IS DISTINCT FROM _recipient_sha256
     OR existing.email_type IS DISTINCT FROM _email_type
     OR existing.quote_number IS DISTINCT FROM _quote_number
     OR existing.quote_id IS DISTINCT FROM _quote_id THEN
    RETURN jsonb_build_object('status', 'mismatch', 'delivery_id', existing.id);
  END IF;

  IF existing.status = 'sent' THEN
    RETURN jsonb_build_object(
      'status', 'duplicate',
      'delivery_id', existing.id,
      'message_id', existing.provider_message_id
    );
  END IF;

  -- Only a row we KNOW the provider rejected may be retried. A row still in
  -- 'sending' is never auto-retaken: the provider may have accepted the message
  -- before the function crashed or before the audit write landed, and the
  -- pinned Resend SDK is not confirmed to honour an Idempotency-Key header, so
  -- a retake could duplicate a real customer email. Such rows require a
  -- deliberate operator decision. See LIMITATIONS in the rollout packet.
  IF existing.status = 'failed' THEN
    UPDATE public.quote_email_deliveries
    SET status = 'sending', created_at = now(), completed_at = NULL, error_detail = NULL
    WHERE id = existing.id;
    RETURN jsonb_build_object('status', 'claimed', 'delivery_id', existing.id);
  END IF;

  RETURN jsonb_build_object('status', 'in_flight', 'delivery_id', existing.id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.complete_quote_email_delivery_v1(
  _delivery_id uuid,
  _status text,
  _message_id text,
  _error_detail text,
  _attachment_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF _status NOT IN ('sent', 'failed') THEN
    RAISE EXCEPTION 'invalid delivery status: %', _status;
  END IF;

  -- Complete only from 'sending'. Without this, a late or duplicated
  -- completion could flip an already-'sent' row back through a state that
  -- makes it eligible for another send.
  UPDATE public.quote_email_deliveries
  SET status = _status,
      provider_message_id = COALESCE(_message_id, provider_message_id),
      error_detail = left(_error_detail, 500),
      attachment_status = _attachment_status,
      completed_at = now()
  WHERE id = _delivery_id
    AND status = 'sending';

  IF NOT FOUND THEN
    RAISE WARNING 'delivery % was not in sending state; completion ignored', _delivery_id;
  END IF;
END;
$function$;

-- Admin-readable view of the audit trail (no recipient addresses stored at all).
CREATE OR REPLACE FUNCTION public.get_quote_email_deliveries_v1(_quote_number text)
RETURNS SETOF public.quote_email_deliveries
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT *
  FROM public.quote_email_deliveries
  WHERE quote_number = _quote_number
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  ORDER BY created_at DESC;
$function$;

REVOKE ALL ON FUNCTION public.claim_quote_email_delivery_v1(text, text, text, uuid, text, text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_quote_email_delivery_v1(uuid, text, text, text, text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_quote_email_deliveries_v1(text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.claim_quote_email_delivery_v1(text, text, text, uuid, text, text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_quote_email_delivery_v1(uuid, text, text, text, text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.get_quote_email_deliveries_v1(text) TO authenticated, service_role;
