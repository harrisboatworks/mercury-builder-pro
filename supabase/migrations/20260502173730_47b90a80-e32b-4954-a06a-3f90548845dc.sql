-- Add admin SELECT policy on payments so admins can view payment records
-- through the application without needing service_role credentials.
CREATE POLICY "Admins can view all payments"
ON public.payments
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Make the service_role write path on inventory_updates explicit and auditable.
-- Without policies, default-deny RLS already blocks anon/authenticated writes;
-- this policy documents the intent and prevents accidental future openings.
CREATE POLICY "Service role manages inventory_updates"
ON public.inventory_updates
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
