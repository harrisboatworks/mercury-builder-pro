-- Create admin-accessible log table for financing submission outcomes
CREATE TABLE IF NOT EXISTS public.financing_submission_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NULL,
  user_id UUID NULL,
  stage TEXT NOT NULL, -- 'encrypt_applicant_sin' | 'encrypt_co_applicant_sin' | 'db_upsert' | 'submission'
  outcome TEXT NOT NULL, -- 'success' | 'failure'
  error_code TEXT NULL,
  error_message TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fin_sub_logs_created_at ON public.financing_submission_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fin_sub_logs_user_id ON public.financing_submission_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_fin_sub_logs_outcome ON public.financing_submission_logs (outcome);

ALTER TABLE public.financing_submission_logs ENABLE ROW LEVEL SECURITY;

-- Anyone (anon + authenticated) can INSERT a log entry (write-only telemetry)
CREATE POLICY "Anyone can insert financing submission logs"
  ON public.financing_submission_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admins can read financing submission logs"
  ON public.financing_submission_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete (cleanup); no UPDATE policy = immutable
CREATE POLICY "Admins can delete financing submission logs"
  ON public.financing_submission_logs
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));