-- Fix existing Dropbox configurations with incorrect URL formats
UPDATE dropbox_sync_config 
SET folder_path = 'https://www.dropbox.com/' || folder_path,
    sync_status = 'idle',
    error_message = NULL
WHERE (folder_path LIKE 'scl/fo/%' OR folder_path LIKE 's/%')
  AND folder_path NOT LIKE 'https://%';