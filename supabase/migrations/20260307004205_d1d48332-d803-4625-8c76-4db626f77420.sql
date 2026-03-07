-- Drop the restrictive admin-only insert policy
DROP POLICY IF EXISTS "Only admins can insert activity events" ON public.quote_activity_events;

-- Allow anonymous + authenticated users to insert analytics events
CREATE POLICY "Anyone can insert activity events"
ON public.quote_activity_events
FOR INSERT
TO anon, authenticated
WITH CHECK (true);