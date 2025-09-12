-- Add auto-incrementing quote number to quotes table
ALTER TABLE public.quotes 
ADD COLUMN quote_number INTEGER;

-- Create a sequence for quote numbers starting from 100001
CREATE SEQUENCE quote_number_seq START 100001;

-- Set default value for quote_number to use the sequence
ALTER TABLE public.quotes 
ALTER COLUMN quote_number SET DEFAULT nextval('quote_number_seq');

-- Update existing quotes with sequential numbers
UPDATE public.quotes 
SET quote_number = nextval('quote_number_seq') 
WHERE quote_number IS NULL;

-- Make quote_number NOT NULL after updating existing records
ALTER TABLE public.quotes 
ALTER COLUMN quote_number SET NOT NULL;