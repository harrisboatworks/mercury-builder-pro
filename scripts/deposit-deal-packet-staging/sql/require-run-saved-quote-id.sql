-- deposit-deal-packet-staging/run-saved-quote-id/v1
-- Fail-closed per-run savedQuoteId. Included by seed, cleanup, and readback.
-- Historical control UUIDs stay committed. The operational staging saved quote
-- is operator-supplied (isolated) or the local-acceptance UUID (PostgreSQL only).

DO $$
DECLARE
  run_id text := lower(nullif(btrim(current_setting('deposit_staging.saved_quote_id', true)), ''));
  nonce text := nullif(btrim(current_setting('deposit_staging.run_nonce', true)), '');
  retired text := '31313131-3131-4131-8131-313131313131';
  local_acceptance text := '37373737-3737-4737-8737-373737373737';
  historical_saved text := '34343434-3434-4343-8343-343434343434';
  historical_customer text := '35353535-3535-4353-8353-353535353535';
  staging_customer text := '32323232-3232-4232-8222-323232323232';
  fixture_motor text := '36363636-3636-4636-8636-363636363636';
  local_nonce text;
  isolated_nonce text;
BEGIN
  IF run_id IS NULL THEN
    RAISE EXCEPTION
      'deposit staging run requires SET deposit_staging.saved_quote_id TO a UUID before seed, cleanup, or readback'
      USING ERRCODE = 'P0001';
  END IF;

  IF run_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION
      'deposit staging run saved_quote_id is malformed'
      USING ERRCODE = 'P0001';
  END IF;

  local_nonce := 'deposit-deal-packet-staging/local/' || run_id;
  isolated_nonce := 'deposit-deal-packet-staging/run/' || run_id;

  IF nonce IS DISTINCT FROM local_nonce AND nonce IS DISTINCT FROM isolated_nonce THEN
    RAISE EXCEPTION
      'deposit staging run requires SET deposit_staging.run_nonce TO deposit-deal-packet-staging/local/<id> or deposit-deal-packet-staging/run/<id> matching deposit_staging.saved_quote_id'
      USING ERRCODE = 'P0001';
  END IF;

  IF run_id = retired THEN
    RAISE EXCEPTION
      'deposit staging run refuses retired savedQuoteId 31313131-3131-4131-8131-313131313131'
      USING ERRCODE = 'P0001';
  END IF;

  IF run_id IN (historical_saved, historical_customer, staging_customer, fixture_motor) THEN
    RAISE EXCEPTION
      'deposit staging run refuses reserved fixture UUID'
      USING ERRCODE = 'P0001';
  END IF;

  IF nonce = local_nonce AND run_id IS DISTINCT FROM local_acceptance THEN
    RAISE EXCEPTION
      'deposit staging run local nonce requires the local-acceptance savedQuoteId'
      USING ERRCODE = 'P0001';
  END IF;

  IF nonce = isolated_nonce AND run_id = local_acceptance THEN
    RAISE EXCEPTION
      'deposit staging run isolated nonce refuses the local-acceptance savedQuoteId'
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;
