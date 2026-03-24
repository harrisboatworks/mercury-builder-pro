-- Add session_id column to saved_quotes for soft-lead linking
ALTER TABLE public.saved_quotes ADD COLUMN IF NOT EXISTS session_id text;

-- Index for fast lookups by session_id
CREATE INDEX IF NOT EXISTS idx_saved_quotes_session_id ON public.saved_quotes (session_id) WHERE session_id IS NOT NULL;

-- Add is_soft_lead flag to distinguish auto-saves from user-initiated saves
ALTER TABLE public.saved_quotes ADD COLUMN IF NOT EXISTS is_soft_lead boolean DEFAULT false;

-- Update INSERT policy to also allow soft-lead inserts with session_id
DROP POLICY IF EXISTS "Anyone can create saved quotes with valid data" ON public.saved_quotes;
CREATE POLICY "Anyone can create saved quotes with valid data"
  ON public.saved_quotes
  FOR INSERT
  TO public
  WITH CHECK (
    (email IS NOT NULL)
    AND (email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$')
    AND (quote_state IS NOT NULL)
  );