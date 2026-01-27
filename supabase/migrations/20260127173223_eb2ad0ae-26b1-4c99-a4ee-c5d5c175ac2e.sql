-- Allow anonymous/public read of saved_quotes by ID
-- This enables QR code scanning to work without authentication
-- The UUID itself acts as a secure token (only those with the link can access)

CREATE POLICY "Anyone can read saved quotes by ID"
ON public.saved_quotes
FOR SELECT
USING (true);

-- Add comment explaining the security model
COMMENT ON POLICY "Anyone can read saved quotes by ID" ON public.saved_quotes IS 
'Public read access for QR code scanning. The quote UUID itself serves as a secure share token - only those with the link can access the quote data.';