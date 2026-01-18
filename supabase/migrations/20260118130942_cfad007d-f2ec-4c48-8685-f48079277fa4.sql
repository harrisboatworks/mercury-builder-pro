-- Add sheet_gid column to google_sheets_config
ALTER TABLE google_sheets_config 
ADD COLUMN IF NOT EXISTS sheet_gid TEXT DEFAULT NULL;

-- Set the correct GID for the user's sheet
UPDATE google_sheets_config 
SET sheet_gid = '1042549170' 
WHERE sheet_url LIKE '%1gD40fB5nzufxWuZE5utDoe_ePWsjWx8bctef-oRIgns%';