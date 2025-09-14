-- Clean up stuck inventory updates that have been running for more than 1 hour
UPDATE inventory_updates 
SET 
  status = 'failed',
  completed_at = now(),
  error_message = 'Timed out - cleaned up by system maintenance',
  updated_at = now()
WHERE 
  status = 'running' 
  AND created_at < (now() - interval '1 hour');

-- Add index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_inventory_updates_status_created 
ON inventory_updates(status, created_at);

-- Add index for completed_at queries
CREATE INDEX IF NOT EXISTS idx_inventory_updates_completed_at 
ON inventory_updates(completed_at) 
WHERE completed_at IS NOT NULL;