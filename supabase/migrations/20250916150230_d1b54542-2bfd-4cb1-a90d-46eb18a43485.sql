-- Drop the overly restrictive uq_brochure_identity constraint
-- This constraint prevents multiple motors of the same family/year which is incorrect
-- The model_number constraints already handle true duplicate prevention

ALTER TABLE motor_models DROP CONSTRAINT IF EXISTS uq_brochure_identity;