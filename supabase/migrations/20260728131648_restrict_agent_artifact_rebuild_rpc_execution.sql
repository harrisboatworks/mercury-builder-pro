-- Keep the internal rebuild dispatchers out of the exposed PostgREST RPC surface.
REVOKE EXECUTE ON FUNCTION public.dispatch_agent_artifact_rebuild()
  FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.request_agent_artifact_rebuild()
  FROM anon, authenticated;
