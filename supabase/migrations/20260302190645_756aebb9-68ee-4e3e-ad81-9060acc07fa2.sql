-- Enable RLS on weekly_intelligence_reports
ALTER TABLE public.weekly_intelligence_reports ENABLE ROW LEVEL SECURITY;

-- Admin-only SELECT
CREATE POLICY "Admins can view intelligence reports"
ON public.weekly_intelligence_reports
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin-only INSERT
CREATE POLICY "Admins can create intelligence reports"
ON public.weekly_intelligence_reports
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin-only UPDATE
CREATE POLICY "Admins can update intelligence reports"
ON public.weekly_intelligence_reports
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin-only DELETE
CREATE POLICY "Admins can delete intelligence reports"
ON public.weekly_intelligence_reports
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));