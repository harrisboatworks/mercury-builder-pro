-- Harden nudge_experiments UPDATE policy: prevent cross-session tampering by
-- restricting updates to rows whose session_id matches the caller's session header,
-- and require that the row was created by an anonymous (user_id IS NULL) session.
-- Authenticated users / admins continue to be covered by the existing admin policy.

DROP POLICY IF EXISTS "Anonymous can update own experiments" ON public.nudge_experiments;

CREATE POLICY "Anonymous can update own experiments"
ON public.nudge_experiments
FOR UPDATE
TO anon, authenticated
USING (
  session_id IS NOT NULL
  AND length(session_id) >= 16
  AND user_id IS NULL
  AND session_id = current_setting('request.headers', true)::json->>'x-session-id'
)
WITH CHECK (
  session_id IS NOT NULL
  AND length(session_id) >= 16
  AND user_id IS NULL
  AND session_id = current_setting('request.headers', true)::json->>'x-session-id'
);

-- Also tighten INSERT policy to require matching session header (prevents impersonation at insert time)
DROP POLICY IF EXISTS "Anonymous can insert experiments with session" ON public.nudge_experiments;

CREATE POLICY "Anonymous can insert experiments with session"
ON public.nudge_experiments
FOR INSERT
TO anon, authenticated
WITH CHECK (
  session_id IS NOT NULL
  AND length(session_id) >= 16
  AND page_path IS NOT NULL
  AND variant_id IS NOT NULL
  AND (user_id IS NULL OR user_id = auth.uid())
  AND session_id = current_setting('request.headers', true)::json->>'x-session-id'
);