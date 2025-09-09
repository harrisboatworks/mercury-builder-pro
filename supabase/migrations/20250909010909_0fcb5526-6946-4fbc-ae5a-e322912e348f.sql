-- Fix malformed detail_url entries by removing duplicate domain prefixes
UPDATE motor_models 
SET detail_url = REGEXP_REPLACE(
  detail_url, 
  'https://www\.harrisboatworks\.ca//www\.harrisboatworks\.ca/', 
  'https://www.harrisboatworks.ca/', 
  'g'
)
WHERE detail_url LIKE '%//www.harrisboatworks.ca/%';

-- Also fix any http variants  
UPDATE motor_models 
SET detail_url = REGEXP_REPLACE(
  detail_url, 
  'https?://(?:www\.)?harrisboatworks\.ca/?https?://(?:www\.)?harrisboatworks\.ca/', 
  'https://www.harrisboatworks.ca/', 
  'gi'
)
WHERE detail_url ~ 'https?://(?:www\.)?harrisboatworks\.ca/?https?://(?:www\.)?harrisboatworks\.ca/';