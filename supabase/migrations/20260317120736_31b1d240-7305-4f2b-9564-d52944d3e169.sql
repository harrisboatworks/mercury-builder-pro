DROP POLICY IF EXISTS "Anyone can insert activity events" ON public.quote_activity_events;

CREATE POLICY "Validated insert for activity events"
  ON public.quote_activity_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    session_id IS NOT NULL
    AND length(session_id) >= 10
    AND event_type IS NOT NULL
  );