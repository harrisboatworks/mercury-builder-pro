-- Create unique index on source_url to prevent duplicate motors
CREATE UNIQUE INDEX IF NOT EXISTS uniq_motor_source_url ON motor_models(source_url);