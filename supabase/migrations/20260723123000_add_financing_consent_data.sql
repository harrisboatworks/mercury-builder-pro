-- Preserve the electronic authorization that accompanies a submitted
-- financing application. This lives with the protected application row and is
-- never included in public resume responses.
ALTER TABLE public.financing_applications
  ADD COLUMN IF NOT EXISTS consent_data JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.financing_applications.consent_data IS
  'Electronic credit-check authorization, accuracy confirmation, terms acceptance, typed signature, and signature date.';
