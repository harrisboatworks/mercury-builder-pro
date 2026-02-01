-- First add unique constraint on part_number
ALTER TABLE public.motor_options ADD CONSTRAINT motor_options_part_number_unique UNIQUE (part_number);