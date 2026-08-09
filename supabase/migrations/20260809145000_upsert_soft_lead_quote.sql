-- Stop anonymous quote snapshots from creating a new saved_quotes row on
-- every summary render. Historical duplicates are intentionally retained;
-- this function selects one canonical row per session and prevents new ones.

-- Public callers may still create ordinary saved quotes, but soft leads must
-- use the validated atomic function below. This closes the direct-insert path
-- that would otherwise bypass the advisory lock.
DROP POLICY IF EXISTS "Anyone can create saved quotes with valid data"
  ON public.saved_quotes;
CREATE POLICY "Anyone can create saved quotes with valid data"
  ON public.saved_quotes
  FOR INSERT
  TO public
  WITH CHECK (
    email IS NOT NULL
    AND email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$'
    AND quote_state IS NOT NULL
    AND COALESCE(is_soft_lead, false) IS FALSE
    AND (user_id IS NULL OR user_id = auth.uid())
  );

CREATE OR REPLACE FUNCTION public.upsert_soft_lead_quote(
  p_session_id text,
  p_quote_state jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  request_headers jsonb := COALESCE(
    NULLIF(pg_catalog.current_setting('request.headers', true), '')::jsonb,
    '{}'::jsonb
  );
  request_origin text;
  request_quote_session_id text;
  canonical_id uuid;
  insert_attempt integer;
BEGIN
  request_origin := COALESCE(
    request_headers ->> 'origin',
    request_headers ->> 'referer',
    ''
  );
  request_quote_session_id := request_headers ->> 'x-quote-session-id';

  IF NOT (
    request_origin ~ '^https://(www\.)?mercuryrepower\.ca(/|$)'
    OR request_origin ~ '^https://(www\.)?mercuryquote\.ca(/|$)'
    OR request_origin ~ '^https://quote\.harrisboatworks\.ca(/|$)'
    OR request_origin ~ '^https://[a-z0-9-]+\.(lovable\.app|lovable\.dev|vercel\.app)(/|$)'
    OR request_origin ~ '^http://(localhost|127\.0\.0\.1)(:[0-9]+)?(/|$)'
  ) THEN
    RAISE EXCEPTION 'Forbidden origin' USING ERRCODE = '42501';
  END IF;

  IF p_session_id IS NULL
    OR p_session_id !~ '^qa_[0-9a-f]{24}$'
    OR request_quote_session_id IS DISTINCT FROM p_session_id
  THEN
    RAISE EXCEPTION 'Invalid quote session' USING ERRCODE = '22023';
  END IF;

  IF p_quote_state IS NULL
    OR pg_catalog.jsonb_typeof(p_quote_state) <> 'object'
    OR pg_catalog.jsonb_typeof(p_quote_state -> 'motor') <> 'object'
    OR pg_catalog.pg_column_size(p_quote_state) > 524288
  THEN
    RAISE EXCEPTION 'Invalid quote state' USING ERRCODE = '22023';
  END IF;

  -- Serialize every writer for this high-entropy session ID. This closes the
  -- cross-tab check/insert race without deleting any historical lead evidence.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('saved_quotes:soft:' || p_session_id, 0)
  );

  SELECT id
    INTO canonical_id
  FROM public.saved_quotes
  WHERE session_id = p_session_id
    AND is_soft_lead IS TRUE
    AND (user_id IS NULL OR user_id = auth.uid())
  ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
  LIMIT 1
  FOR UPDATE;

  IF canonical_id IS NULL THEN
    -- The legacy reference-number trigger uses MAX+1. Retry a bounded number
    -- of unique collisions so concurrent sessions do not lose their soft save.
    FOR insert_attempt IN 1..3 LOOP
      BEGIN
        INSERT INTO public.saved_quotes (
          email,
          resume_token,
          quote_state,
          user_id,
          session_id,
          is_soft_lead,
          expires_at
        ) VALUES (
          'anonymous@soft-lead.local',
          'sl_' || pg_catalog.replace(pg_catalog.gen_random_uuid()::text, '-', ''),
          p_quote_state,
          auth.uid(),
          p_session_id,
          true,
          pg_catalog.now() + interval '90 days'
        )
        RETURNING id INTO canonical_id;
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        IF insert_attempt = 3 THEN
          RAISE;
        END IF;
      END;
    END LOOP;
  ELSE
    -- Last database arrival wins across tabs. The browser also queues writes
    -- within a tab so an older local snapshot cannot overtake a newer one.
    UPDATE public.saved_quotes
    SET quote_state = p_quote_state,
        user_id = COALESCE(user_id, auth.uid()),
        expires_at = pg_catalog.now() + interval '90 days',
        updated_at = pg_catalog.now()
    WHERE id = canonical_id;
  END IF;

  RETURN canonical_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.upsert_soft_lead_quote(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_soft_lead_quote(text, jsonb) TO anon, authenticated;
