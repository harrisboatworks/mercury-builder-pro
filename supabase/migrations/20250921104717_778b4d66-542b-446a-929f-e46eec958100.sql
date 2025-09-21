-- Add the 2 truly missing ProKicker models and update existing ones to show ProKicker properly

-- Add missing models
INSERT INTO motor_models (
    model_number,
    model_key,
    mercury_model_no,
    model,
    model_display,
    dealer_price,
    msrp,
    horsepower,
    motor_type,
    year,
    is_brochure,
    family,
    rigging_code,
    has_command_thrust,
    created_at,
    updated_at
) VALUES 
('1A15452BK', 'FOURSTROKE-15HP-ELPT-PROKICKER', '1A15452BK', 'FourStroke', '15 ELPT ProKicker FourStroke', 5368, 7515, 15, 'Outboard', 2025, true, 'FourStroke', 'ELPT', false, now(), now()),
('1A25452BK', 'FOURSTROKE-25HP-ELPT-PROKICKER', '1A25452BK', 'FourStroke', '25 ELPT ProKicker FourStroke', 6287, 8802, 25, 'Outboard', 2025, true, 'FourStroke', 'ELPT', false, now(), now());

-- Update existing models to properly show ProKicker branding
UPDATE motor_models SET
    model_display = '9.9 ELHPT Command Thrust ProKicker EFI FourStroke',
    has_command_thrust = true,
    updated_at = now()
WHERE model_number = '1A10451LK';

UPDATE motor_models SET
    model_display = '9.9 ELPT Command Thrust ProKicker EFI FourStroke',
    has_command_thrust = true,
    updated_at = now()
WHERE model_number = '1A10452LK';

UPDATE motor_models SET
    model_display = '9.9 EXLHPT Command Thrust ProKicker EFI FourStroke',
    has_command_thrust = true,
    updated_at = now()
WHERE model_number = '1A10461LK';

UPDATE motor_models SET
    model_display = '15 ELHPT ProKicker FourStroke',
    updated_at = now()
WHERE model_number = '1A15451BK';

UPDATE motor_models SET
    model_display = '15 EXLHPT ProKicker FourStroke',
    updated_at = now()
WHERE model_number = '1A15461BK';

UPDATE motor_models SET
    model_display = '15 EXLPT ProKicker FourStroke',
    updated_at = now()
WHERE model_number = '1A15462BK';

UPDATE motor_models SET
    model_display = '25 EXLPT ProKicker FourStroke',
    updated_at = now()
WHERE model_number = '1A25462BK';