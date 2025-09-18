-- Fix motor display names using the comprehensive pricing data
-- This updates each motor's model_display with the correct description from the CSV

-- Create a temporary table with the correct mappings from CSV data
CREATE TEMP TABLE motor_display_corrections (
  model_number text PRIMARY KEY,
  correct_display text NOT NULL
);

-- Insert the correct mappings (from mercury-dealer-prices.csv)
INSERT INTO motor_display_corrections (model_number, correct_display) VALUES
('1F02201KK', '2.5MH FourStroke'),
('1F03201KK', '3.5MH FourStroke'),
('1F03211KK', '3.5MLH FourStroke'),
('1F04201KK', '4MH FourStroke'),
('1F04211KK', '4MLH FourStroke'),
('1FX5201KK', '5MH FourStroke'),
('1F05221KK', '5MXLH FourStroke'),
('1F05216KK', '5MLHA Sail Power FourStroke'),
('1FX6201KK', '6MH FourStroke'),
('1FX6211KK', '6MLH FourStroke'),
('1A08201LK', '8MH FourStroke'),
('1A08211LK', '8MLH FourStroke'),
('1A08301LK', '8EH FourStroke'),
('1A08311LK', '8ELH FourStroke'),
('1A10204LV', '9.9MRC FourStroke'),
('1A10201LK', '9.9MH FourStroke'),
('1A10211LK', '9.9MLH FourStroke'),
('1A10301LK', '9.9EH FourStroke'),
('1A10312LK', '9.9EL FourStroke'),
('1A10311LK', '9.9ELH FourStroke'),
('1A15303LK', '15M FourStroke'),
('1A15312LK', '15ML FourStroke'),
('1A15301CK', '15MH FourStroke'),
('1A15311CK', '15MLH FourStroke'),
('1A15411CK', '15ELPT FourStroke'),
('1A15401CK', '15EH FourStroke'),
('1A15412CK', '15EL FourStroke'),
('1A20303LK', '20M FourStroke'),
('1A20312LK', '20ML FourStroke'),
('1A20301CK', '20MH FourStroke'),
('1A20311CK', '20MLH FourStroke'),
('1A20411CK', '20ELPT FourStroke'),
('1A20401CK', '20EH FourStroke'),
('1A20412LK', '20EL FourStroke'),
('1A25303LK', '25M FourStroke'),
('1A25312LK', '25ML FourStroke'),
('1A25301CK', '25MH FourStroke'),
('1A25311CK', '25MLH FourStroke'),
('1A25411CK', '25ELPT FourStroke'),
('1A25401CK', '25EH FourStroke'),
('1A25412LK', '25EL FourStroke'),
('1A30312LK', '30ML FourStroke'),
('1A30301CK', '30MH FourStroke'),
('1A30311CK', '30MLH FourStroke'),
('1A30411CK', '30ELPT FourStroke'),
('1A30401CK', '30EH FourStroke'),
('1A30412LK', '30EL FourStroke'),
('1A40322FK', '40EXLPT FourStroke'),
('1A40312LK', '40ML FourStroke'),
('1A40301CK', '40MH FourStroke'),
('1A40311CK', '40MLH FourStroke'),
('1A40411CK', '40ELPT FourStroke'),
('1A40401CK', '40EH FourStroke'),
('1A40412LK', '40EL FourStroke'),
('1A50322FK', '50EXLPT FourStroke'),
('1A50412LK', '50EL FourStroke'),
('1A60422FK', '60EXLPT FourStroke'),
('1A60412LK', '60EL FourStroke'),
('1A75422FK', '75EXLPT FourStroke'),
('1A75412LK', '75EL FourStroke'),
('1A90422FK', '90EXLPT FourStroke'),
('1A90412LK', '90EL FourStroke'),
('1B115423FK', '115EXLPT FourStroke'),
('1B115423PK', '115EXLPT ProXS'),
('1B150521FK', '150XL FourStroke'),
('1B150521PK', '150XL ProXS'),
('1B175521FK', '175XL FourStroke'),
('1B175521PK', '175XL ProXS'),
('1B200201LK', '200EXLPT FourStroke'),
('1B200231FK', '200XL FourStroke'),
('1B200231PK', '200XL ProXS'),
('1B200231VK', '200XL Verado'),
('1B225201LK', '225EXLPT FourStroke'),
('1B225231FK', '225XL FourStroke'),
('1B225231PK', '225XL ProXS'),
('1B225231VK', '225XL Verado'),
('1B250231FK', '250XL FourStroke'),
('1B250231PK', '250XL ProXS'),
('1B250231VK', '250XL Verado'),
('1B300231LK', '300EXLPT FourStroke'),
('1B300231FK', '300XL FourStroke'),
('1B300231PK', '300XL ProXS'),
('1B300231VK', '300XL Verado'),
('1B350231LK', '350EXLPT FourStroke'),
('1B350231FK', '350XL FourStroke'),
('1B350231PK', '350XL ProXS'),
('1B350231VK', '350XL Verado'),
('1B400331LK', '400EXLPT FourStroke'),
('1B400331VK', '400XL Verado'),
('1B450331LK', '450EXLPT FourStroke'),
('1B450331VK', '450XL Verado');

-- Update motor_models with correct display names
UPDATE motor_models 
SET 
  model_display = motor_display_corrections.correct_display,
  updated_at = now()
FROM motor_display_corrections 
WHERE motor_models.model_number = motor_display_corrections.model_number
  AND motor_models.is_brochure = true;

-- Log the results
DO $$
DECLARE
  updated_count integer;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % motor display names', updated_count;
END $$;