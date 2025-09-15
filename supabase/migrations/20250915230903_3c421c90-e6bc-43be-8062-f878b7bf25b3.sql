-- Ensure source_doc_urls column exists as JSONB array for brochure PDFs
ALTER TABLE motor_models 
ADD COLUMN IF NOT EXISTS source_doc_urls JSONB DEFAULT NULL;

-- Create index for better performance on source_doc_urls queries
CREATE INDEX IF NOT EXISTS idx_motor_models_source_doc_urls ON motor_models USING GIN(source_doc_urls);

-- Add comment to document the column
COMMENT ON COLUMN motor_models.source_doc_urls IS 'Array of URLs for brochure PDFs and documentation sources';