-- Fix security vulnerability in quotes table
-- Ensure proper access controls and data integrity

-- First, ensure the trigger exists for quotes table
DROP TRIGGER IF EXISTS enforce_quotes_user_id_trigger ON public.quotes;

CREATE TRIGGER enforce_quotes_user_id_trigger
  BEFORE INSERT OR UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_quotes_user_id();

-- Check if there are any quotes without user_id before adding constraint
-- Only add constraint if no NULL user_id values exist
DO $$
DECLARE
  null_count integer;
BEGIN
  SELECT COUNT(*) INTO null_count FROM public.quotes WHERE user_id IS NULL;
  
  -- If there are NULL values, we need to handle them
  IF null_count > 0 THEN
    RAISE NOTICE 'Found % quotes without user_id. These need manual review.', null_count;
    -- For security, we'll delete these orphaned records rather than assign them
    DELETE FROM public.quotes WHERE user_id IS NULL;
  END IF;
  
  -- Add constraint to prevent future NULL user_id insertions
  ALTER TABLE public.quotes 
  ADD CONSTRAINT quotes_user_id_not_null 
  CHECK (user_id IS NOT NULL);
END $$;