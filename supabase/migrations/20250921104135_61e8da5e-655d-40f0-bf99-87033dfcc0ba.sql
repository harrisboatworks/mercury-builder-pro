-- Add missing Mercury ProKicker models from official pricing
-- These are Command Thrust ProKicker and regular ProKicker variants

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
-- 9.9HP ProKicker Command Thrust models
('1A10452LK', 'FOURSTROKE-9.9HP-ELPT-CT-PROKICKER', '1A10452LK', 'FourStroke', '9.9 ELPT Command Thrust ProKicker EFI FourStroke', 4900, 4900 * 1.4, 9.9, 'Outboard', 2025, true, 'FourStroke', 'ELPT', true, now(), now()),
('1A10462LK', 'FOURSTROKE-9.9HP-EXLPT-CT-PROKICKER', '1A10462LK', 'FourStroke', '9.9 EXLPT Command Thrust ProKicker EFI FourStroke', 4983, 4983 * 1.4, 9.9, 'Outboard', 2025, true, 'FourStroke', 'EXLPT', true, now(), now()),
('1A10451LK', 'FOURSTROKE-9.9HP-ELHPT-CT-PROKICKER', '1A10451LK', 'FourStroke', '9.9 ELHPT Command Thrust ProKicker EFI FourStroke', 5000, 5000 * 1.4, 9.9, 'Outboard', 2025, true, 'FourStroke', 'ELHPT', true, now(), now()),
('1A10461LK', 'FOURSTROKE-9.9HP-EXLHPT-CT-PROKICKER', '1A10461LK', 'FourStroke', '9.9 EXLHPT Command Thrust ProKicker EFI FourStroke', 5093, 5093 * 1.4, 9.9, 'Outboard', 2025, true, 'FourStroke', 'EXLHPT', true, now(), now()),

-- 15HP ProKicker models
('1A15452BK', 'FOURSTROKE-15HP-ELPT-PROKICKER', '1A15452BK', 'FourStroke', '15 ELPT ProKicker FourStroke', 5368, 5368 * 1.4, 15, 'Outboard', 2025, true, 'FourStroke', 'ELPT', false, now(), now()),
('1A15462BK', 'FOURSTROKE-15HP-EXLPT-PROKICKER', '1A15462BK', 'FourStroke', '15 EXLPT ProKicker FourStroke', 5456, 5456 * 1.4, 15, 'Outboard', 2025, true, 'FourStroke', 'EXLPT', false, now(), now()),
('1A15451BK', 'FOURSTROKE-15HP-ELHPT-PROKICKER', '1A15451BK', 'FourStroke', '15 ELHPT ProKicker FourStroke', 5462, 5462 * 1.4, 15, 'Outboard', 2025, true, 'FourStroke', 'ELHPT', false, now(), now()),
('1A15461BK', 'FOURSTROKE-15HP-EXLHPT-PROKICKER', '1A15461BK', 'FourStroke', '15 EXLHPT ProKicker FourStroke', 5572, 5572 * 1.4, 15, 'Outboard', 2025, true, 'FourStroke', 'EXLHPT', false, now(), now()),

-- 25HP ProKicker models
('1A25452BK', 'FOURSTROKE-25HP-ELPT-PROKICKER', '1A25452BK', 'FourStroke', '25 ELPT ProKicker FourStroke', 6287, 6287 * 1.4, 25, 'Outboard', 2025, true, 'FourStroke', 'ELPT', false, now(), now()),
('1A25462BK', 'FOURSTROKE-25HP-EXLPT-PROKICKER', '1A25462BK', 'FourStroke', '25 EXLPT ProKicker FourStroke', 6441, 6441 * 1.4, 25, 'Outboard', 2025, true, 'FourStroke', 'EXLPT', false, now(), now())

ON CONFLICT (model_number) DO UPDATE SET
    model_display = EXCLUDED.model_display,
    dealer_price = EXCLUDED.dealer_price,
    msrp = EXCLUDED.msrp,
    horsepower = EXCLUDED.horsepower,
    family = EXCLUDED.family,
    rigging_code = EXCLUDED.rigging_code,
    has_command_thrust = EXCLUDED.has_command_thrust,
    updated_at = now();