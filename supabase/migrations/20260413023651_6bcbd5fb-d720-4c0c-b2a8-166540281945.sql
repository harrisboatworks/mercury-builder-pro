
-- 1. Enable RLS on review_monitor_state (CRITICAL: contains OAuth refresh token)
ALTER TABLE public.review_monitor_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage review_monitor_state"
ON public.review_monitor_state
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Enable RLS on hbw_knowledge
ALTER TABLE public.hbw_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active knowledge"
ON public.hbw_knowledge
FOR SELECT
USING (active = true);

CREATE POLICY "Admins can manage knowledge"
ON public.hbw_knowledge
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Enable RLS on kb_suggestions
ALTER TABLE public.kb_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage kb_suggestions"
ON public.kb_suggestions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Enable RLS on sms_review_log
ALTER TABLE public.sms_review_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sms_review_log"
ON public.sms_review_log
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 5. Fix spec-sheets storage policies: remove public write, add service_role only
DROP POLICY IF EXISTS "System can upload spec sheets" ON storage.objects;
DROP POLICY IF EXISTS "System can update spec sheets" ON storage.objects;

CREATE POLICY "Service role can upload spec sheets"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'spec-sheets');

CREATE POLICY "Service role can update spec sheets"
ON storage.objects
FOR UPDATE
TO service_role
USING (bucket_id = 'spec-sheets');

-- 6. Fix function search paths
CREATE OR REPLACE FUNCTION public.search_knowledge(query_text text, match_count integer DEFAULT 18)
 RETURNS TABLE(category text, topic text, content text)
 LANGUAGE plpgsql
 STABLE
 SET search_path = 'public'
AS $function$
DECLARE
  tsq tsquery;
BEGIN
  BEGIN
    tsq := websearch_to_tsquery('english', query_text);
  EXCEPTION WHEN OTHERS THEN
    tsq := plainto_tsquery('english', query_text);
  END;

  RETURN QUERY
    SELECT k.category, k.topic, k.content
    FROM hbw_knowledge k
    WHERE k.active = true
      AND k.category IN ('operations', 'positioning')

    UNION

    SELECT k.category, k.topic, k.content
    FROM hbw_knowledge k
    WHERE k.active = true
      AND k.category NOT IN ('operations', 'positioning')
      AND k.search_vector @@ tsq
    ORDER BY ts_rank(k.search_vector, tsq) DESC
    LIMIT match_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_all_knowledge()
 RETURNS TABLE(category text, topic text, content text)
 LANGUAGE sql
 STABLE
 SET search_path = 'public'
AS $function$
  SELECT category, topic, content
  FROM hbw_knowledge
  WHERE active = true
  ORDER BY category, topic;
$function$;

CREATE OR REPLACE FUNCTION public.update_hbw_knowledge_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
