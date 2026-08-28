-- Customer quote documents are private capability-bound records. The Edge
-- Function is the only supported upload/download authority; legacy objects are
-- retained in place but are not exposed through direct client storage policies.

ALTER TABLE public.saved_quotes
  ADD COLUMN IF NOT EXISTS quote_pdf_sha256 text;

COMMENT ON COLUMN public.saved_quotes.quote_pdf_sha256 IS
  'Lowercase SHA-256 of the canonical private quote PDF; service-managed only.';

UPDATE storage.buckets
SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['application/pdf']::text[]
WHERE id = 'quotes';

DROP POLICY IF EXISTS "Public can read quotes PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Anon can upload quotes PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read quotes PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own quote files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own quote files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own quote files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own quote files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own quote PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Users and admins can delete quote PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload quotes PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Service role manages private quote documents" ON storage.objects;

CREATE POLICY "Service role manages private quote documents"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'quotes')
WITH CHECK (bucket_id = 'quotes');

CREATE OR REPLACE FUNCTION public.enforce_saved_quote_document_authority()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  canonical_path text := 'saved-quotes/' || NEW.id::text || '/quote.pdf';
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.quote_pdf_path IS NOT NULL
      OR NEW.quote_pdf_sha256 IS NOT NULL
      OR NEW.deposit_pdf_path IS NOT NULL
    THEN
      RAISE EXCEPTION 'saved quote documents must be bound after insert'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.quote_pdf_path IS DISTINCT FROM OLD.quote_pdf_path
    OR NEW.quote_pdf_sha256 IS DISTINCT FROM OLD.quote_pdf_sha256
    OR NEW.deposit_pdf_path IS DISTINCT FROM OLD.deposit_pdf_path
  THEN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
      RAISE EXCEPTION 'saved quote documents are service-managed'
        USING ERRCODE = '42501';
    END IF;

    -- deposit_pdf_path was a legacy browser-upload field. Preserve existing
    -- values, but forbid any new or changed value.
    IF NEW.deposit_pdf_path IS NOT NULL
      AND NEW.deposit_pdf_path IS DISTINCT FROM OLD.deposit_pdf_path
    THEN
      RAISE EXCEPTION 'deposit_pdf_path is retired'
        USING ERRCODE = '42501';
    END IF;

    IF (NEW.quote_pdf_path IS NULL) IS DISTINCT FROM (NEW.quote_pdf_sha256 IS NULL) THEN
      RAISE EXCEPTION 'quote document path and hash must be bound together'
        USING ERRCODE = '23514';
    END IF;

    IF NEW.quote_pdf_path IS NOT NULL AND NEW.quote_pdf_path <> canonical_path THEN
      RAISE EXCEPTION 'quote document path must use the canonical key'
        USING ERRCODE = '23514';
    END IF;

    IF NEW.quote_pdf_sha256 IS NOT NULL
      AND NEW.quote_pdf_sha256 !~ '^[0-9a-f]{64}$'
    THEN
      RAISE EXCEPTION 'quote document hash must be lowercase SHA-256'
        USING ERRCODE = '23514';
    END IF;

    IF NEW.quote_pdf_path IS NOT NULL
      AND (
        NEW.is_soft_lead IS TRUE
        OR NEW.deposit_status IS DISTINCT FROM 'pending'
        OR NEW.expires_at IS NULL
        OR NEW.expires_at <= now()
        OR jsonb_typeof(NEW.quote_state) IS DISTINCT FROM 'object'
        OR jsonb_typeof(NEW.quote_state -> 'motor') IS DISTINCT FROM 'object'
      )
    THEN
      RAISE EXCEPTION 'quote document cannot be bound to an unavailable quote'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_saved_quote_document_authority()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_saved_quote_document_insert
ON public.saved_quotes;
CREATE TRIGGER enforce_saved_quote_document_insert
BEFORE INSERT ON public.saved_quotes
FOR EACH ROW
EXECUTE FUNCTION public.enforce_saved_quote_document_authority();

DROP TRIGGER IF EXISTS enforce_saved_quote_document_update
ON public.saved_quotes;
CREATE TRIGGER enforce_saved_quote_document_update
BEFORE UPDATE OF quote_pdf_path, quote_pdf_sha256, deposit_pdf_path
ON public.saved_quotes
FOR EACH ROW
EXECUTE FUNCTION public.enforce_saved_quote_document_authority();
