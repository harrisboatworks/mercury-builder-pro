-- Make base_price nullable to allow motors without pricing data
ALTER TABLE motor_models ALTER COLUMN base_price DROP NOT NULL;

-- Add a comment to document this change
COMMENT ON COLUMN motor_models.base_price IS 'Base price of the motor in dollars. Can be null if price not available during scraping.';