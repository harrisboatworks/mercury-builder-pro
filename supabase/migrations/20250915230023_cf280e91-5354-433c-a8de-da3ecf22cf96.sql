-- Add Mercury rigging code columns to motor_models
ALTER TABLE motor_models 
ADD COLUMN IF NOT EXISTS shaft_code TEXT,
ADD COLUMN IF NOT EXISTS shaft_inches INTEGER,
ADD COLUMN IF NOT EXISTS start_type TEXT,
ADD COLUMN IF NOT EXISTS control_type TEXT,
ADD COLUMN IF NOT EXISTS has_power_trim BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_command_thrust BOOLEAN DEFAULT false;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_motor_models_shaft_code ON motor_models(shaft_code);
CREATE INDEX IF NOT EXISTS idx_motor_models_start_type ON motor_models(start_type);
CREATE INDEX IF NOT EXISTS idx_motor_models_control_type ON motor_models(control_type);