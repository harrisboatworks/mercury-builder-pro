-- Update motor cover part numbers to real Mercury part numbers
UPDATE public.motor_options 
SET part_number = '8M0104228' 
WHERE name = 'Vented Splash Cover (75-115HP)';

UPDATE public.motor_options 
SET part_number = '8M0104229' 
WHERE name = 'Vented Splash Cover (150HP)';

UPDATE public.motor_options 
SET part_number = '8M0104231' 
WHERE name = 'Vented Splash Cover (175-225HP V6)';

UPDATE public.motor_options 
SET part_number = '8M0104232' 
WHERE name = 'Vented Splash Cover (250-300HP V8)';