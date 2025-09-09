-- Add index for faster motor lookups by last_scraped for the cron job
CREATE INDEX IF NOT EXISTS idx_motor_models_last_scraped ON motor_models(last_scraped);