-- Add admin quote fields to customer_quotes table
ALTER TABLE public.customer_quotes 
ADD COLUMN IF NOT EXISTS admin_discount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS admin_notes text,
ADD COLUMN IF NOT EXISTS customer_notes text,
ADD COLUMN IF NOT EXISTS created_by_admin uuid,
ADD COLUMN IF NOT EXISTS last_modified_by uuid,
ADD COLUMN IF NOT EXISTS last_modified_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS quote_data jsonb,
ADD COLUMN IF NOT EXISTS is_admin_quote boolean DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN public.customer_quotes.admin_discount IS 'Special discount amount applied by admin';
COMMENT ON COLUMN public.customer_quotes.admin_notes IS 'Internal notes visible only to admins';
COMMENT ON COLUMN public.customer_quotes.customer_notes IS 'Notes that appear on the customer PDF';
COMMENT ON COLUMN public.customer_quotes.quote_data IS 'Full quote state JSON for restoration/editing';
COMMENT ON COLUMN public.customer_quotes.is_admin_quote IS 'Whether this quote was created/edited by an admin';