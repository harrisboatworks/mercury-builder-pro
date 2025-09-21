-- Reset all previously reviewed matches to pending status so they can be reviewed again
UPDATE pending_motor_matches 
SET 
  review_status = 'pending', 
  reviewed_at = NULL, 
  reviewed_by = NULL 
WHERE review_status = 'no_match';