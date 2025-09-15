-- Create unique index on detail_url to prevent duplicate motors
CREATE UNIQUE INDEX IF NOT EXISTS uniq_motor_detail_url ON motor_models(detail_url);