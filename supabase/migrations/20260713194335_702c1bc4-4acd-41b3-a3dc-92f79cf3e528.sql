CREATE TABLE public.indexnow_submissions (
  url TEXT PRIMARY KEY,
  last_submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_reason TEXT,
  submission_count INTEGER NOT NULL DEFAULT 1
);

GRANT ALL ON public.indexnow_submissions TO service_role;

ALTER TABLE public.indexnow_submissions ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated: table is service-role-only (edge functions).
CREATE INDEX idx_indexnow_submissions_last_submitted_at
  ON public.indexnow_submissions (last_submitted_at DESC);