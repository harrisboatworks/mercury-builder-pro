-- Financing application mutations are mediated by financing-application-api,
-- which fixes workflow status and binds draft updates to id + resume token.
-- Keep customer self-read and admin policies, but remove direct public/client
-- writes that can bypass those server-side invariants.

DROP POLICY IF EXISTS "Anon can create anonymous applications"
ON public.financing_applications;

DROP POLICY IF EXISTS "Users can create own applications"
ON public.financing_applications;

DROP POLICY IF EXISTS "Users can update own draft applications"
ON public.financing_applications;

-- Anonymous clients only need EXECUTE on encrypt_sin(text). Edge-function
-- writes use the service role and are unaffected by table privilege removal.
REVOKE ALL PRIVILEGES ON TABLE public.financing_applications FROM anon;
