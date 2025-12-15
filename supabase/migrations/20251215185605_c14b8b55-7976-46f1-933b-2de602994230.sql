-- Fix ProKicker motor naming inconsistencies (remove extra spaces to match official price list)

-- 9.9HP ProKickers with Command Thrust
UPDATE motor_models SET 
  model_display = '9.9ELPT Command Thrust ProKicker EFI FourStroke',
  updated_at = now()
WHERE model_number = '1A10452LK';

UPDATE motor_models SET 
  model_display = '9.9EXLPT Command Thrust ProKicker EFI FourStroke',
  updated_at = now()
WHERE model_number = '1A10462LK';

UPDATE motor_models SET 
  model_display = '9.9ELHPT Command Thrust ProKicker EFI FourStroke',
  updated_at = now()
WHERE model_number = '1A10451LK';

UPDATE motor_models SET 
  model_display = '9.9EXLHPT Command Thrust ProKicker EFI FourStroke',
  updated_at = now()
WHERE model_number = '1A10461LK';

-- 15HP ProKickers
UPDATE motor_models SET 
  model_display = '15ELPT ProKicker FourStroke',
  updated_at = now()
WHERE model_number = '1A15452BK';

UPDATE motor_models SET 
  model_display = '15EXLPT ProKicker FourStroke',
  updated_at = now()
WHERE model_number = '1A15462BK';

UPDATE motor_models SET 
  model_display = '15ELHPT ProKicker FourStroke',
  updated_at = now()
WHERE model_number = '1A15451BK';

UPDATE motor_models SET 
  model_display = '15EXLHPT ProKicker FourStroke',
  updated_at = now()
WHERE model_number = '1A15461BK';

-- 25HP ProKickers
UPDATE motor_models SET 
  model_display = '25ELPT ProKicker FourStroke',
  updated_at = now()
WHERE model_number = '1A25452BK';

UPDATE motor_models SET 
  model_display = '25EXLPT ProKicker FourStroke',
  updated_at = now()
WHERE model_number = '1A25462BK';

-- Also ensure ProKickers with Command Thrust have the flag set
UPDATE motor_models SET 
  has_command_thrust = true,
  updated_at = now()
WHERE LOWER(model_display) LIKE '%prokicker%' 
  AND LOWER(model_display) LIKE '%command thrust%'
  AND (has_command_thrust = false OR has_command_thrust IS NULL);