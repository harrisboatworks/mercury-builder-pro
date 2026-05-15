-- Add admin-only SELECT policy for trade_valuation_leads to protect customer PII
CREATE POLICY "Admin-only SELECT on trade_valuation_leads"
ON public.trade_valuation_leads
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));