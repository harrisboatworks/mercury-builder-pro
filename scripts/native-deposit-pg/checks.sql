INSERT INTO public.saved_quotes(id,user_id,email,resume_token,quote_state,deposit_status,deposit_amount,
  quote_pdf_path,quote_pdf_sha256,customer_full_name,customer_phone,customer_address_line1,customer_city,customer_region,customer_postal_code,customer_country)
SELECT id, '33333333-3333-4333-8333-333333333333', 'synthetic@example.invalid', 'dep_' || left(replace(id::text,'-',''),24),
  '{"motor":{"id":"36363636-3636-4636-8636-363636363636","model":"90HP"},"depositPolicySnapshot":{"schema":"deposit-policy/v1","motorId":"36363636-3636-4636-8636-363636363636","stockClassification":"in_stock","policyCode":"in_stock_refundable","purchasePath":"motor_only"}}'::jsonb,
  'pending', 500, 'saved-quotes/' || id || '/quote.pdf', repeat('a',64), 'Synthetic Buyer', '6135550100', '1 Example Invalid Road', 'Exampleville', 'ON', 'K0K0A0', 'CA'
FROM (VALUES ('71717171-7171-4171-8171-717171717171'::uuid), ('72727272-7272-4272-8272-727272727272'::uuid), ('73737373-7373-4373-8373-737373737373'::uuid)) x(id);
INSERT INTO public.native_deposit_intents(id,child_id,parent_session_id,saved_quote_id,owner_user_id,motor_id,
  amount_cents,currency,merchandise_cents,document_sha256,document_path,policy_version,policy_code,terms_version,
  catalog_model_number,horsepower,status,expires_at)
SELECT id, 'ndc_' || replace(id::text,'-',''), 'chk_synthetic', id, '33333333-3333-4333-8333-333333333333',
  '36363636-3636-4636-8636-363636363636',50000,'CAD',1400000,repeat('a',64),'saved-quotes/' || id || '/quote.pdf',
  'deposit-policy/v1','in_stock_refundable','hbw-reservation-terms/2026-04-08','90ELPT',90,'requires_escalation',now()+interval '1 hour'
