CREATE TABLE IF NOT EXISTS public.growth_agent_audit_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  site_url text NOT NULL DEFAULT 'https://www.mercuryrepower.ca',
  source text NOT NULL DEFAULT 'manual',
  scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid
);

CREATE TABLE IF NOT EXISTS public.growth_agent_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES public.growth_agent_audit_runs(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('seo', 'links', 'technical', 'geo', 'content')),
  severity text NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'approved', 'fixed', 'ignored')),
  owner_lane text NOT NULL DEFAULT 'hermes' CHECK (owner_lane IN ('claude_lovable', 'hermes', 'openclaw', 'pc_perplexity', 'codex')),
  title text NOT NULL,
  page_url text NOT NULL,
  details text NOT NULL,
  recommendation text NOT NULL,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  fix_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_growth_agent_findings_run_id ON public.growth_agent_findings(run_id);
CREATE INDEX IF NOT EXISTS idx_growth_agent_findings_status ON public.growth_agent_findings(status);
CREATE INDEX IF NOT EXISTS idx_growth_agent_findings_owner_lane ON public.growth_agent_findings(owner_lane);
CREATE INDEX IF NOT EXISTS idx_growth_agent_audit_runs_started_at ON public.growth_agent_audit_runs(started_at DESC);

ALTER TABLE public.growth_agent_audit_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_agent_findings ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.growth_agent_audit_runs TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.growth_agent_findings TO authenticated, service_role;

DROP POLICY IF EXISTS "Admins can manage growth agent audit runs" ON public.growth_agent_audit_runs;
CREATE POLICY "Admins can manage growth agent audit runs"
ON public.growth_agent_audit_runs
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage growth agent findings" ON public.growth_agent_findings;
CREATE POLICY "Admins can manage growth agent findings"
ON public.growth_agent_findings
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.touch_growth_agent_finding_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_growth_agent_finding_updated_at ON public.growth_agent_findings;
CREATE TRIGGER trg_touch_growth_agent_finding_updated_at
BEFORE UPDATE ON public.growth_agent_findings
FOR EACH ROW
EXECUTE FUNCTION public.touch_growth_agent_finding_updated_at();
