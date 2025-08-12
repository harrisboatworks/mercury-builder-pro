-- Re-apply with explicit drops (CREATE POLICY IF NOT EXISTS is not supported)

-- public.quotes: deny all client access
DROP POLICY IF EXISTS "No public select on quotes" ON public.quotes;
CREATE POLICY "No public select on quotes" ON public.quotes
FOR SELECT USING (false);

DROP POLICY IF EXISTS "No public insert on quotes" ON public.quotes;
CREATE POLICY "No public insert on quotes" ON public.quotes
FOR INSERT WITH CHECK (false);

-- public.heartbeat: deny all client access
DROP POLICY IF EXISTS "No public select on heartbeat" ON public.heartbeat;
CREATE POLICY "No public select on heartbeat" ON public.heartbeat
FOR SELECT USING (false);

DROP POLICY IF EXISTS "No public insert on heartbeat" ON public.heartbeat;
CREATE POLICY "No public insert on heartbeat" ON public.heartbeat
FOR INSERT WITH CHECK (false);