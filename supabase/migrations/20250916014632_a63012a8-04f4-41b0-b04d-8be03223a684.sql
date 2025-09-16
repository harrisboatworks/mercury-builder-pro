-- Ensure unique index on model_number for brochure rows
CREATE UNIQUE INDEX IF NOT EXISTS idx_motor_models_model_number_brochure 
ON motor_models (model_number) 
WHERE is_brochure = true;