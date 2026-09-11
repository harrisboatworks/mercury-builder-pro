-- Mint-job outbox and retention support for private consultation documents.
-- Existing public customer quote files stay public and are not moved,
-- deleted, rewritten, or backfilled. No pg_cron job is scheduled here.

CREATE TABLE IF NOT EXISTS public.consultation_document_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid REFERENCES public.customer_quotes(id),
  document_id uuid REFERENCES public.consultation_documents(id) ON DELETE SET NULL,
  storage_key text,
  quote_number text NOT NULL,
  sha256 text,
  status text NOT NULL,
  error_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT consultation_document_jobs_status
    CHECK (status IN ('started', 'persisted', 'emailed', 'failed', 'cleaned')),
  CONSTRAINT consultation_document_jobs_quote_number
    CHECK (quote_number ~ '^HBW-[0-9]{6}$'),
  CONSTRAINT consultation_document_jobs_sha256_hex
    CHECK (sha256 IS NULL OR sha256 ~ '^[0-9a-f]{64}$'),
  CONSTRAINT consultation_document_jobs_storage_key_canonical
    CHECK (
      storage_key IS NULL
      OR storage_key ~ '^consultation/[0-9a-f-]{36}/quote\.pdf$'
    ),
  CONSTRAINT consultation_document_jobs_error_name
    CHECK (error_name IS NULL OR char_length(error_name) <= 64)
);

CREATE INDEX IF NOT EXISTS consultation_document_jobs_status_updated_idx
  ON public.consultation_document_jobs (status, updated_at);

CREATE INDEX IF NOT EXISTS consultation_document_jobs_document_id_idx
  ON public.consultation_document_jobs (document_id);

CREATE INDEX IF NOT EXISTS consultation_document_jobs_quote_id_idx
  ON public.consultation_document_jobs (quote_id);

ALTER TABLE public.consultation_document_jobs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.consultation_document_jobs FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.consultation_document_jobs TO service_role;

COMMENT ON TABLE public.consultation_document_jobs IS
  'Idempotent mint/delivery outbox for private consultation PDFs. Stores status and SHA-256 only. Raw fragment tokens and access URLs are never stored.';

DROP TRIGGER IF EXISTS enforce_consultation_job_write
ON public.consultation_document_jobs;
CREATE TRIGGER enforce_consultation_job_write
BEFORE INSERT OR UPDATE ON public.consultation_document_jobs
FOR EACH ROW
EXECUTE FUNCTION public.enforce_consultation_document_authority();

INSERT INTO public.data_retention_policies (table_name, retention_days, description)
SELECT
  'consultation_documents',
  37,
  'Private consultation PDFs: 30-day token TTL plus 7-day expired purge grace.'
WHERE NOT EXISTS (
  SELECT 1 FROM public.data_retention_policies WHERE table_name = 'consultation_documents'
);

INSERT INTO public.data_retention_policies (table_name, retention_days, description)
SELECT
  'consultation_document_jobs',
  37,
  'Consultation mint jobs: retain failed/cleaned audit rows for the same window as the PDF.'
WHERE NOT EXISTS (
  SELECT 1 FROM public.data_retention_policies WHERE table_name = 'consultation_document_jobs'
);
