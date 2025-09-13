-- Add lead tracking fields to customer_quotes table
ALTER TABLE customer_quotes 
ADD COLUMN lead_status text DEFAULT 'downloaded',
ADD COLUMN lead_source text DEFAULT 'pdf_download',
ADD COLUMN lead_score integer DEFAULT 0,
ADD COLUMN anonymous_session_id text,
ADD COLUMN contact_attempts integer DEFAULT 0,
ADD COLUMN last_contact_attempt timestamp with time zone,
ADD COLUMN notes text;

-- Update existing records to have 'scheduled' status since they came from consultations
UPDATE customer_quotes 
SET lead_status = 'scheduled', 
    lead_source = 'consultation' 
WHERE lead_status = 'downloaded';

-- Add index for better query performance
CREATE INDEX idx_customer_quotes_lead_status ON customer_quotes(lead_status);
CREATE INDEX idx_customer_quotes_lead_source ON customer_quotes(lead_source);
CREATE INDEX idx_customer_quotes_created_at ON customer_quotes(created_at);

-- Create a function to generate anonymous session IDs
CREATE OR REPLACE FUNCTION generate_session_id() 
RETURNS text 
LANGUAGE sql 
AS $$
  SELECT 'anon_' || substr(md5(random()::text), 1, 12);
$$;