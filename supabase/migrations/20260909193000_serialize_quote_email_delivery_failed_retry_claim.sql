-- Forward replacement for claim_quote_email_delivery_v1.
-- 20260815160000_quote_email_delivery_audit.sql is already applied; do not
-- edit it. Competing failed-retry claims could both observe status='failed'
-- and both return claimed. Lock the row before the status decision, and treat
-- a status-qualified UPDATE's affected-row count as the only claim verdict
-- on that path. Completion, attempt tokens, and sending-not-retaken semantics
-- are unchanged.

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
  updated integer;
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
  WHERE idempotency_key = _idempotency_key
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'delivery claim lost the idempotency row';
  END IF;

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
  -- deliberate operator decision.
  IF existing.status = 'failed' THEN
    UPDATE public.quote_email_deliveries
    SET status = 'sending', created_at = now(), completed_at = NULL, error_detail = NULL
    WHERE id = existing.id
      AND status = 'failed';
    GET DIAGNOSTICS updated = ROW_COUNT;
    IF updated = 1 THEN
      RETURN jsonb_build_object('status', 'claimed', 'delivery_id', existing.id);
    END IF;
    RETURN jsonb_build_object('status', 'in_flight', 'delivery_id', existing.id);
  END IF;

  RETURN jsonb_build_object('status', 'in_flight', 'delivery_id', existing.id);
END;
$function$;

REVOKE ALL ON FUNCTION public.claim_quote_email_delivery_v1(text, text, text, uuid, text, text)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.claim_quote_email_delivery_v1(text, text, text, uuid, text, text)
  TO service_role;
