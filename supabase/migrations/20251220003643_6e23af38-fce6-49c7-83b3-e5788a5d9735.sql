-- Drop the existing check constraint and recreate with all valid values
ALTER TABLE public.motor_media DROP CONSTRAINT IF EXISTS motor_media_assignment_type_check;

ALTER TABLE public.motor_media ADD CONSTRAINT motor_media_assignment_type_check 
  CHECK (assignment_type IN ('manual', 'auto', 'rule-based', 'individual', 'dropbox-curated'));