ALTER TABLE public.financing_applications
ADD COLUMN IF NOT EXISTS submission_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS financing_applications_submission_id_key
ON public.financing_applications (submission_id);

COMMENT ON COLUMN public.financing_applications.submission_id IS
'Client-generated idempotency key for one financing submission attempt; safe to reuse after an ambiguous response.';
