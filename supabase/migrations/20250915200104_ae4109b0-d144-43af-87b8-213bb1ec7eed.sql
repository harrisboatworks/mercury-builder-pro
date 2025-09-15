-- Allow brochure rows to exist without a detail_url
ALTER TABLE motor_models
  ALTER COLUMN detail_url DROP NOT NULL;

-- Use model_key as the natural key for brochure models
CREATE UNIQUE INDEX IF NOT EXISTS motor_models_model_key_uidx
  ON motor_models (model_key);

-- Helpful defaults
ALTER TABLE motor_models
  ALTER COLUMN is_brochure SET DEFAULT false,
  ALTER COLUMN in_stock SET DEFAULT false;