ALTER TABLE saved_quotes ADD COLUMN IF NOT EXISTS quote_pdf_path text;
ALTER TABLE saved_quotes ADD COLUMN IF NOT EXISTS deposit_pdf_path text;
ALTER TABLE saved_quotes ADD COLUMN IF NOT EXISTS deposit_status text DEFAULT NULL;
ALTER TABLE saved_quotes ADD COLUMN IF NOT EXISTS deposit_amount numeric DEFAULT NULL;
ALTER TABLE saved_quotes ADD COLUMN IF NOT EXISTS deposit_paid_at timestamptz DEFAULT NULL;