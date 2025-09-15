-- Add missing fuel_type column to motor_models table
ALTER TABLE motor_models 
ADD COLUMN IF NOT EXISTS fuel_type TEXT;