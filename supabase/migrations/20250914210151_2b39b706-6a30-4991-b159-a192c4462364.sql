-- Clear existing motor data to allow fresh import of all 115 motors
DELETE FROM motor_models;

-- Reset the sequence counters if needed
-- This will allow the scraper to import all motors without false duplicate detection