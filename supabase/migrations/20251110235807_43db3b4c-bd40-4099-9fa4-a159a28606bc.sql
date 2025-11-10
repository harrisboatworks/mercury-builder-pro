-- Add notes history support to financing_applications
ALTER TABLE financing_applications 
  ADD COLUMN IF NOT EXISTS notes_history JSONB DEFAULT '[]'::jsonb;

-- Migrate existing notes to new structure
UPDATE financing_applications
SET notes_history = jsonb_build_array(
  jsonb_build_object(
    'id', gen_random_uuid()::text,
    'content', notes,
    'created_at', updated_at,
    'created_by', processed_by,
    'author_name', 'Legacy Note'
  )
)
WHERE notes IS NOT NULL AND notes != '' AND notes_history = '[]'::jsonb;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_financing_applications_notes_history ON financing_applications USING gin(notes_history);