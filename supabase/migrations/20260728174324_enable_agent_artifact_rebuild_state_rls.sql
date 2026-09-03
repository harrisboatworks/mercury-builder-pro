-- This singleton is internal cron/service state. No anon or authenticated
-- policy is intentional; privileged internal roles retain their existing access.
ALTER TABLE public.agent_artifact_rebuild_state ENABLE ROW LEVEL SECURITY;
