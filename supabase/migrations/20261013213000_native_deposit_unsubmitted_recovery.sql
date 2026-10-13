-- A consent RPC can fail before commit while the caller records an unknown
-- outcome. Retry that exact never-submitted identity only with fresh consent.
-- A bound/observed PI, expired approval or changed binding remains refused.
CREATE OR REPLACE FUNCTION public.begin_native_deposit_submission(
  p_attempt_id uuid, p_token_fingerprint text, p_processor_params_hash text,
  p_amount_cents integer, p_seller_account_id text, p_livemode boolean,
  p_token_expires_at timestamptz
) RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = pg_catalog, public AS $$
DECLARE
  v_intent_id uuid;
  v_saved_id uuid;
  v_saved public.saved_quotes%ROWTYPE;
  v_quote public.customer_quotes%ROWTYPE;
  v_intent public.native_deposit_intents%ROWTYPE;
  v_approval public.native_deposit_approvals%ROWTYPE;
  v_attempt public.native_deposit_attempts%ROWTYPE;
  v_rail text;
  v_now timestamptz;
BEGIN
  SELECT a.intent_id, i.saved_quote_id INTO v_intent_id, v_saved_id
    FROM public.native_deposit_attempts a JOIN public.native_deposit_intents i ON i.id=a.intent_id
    WHERE a.id=p_attempt_id;
  IF NOT FOUND THEN RETURN false; END IF;
  -- Same lock order as attempt claiming and paired paid reconciliation.
  SELECT * INTO v_quote FROM public.customer_quotes
    WHERE saved_quote_id=v_saved_id AND lead_source='deposit' FOR UPDATE;
  SELECT * INTO v_saved FROM public.saved_quotes WHERE id=v_saved_id FOR UPDATE;
  SELECT * INTO v_intent FROM public.native_deposit_intents WHERE id=v_intent_id FOR UPDATE;
  SELECT * INTO v_approval FROM public.native_deposit_approvals WHERE intent_id=v_intent_id FOR UPDATE;
  SELECT * INTO v_attempt FROM public.native_deposit_attempts WHERE id=p_attempt_id FOR UPDATE;
  SELECT rail INTO v_rail FROM public.deposit_payment_rails WHERE saved_quote_id=v_saved_id FOR UPDATE;
  -- Transaction-start now() would allow consent to expire while waiting above.
  v_now := clock_timestamp();
  IF v_attempt.id IS NULL OR v_intent.id IS NULL OR v_saved.id IS NULL
    OR v_attempt.intent_id IS DISTINCT FROM v_intent_id
    OR v_attempt.token_fingerprint IS DISTINCT FROM p_token_fingerprint
    OR v_attempt.processor_params_hash IS DISTINCT FROM p_processor_params_hash
    OR v_attempt.amount_cents IS DISTINCT FROM p_amount_cents
    OR v_attempt.seller_account_id IS DISTINCT FROM p_seller_account_id
    OR v_attempt.livemode IS DISTINCT FROM p_livemode
    OR v_attempt.idempotency_key IS DISTINCT FROM 'native-deposit-pi:' || v_intent_id::text
    OR v_attempt.currency IS DISTINCT FROM 'CAD' THEN RETURN false; END IF;
  -- Existing submitted attempts retain the same processor identity and recovery
  -- authority. This never refreshes consent or replaces the credential/audit.
  IF v_attempt.submitted_at IS NOT NULL THEN RETURN true; END IF;
  IF v_attempt.stripe_payment_intent_id IS NOT NULL OR v_attempt.observed_payment_intent_id IS NOT NULL
    OR v_attempt.status NOT IN ('claimed','failed','unknown')
    OR v_intent.status NOT IN ('attempt_claimed','failed','unknown')
    OR v_rail IS DISTINCT FROM 'native'
    OR v_approval.id IS NULL
    OR v_approval.approved_at > v_now
    OR v_approval.expires_at <= v_now
    OR v_approval.expires_at > v_approval.approved_at + interval '10 minutes'
    OR v_intent.expires_at <= v_now
    OR v_saved.expires_at IS NULL OR v_saved.expires_at <= v_now
    OR p_token_expires_at IS NULL OR NOT isfinite(p_token_expires_at)
    OR p_token_expires_at <= v_now OR p_token_expires_at > v_now + interval '7 days'
    OR v_saved.deposit_status IS DISTINCT FROM 'pending' OR v_saved.is_soft_lead IS TRUE
    OR v_saved.user_id IS DISTINCT FROM v_intent.owner_user_id
    OR v_saved.quote_pdf_path IS DISTINCT FROM v_intent.document_path
    OR v_saved.quote_pdf_sha256 IS DISTINCT FROM v_intent.document_sha256
    OR v_saved.quote_state -> 'motor' ->> 'id' IS DISTINCT FROM v_intent.motor_id::text
    OR v_saved.deposit_amount * 100 IS DISTINCT FROM v_intent.amount_cents::numeric
    OR NULLIF(btrim(v_saved.email),'') IS NULL
    OR NULLIF(btrim(v_saved.customer_full_name),'') IS NULL
    OR NULLIF(btrim(v_saved.customer_phone),'') IS NULL
    OR NULLIF(btrim(v_saved.customer_address_line1),'') IS NULL
    OR NULLIF(btrim(v_saved.customer_city),'') IS NULL
    OR NULLIF(btrim(v_saved.customer_region),'') IS NULL
    OR NULLIF(btrim(v_saved.customer_postal_code),'') IS NULL
    OR NULLIF(btrim(v_saved.customer_country),'') IS NULL
    OR v_approval.child_id IS DISTINCT FROM v_intent.child_id
    OR v_approval.saved_quote_id IS DISTINCT FROM v_intent.saved_quote_id
    OR v_approval.motor_id IS DISTINCT FROM v_intent.motor_id
    OR v_approval.amount_cents IS DISTINCT FROM v_intent.amount_cents
    OR v_approval.currency IS DISTINCT FROM v_intent.currency
    OR v_approval.document_sha256 IS DISTINCT FROM v_intent.document_sha256
    OR v_approval.policy_version IS DISTINCT FROM v_intent.policy_version
    OR v_approval.policy_code IS DISTINCT FROM v_intent.policy_code
    OR v_approval.terms_version IS DISTINCT FROM v_intent.terms_version
    OR (v_quote.id IS NOT NULL AND (
      v_quote.payment_status='paid' OR v_quote.stripe_checkout_session_id IS NOT NULL
      OR NULLIF(v_quote.quote_data->>'stripe_session_id','') IS NOT NULL
      OR NULLIF(v_quote.quote_data->>'stripe_payment_intent','') IS NOT NULL
      OR v_quote.stripe_payment_intent_id IS NOT NULL
      OR v_quote.quote_data->>'payment_channel' IS DISTINCT FROM 'native_spt'))
  THEN RETURN false; END IF;
  PERFORM set_config('native_deposit.submission', p_attempt_id::text, true);
  UPDATE public.native_deposit_attempts SET status='submitted', submitted_at=v_now,
    submission_approval_id=v_approval.id, submission_token_expires_at=p_token_expires_at
    WHERE id=p_attempt_id;
  PERFORM set_config('native_deposit.submission', '', true);
  RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.begin_native_deposit_submission(uuid,text,text,integer,text,boolean,timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.begin_native_deposit_submission(uuid,text,text,integer,text,boolean,timestamptz) TO service_role;
