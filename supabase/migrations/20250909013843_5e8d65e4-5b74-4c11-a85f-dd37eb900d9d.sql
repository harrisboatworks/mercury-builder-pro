-- Fix malformed motor detail URLs by removing duplicate domain prefix
UPDATE motor_models 
SET detail_url = REPLACE(detail_url, 'https://www.harrisboatworks.ca//www.harrisboatworks.ca/', 'https://www.harrisboatworks.ca/')
WHERE detail_url LIKE '%//www.harrisboatworks.ca/%';