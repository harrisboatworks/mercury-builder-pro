-- Fix Command Thrust naming mismatches and has_command_thrust flags

-- 1. 115ELPT Command Thrust FourStroke
UPDATE motor_models SET 
  model_display = '115ELPT Command Thrust FourStroke',
  has_command_thrust = true,
  updated_at = now()
WHERE model_number = '1115F532D';

-- 2. 115EXLPT Command Thrust FourStroke
UPDATE motor_models SET 
  model_display = '115EXLPT Command Thrust FourStroke',
  has_command_thrust = true,
  updated_at = now()
WHERE model_number = '1115F632D';

-- 3. 9.9MLH Command Thrust FourStroke
UPDATE motor_models SET 
  model_display = '9.9MLH Command Thrust FourStroke',
  has_command_thrust = true,
  updated_at = now()
WHERE model_number = '1A10251LK';

-- 4. 9.9MXLH Command Thrust FourStroke
UPDATE motor_models SET 
  model_display = '9.9MXLH Command Thrust FourStroke',
  has_command_thrust = true,
  updated_at = now()
WHERE model_number = '1A10261LK';

-- 5. 9.9EXLH Command Thrust FourStroke
UPDATE motor_models SET 
  model_display = '9.9EXLH Command Thrust FourStroke',
  has_command_thrust = true,
  updated_at = now()
WHERE model_number = '1A10361LK';

-- 6. Fix has_command_thrust flag for motors that already have Command Thrust in display name
UPDATE motor_models SET 
  has_command_thrust = true,
  updated_at = now()
WHERE LOWER(model_display) LIKE '%command thrust%' 
  AND (has_command_thrust = false OR has_command_thrust IS NULL);