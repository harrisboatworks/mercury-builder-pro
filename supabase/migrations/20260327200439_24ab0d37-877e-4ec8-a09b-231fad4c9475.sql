-- Add reference_number column to saved_quotes
ALTER TABLE public.saved_quotes 
ADD COLUMN IF NOT EXISTS reference_number text UNIQUE;

-- Create a function to auto-generate reference numbers
CREATE OR REPLACE FUNCTION public.generate_quote_reference_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_ref text;
  seq_num integer;
BEGIN
  -- Use a sequence-style approach: count existing + 1, padded to 5 digits
  -- Format: HBW-XXXXX (e.g., HBW-00001, HBW-00142)
  SELECT COALESCE(MAX(
    CASE 
      WHEN reference_number ~ '^HBW-[0-9]{5}$' 
      THEN substring(reference_number from 5)::integer 
      ELSE 0 
    END
  ), 0) + 1 INTO seq_num
  FROM saved_quotes
  WHERE reference_number IS NOT NULL;
  
  new_ref := 'HBW-' || lpad(seq_num::text, 5, '0');
  
  -- Handle unlikely collision
  WHILE EXISTS (SELECT 1 FROM saved_quotes WHERE reference_number = new_ref) LOOP
    seq_num := seq_num + 1;
    new_ref := 'HBW-' || lpad(seq_num::text, 5, '0');
  END LOOP;
  
  NEW.reference_number := new_ref;
  RETURN NEW;
END;
$$;

-- Attach trigger to auto-assign on insert
CREATE TRIGGER trg_assign_reference_number
  BEFORE INSERT ON public.saved_quotes
  FOR EACH ROW
  WHEN (NEW.reference_number IS NULL)
  EXECUTE FUNCTION public.generate_quote_reference_number();

-- Backfill existing records that have no reference_number
DO $$
DECLARE
  rec RECORD;
  seq integer := 0;
BEGIN
  FOR rec IN 
    SELECT id FROM saved_quotes 
    WHERE reference_number IS NULL 
    ORDER BY created_at ASC
  LOOP
    seq := seq + 1;
    UPDATE saved_quotes 
    SET reference_number = 'HBW-' || lpad(seq::text, 5, '0')
    WHERE id = rec.id;
  END LOOP;
END;
$$;