FROM public.saved_quotes WHERE id::text LIKE '7%';
INSERT INTO public.native_deposit_review_challenges(nonce_hash,intent_id,actor_fingerprint,review_digest,expires_at)
VALUES(repeat('b',64),'71717171-7171-4171-8171-717171717171',repeat('c',64),repeat('d',64),now()+interval '10 minutes');
SET ROLE service_role;
DO $$ DECLARE v_id uuid := '71717171-7171-4171-8171-717171717171'; result jsonb; attempt uuid; ok boolean; BEGIN
  BEGIN
    UPDATE public.saved_quotes SET user_id='44444444-4444-4444-8444-444444444444' WHERE saved_quotes.id=v_id;
    RAISE EXCEPTION 'owner drift accepted before approval';
  EXCEPTION WHEN serialization_failure THEN NULL; END;
  result := public.claim_native_deposit_attempt(v_id,repeat('e',64),repeat('f',64),50000,'acct_synthetic',false);
  IF result->>'result' <> 'refused' THEN RAISE EXCEPTION 'charge without approval'; END IF;
  IF public.approve_native_deposit_review(v_id,repeat('b',64),repeat('f',64),repeat('d',64)) THEN RAISE EXCEPTION 'wrong actor accepted'; END IF;
  IF NOT public.approve_native_deposit_review(v_id,repeat('b',64),repeat('c',64),repeat('d',64)) THEN RAISE EXCEPTION 'trusted challenge refused'; END IF;
  IF public.approve_native_deposit_review(v_id,repeat('b',64),repeat('c',64),repeat('d',64)) THEN RAISE EXCEPTION 'nonce replay accepted'; END IF;
  result := public.claim_native_deposit_attempt(v_id,repeat('e',64),repeat('f',64),50000,'acct_synthetic',false);
  IF result->>'result' <> 'claimed' THEN RAISE EXCEPTION 'attempt not claimed %',result; END IF;
  attempt := (result->>'attempt_id')::uuid;
  result := public.claim_native_deposit_attempt(v_id,repeat('a',64),repeat('f',64),50000,'acct_synthetic',false);
  IF result->>'result' <> 'conflict' THEN RAISE EXCEPTION 'second token accepted'; END IF;
  IF public.claim_hosted_deposit_rail(v_id) THEN RAISE EXCEPTION 'hosted charge admitted during native attempt'; END IF;
  BEGIN
    UPDATE public.saved_quotes SET quote_pdf_sha256=repeat('b',64) WHERE saved_quotes.id=v_id;
    RAISE EXCEPTION 'document mutation accepted';
  EXCEPTION WHEN serialization_failure THEN NULL; END;
  IF NOT public.bind_native_deposit_payment_intent(attempt,NULL,'submitted') THEN RAISE EXCEPTION 'submission marker failed'; END IF;
  IF NOT public.bind_native_deposit_payment_intent(attempt,'pi_synthetic','processing') THEN RAISE EXCEPTION 'PI binding failed'; END IF;
  IF public.bind_native_deposit_payment_intent(attempt,'pi_conflict','processing') THEN RAISE EXCEPTION 'PI rebound'; END IF;
  IF public.claim_native_motor_deposit_paid(v_id,attempt,v_id,'pi_synthetic',50000,repeat('a',64),'36363636-3636-4636-8636-363636363636',
    'hbw-reservation-terms/2026-04-08','deposit-policy/v1','in_stock_refundable','evt_early',now()) THEN RAISE EXCEPTION 'processing attempt paid before verified success'; END IF;
  IF NOT public.bind_native_deposit_payment_intent(attempt,'pi_synthetic','succeeded') THEN RAISE EXCEPTION 'verified success marker failed'; END IF;
  ok := public.claim_native_motor_deposit_paid(v_id,attempt,v_id,'pi_synthetic',50000,repeat('b',64),'36363636-3636-4636-8636-363636363636',
    'hbw-reservation-terms/2026-04-08','deposit-policy/v1','in_stock_refundable','evt_synthetic',now());
  IF ok THEN RAISE EXCEPTION 'wrong document paid'; END IF;
  ok := public.claim_native_motor_deposit_paid(v_id,attempt,v_id,'pi_synthetic',50000,repeat('a',64),'36363636-3636-4636-8636-363636363636',
    'hbw-reservation-terms/2026-04-08','deposit-policy/v1','in_stock_refundable','evt_synthetic',now());
  IF NOT ok THEN RAISE EXCEPTION 'valid claim refused'; END IF;
  ok := public.claim_native_motor_deposit_paid(v_id,attempt,v_id,'pi_synthetic',50000,repeat('a',64),'36363636-3636-4636-8636-363636363636',
    'hbw-reservation-terms/2026-04-08','deposit-policy/v1','in_stock_refundable','evt_replay',now());
  IF NOT ok THEN RAISE EXCEPTION 'valid replay refused'; END IF;
  IF (SELECT count(*) FROM public.deposit_email_deliveries WHERE saved_quote_id=v_id) <> 3 THEN RAISE EXCEPTION 'outbox duplicated'; END IF;
  IF (SELECT stripe_checkout_session_id FROM public.customer_quotes WHERE saved_quote_id=v_id) IS NOT NULL THEN RAISE EXCEPTION 'fake Checkout binding'; END IF;
  IF (SELECT deposit_status FROM public.saved_quotes WHERE saved_quotes.id=v_id) <> 'paid' THEN RAISE EXCEPTION 'paired saved authority unpaid'; END IF;
  IF NOT public.claim_hosted_deposit_rail('72727272-7272-4272-8272-727272727272') THEN RAISE EXCEPTION 'hosted rail unavailable'; END IF;
END; $$;
RESET ROLE;
DO $$ BEGIN
  IF has_function_privilege('anon','public.approve_native_deposit_review(uuid,text,text,text)','EXECUTE')
    OR has_function_privilege('authenticated','public.claim_native_deposit_attempt(uuid,text,text,integer,text,boolean)','EXECUTE')
    OR has_table_privilege('authenticated','public.native_deposit_approvals','INSERT')
    OR has_table_privilege('anon','public.native_deposit_attempts','SELECT') THEN RAISE EXCEPTION 'native ACL exposed'; END IF;
END; $$;
SELECT 'approval ownership and replay, no unapproved charge, one immutable PI, cross-rail exclusion, canonical freeze, paired paid authority, three unique outboxes, narrow ACLs' AS passed;
