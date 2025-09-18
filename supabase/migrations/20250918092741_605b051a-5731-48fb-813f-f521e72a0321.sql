-- Clear incorrect display names for Mercury motors not in our official mapping
-- These motors have valid model numbers but incorrect "2.5MH FourStroke" display names
-- Better to have NULL/empty than incorrect information

-- First, identify the model numbers that were correctly updated in our previous migration
CREATE TEMP TABLE correctly_mapped_models AS
SELECT DISTINCT model_number FROM (VALUES
  ('1F02201KK'), ('1F03201KK'), ('1F03211KK'), ('1F04201KK'), ('1F04211KK'),
  ('1FX5201KK'), ('1F05221KK'), ('1F05216KK'), ('1FX6201KK'), ('1FX6211KK'),
  ('1A08201LK'), ('1A08211LK'), ('1A08301LK'), ('1A08311LK'), ('1A10204LV'),
  ('1A10201LK'), ('1A10211LK'), ('1A10301LK'), ('1A10312LK'), ('1A10311LK'),
  ('1A15303LK'), ('1A15312LK'), ('1A15301CK'), ('1A15311CK'), ('1A15411CK'),
  ('1A15401CK'), ('1A15412CK'), ('1A20303LK'), ('1A20312LK'), ('1A20301CK'),
  ('1A20311CK'), ('1A20411CK'), ('1A20401CK'), ('1A20412LK'), ('1A25303LK'),
  ('1A25312LK'), ('1A25301CK'), ('1A25311CK'), ('1A25411CK'), ('1A25401CK'),
  ('1A25412LK'), ('1A30312LK'), ('1A30301CK'), ('1A30311CK'), ('1A30411CK'),
  ('1A30401CK'), ('1A30412LK'), ('1A40322FK'), ('1A40312LK'), ('1A40301CK'),
  ('1A40311CK'), ('1A40411CK'), ('1A40401CK'), ('1A40412LK'), ('1A50322FK'),
  ('1A50412LK'), ('1A60422FK'), ('1A60412LK'), ('1A75422FK'), ('1A75412LK'),
  ('1A90422FK'), ('1A90412LK'), ('1B115423FK'), ('1B115423PK'), ('1B150521FK'),
  ('1B150521PK'), ('1B175521FK'), ('1B175521PK'), ('1B200201LK'), ('1B200231FK'),
  ('1B200231PK'), ('1B200231VK'), ('1B225201LK'), ('1B225231FK'), ('1B225231PK'),
  ('1B225231VK'), ('1B250231FK'), ('1B250231PK'), ('1B250231VK'), ('1B300231LK'),
  ('1B300231FK'), ('1B300231PK'), ('1B300231VK'), ('1B350231LK'), ('1B350231FK'),
  ('1B350231PK'), ('1B350231VK'), ('1B400331LK'), ('1B400331VK'), ('1B450331LK'),
  ('1B450331VK')
) AS t(model_number);

-- Count motors with incorrect display names before cleanup
DO $$
DECLARE
  incorrect_count integer;
BEGIN
  SELECT COUNT(*) INTO incorrect_count
  FROM motor_models 
  WHERE model_display = '2.5MH FourStroke'
    AND is_brochure = true
    AND (model_number LIKE '1F%' OR model_number LIKE '1A%' OR model_number LIKE '1B%')
    AND model_number NOT IN (SELECT model_number FROM correctly_mapped_models);
  
  RAISE NOTICE 'Found % motors with incorrect "2.5MH FourStroke" display names to clear', incorrect_count;
END $$;

-- Clear incorrect display names for unmapped Mercury motors
UPDATE motor_models 
SET 
  model_display = NULL,
  updated_at = now()
WHERE model_display = '2.5MH FourStroke'
  AND is_brochure = true
  AND (model_number LIKE '1F%' OR model_number LIKE '1A%' OR model_number LIKE '1B%')
  AND model_number NOT IN (SELECT model_number FROM correctly_mapped_models);

-- Verify the cleanup results
DO $$
DECLARE
  remaining_incorrect integer;
  correctly_mapped integer;
  cleared_count integer;
BEGIN
  SELECT COUNT(*) INTO remaining_incorrect
  FROM motor_models 
  WHERE model_display = '2.5MH FourStroke'
    AND is_brochure = true;
    
  SELECT COUNT(*) INTO correctly_mapped
  FROM motor_models 
  WHERE model_display IS NOT NULL 
    AND model_display != ''
    AND model_display != '2.5MH FourStroke'
    AND is_brochure = true;
    
  GET DIAGNOSTICS cleared_count = ROW_COUNT;
  
  RAISE NOTICE 'Cleared % incorrect display names', cleared_count;
  RAISE NOTICE 'Remaining motors with "2.5MH FourStroke": %', remaining_incorrect;
  RAISE NOTICE 'Motors with correct unique display names: %', correctly_mapped;
END $$;