-- Name the older of the two unnamed Vault secrets as the SIN encryption key.
-- pgsodium.crypto_aead_det_encrypt needs a deterministic key id, and encrypt_sin
-- looks it up by name. Both unnamed secrets are pgsodium key material from Nov 11.
DO $$
DECLARE
  target_id uuid;
BEGIN
  SELECT id INTO target_id
  FROM vault.secrets
  WHERE name IS NULL
  ORDER BY created_at ASC
  LIMIT 1;

  IF target_id IS NULL THEN
    RAISE EXCEPTION 'No unnamed Vault secret available to repurpose';
  END IF;

  PERFORM vault.update_secret(target_id, NULL, 'sin-encryption-key', 'AES-256 deterministic key for SIN encryption (named 2026-05-14)');
END $$;