-- Fix malformed detail_url entries with duplicate domain prefixes
UPDATE motor_models 
SET detail_url = REGEXP_REPLACE(detail_url, 'https://www\.harrisboatworks\.ca/?https://www\.harrisboatworks\.ca', 'https://www.harrisboatworks.ca', 'g')
WHERE detail_url LIKE '%harrisboatworks.ca%harrisboatworks.ca%';

-- Add last_scraped column to track when motor details were last updated
ALTER TABLE motor_models ADD COLUMN IF NOT EXISTS last_scraped timestamp with time zone DEFAULT NULL;