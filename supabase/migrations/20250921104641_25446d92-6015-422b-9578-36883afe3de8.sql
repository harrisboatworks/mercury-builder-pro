-- Add remaining missing Mercury ProKicker models from official pricing
-- Excluding 1A10462LK which already exists

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
-- 9.9HP ProKicker Command Thrust models (excluding 1A10462LK which exists)
('1A10452LK', 'FOURSTROKE-9.9HP-ELPT-CT-PROKICKER', '1A10452LK', 'FourStroke', '9.9 ELPT Command Thrust ProKicker EFI FourStroke', 4900, 6860, 9.9, 'Outboard', 2025, true, 'FourStroke', 'ELPT', true, now(), now()),
('1A10451LK', 'FOURSTROKE-9.9HP-ELHPT-CT-PROKICKER', '1A10451LK', 'FourStroke', '9.9 ELHPT Command Thrust ProKicker EFI FourStroke', 5000, 7000, 9.9, 'Outboard', 2025, true, 'FourStroke', 'ELHPT', true, now(), now()),
('1A10461LK', 'FOURSTROKE-9.9HP-EXLHPT-CT-PROKICKER', '1A10461LK', 'FourStroke', '9.9 EXLHPT Command Thrust ProKicker EFI FourStroke', 5093, 7130, 9.9, 'Outboard', 2025, true, 'FourStroke', 'EXLHPT', true, now(), now()),

-- 15HP ProKicker models
('1A15452BK', 'FOURSTROKE-15HP-ELPT-PROKICKER', '1A15452BK', 'FourStroke', '15 ELPT ProKicker FourStroke', 5368, 7515, 15, 'Outboard', 2025, true, 'FourStroke', 'ELPT', false, now(), now()),
('1A15462BK', 'FOURSTROKE-15HP-EXLPT-PROKICKER', '1A15462BK', 'FourStroke', '15 EXLPT ProKicker FourStroke', 5456, 7638, 15, 'Outboard', 2025, true, 'FourStroke', 'EXLPT', false, now(), now()),
('1A15451BK', 'FOURSTROKE-15HP-ELHPT-PROKICKER', '1A15451BK', 'FourStroke', '15 ELHPT ProKicker FourStroke', 5462, 7647, 15, 'Outboard', 2025, true, 'FourStroke', 'ELHPT', false, now(), now()),
('1A15461BK', 'FOURSTROKE-15HP-EXLHPT-PROKICKER', '1A15461BK', 'FourStroke', '15 EXLHPT ProKicker FourStroke', 5572, 7801, 15, 'Outboard', 2025, true, 'FourStroke', 'EXLHPT', false, now(), now()),

-- 25HP ProKicker models
('1A25452BK', 'FOURSTROKE-25HP-ELPT-PROKICKER', '1A25452BK', 'FourStroke', '25 ELPT ProKicker FourStroke', 6287, 8802, 25, 'Outboard', 2025, true, 'FourStroke', 'ELPT', false, now(), now()),
('1A25462BK', 'FOURSTROKE-25HP-EXLPT-PROKICKER', '1A25462BK', 'FourStroke', '25 EXLPT ProKicker FourStroke', 6441, 9017, 25, 'Outboard', 2025, true, 'FourStroke', 'EXLPT', false, now(), now());