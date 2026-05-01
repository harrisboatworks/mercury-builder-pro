-- Make the shared rate-limit RPC record each checked attempt.
-- Previous implementation only counted existing audit rows, so callers that
-- did not separately log attempts could never reach their configured cap.

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _identifier text,
  _action text,
  _max_attempts integer DEFAULT 10,
  _window_minutes integer DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  attempt_count integer;
  window_start timestamp with time zone;
  normalized_identifier text;
  normalized_action text;
  max_attempts integer;
  window_minutes integer;
  parsed_ip inet;
  allowed boolean;
BEGIN
  normalized_identifier := left(coalesce(nullif(trim(_identifier), ''), 'unknown'), 512);
  normalized_action := left(coalesce(nullif(trim(_action), ''), 'unknown'), 128);
  max_attempts := greatest(coalesce(_max_attempts, 10), 1);
  window_minutes := greatest(coalesce(_window_minutes, 15), 1);
  window_start := now() - (window_minutes || ' minutes')::interval;

  SELECT COUNT(*) INTO attempt_count
  FROM public.security_audit_log
  WHERE created_at >= window_start
    AND action = normalized_action
    AND (
      user_agent = normalized_identifier
      OR user_agent LIKE '%' || normalized_identifier || '%'
      OR user_id::text = normalized_identifier
    );

  allowed := attempt_count < max_attempts;

  BEGIN
    parsed_ip := normalized_identifier::inet;
  EXCEPTION WHEN OTHERS THEN
    parsed_ip := NULL;
  END;

  INSERT INTO public.security_audit_log (
    user_id,
    action,
    table_name,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    auth.uid(),
    normalized_action,
    CASE WHEN allowed THEN 'rate_limit_allowed' ELSE 'rate_limit_denied' END,
    parsed_ip,
    normalized_identifier,
    now()
  );

  RETURN allowed;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) TO service_role;
