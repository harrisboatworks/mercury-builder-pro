-- Add explicit deny-all RLS policies to satisfy linter while keeping tables private

-- public.quotes: deny all client access (service role bypasses RLS)
CREATE POLICY IF NOT EXISTS "No public select on quotes" ON public.quotes
FOR SELECT USING (false);

CREATE POLICY IF NOT EXISTS "No public insert on quotes" ON public.quotes
FOR INSERT WITH CHECK (false);

-- public.heartbeat: deny all client access
CREATE POLICY IF NOT EXISTS "No public select on heartbeat" ON public.heartbeat
FOR SELECT USING (false);

CREATE POLICY IF NOT EXISTS "No public insert on heartbeat" ON public.heartbeat
FOR INSERT WITH CHECK (false);