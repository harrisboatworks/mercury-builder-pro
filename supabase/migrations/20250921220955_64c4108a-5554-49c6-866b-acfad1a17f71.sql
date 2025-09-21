-- Clean up old Dropbox sync configuration approach
-- Since we're now using Dropbox Chooser instead of sync configs, 
-- we can clean up the old table data

-- Optional: Remove old sync configurations (commented out to preserve data)
-- DELETE FROM dropbox_sync_config;

-- Add a comment to the table for clarity
COMMENT ON TABLE dropbox_sync_config IS 'Legacy table - replaced by Dropbox Chooser integration. Can be removed after migration.';

-- Update motor_media table to better support Dropbox Chooser workflow
ALTER TABLE motor_media 
ADD COLUMN IF NOT EXISTS chooser_imported BOOLEAN DEFAULT FALSE;

-- Update existing Dropbox entries to mark them as chooser imports if they were from the old system
UPDATE motor_media 
SET chooser_imported = TRUE 
WHERE dropbox_path IS NOT NULL;