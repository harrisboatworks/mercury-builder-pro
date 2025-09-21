-- Comprehensive Mercury Motor Catalog Correction Migration
-- This migration cleans up all incorrect model data and imports the official Mercury catalog

-- Step 1: Clean up all auto-generated and incorrect model numbers
-- Remove models with auto-generated patterns that don't match official Mercury format
DELETE FROM motor_models 
WHERE model_number ~ '^[0-9.]+[A-Z]+-[A-Z]+-202[0-9].*'
   OR model_number ~ '^[0-9.]+HP-[A-Z]+-202[0-9].*'
   OR model_number ~ '^Mercury-[0-9.]+HP.*'
   OR model_number IS NULL
   OR model_number = '';

-- Step 2: Remove duplicate brochure models that don't have official Mercury model numbers
-- Keep only models that exist in the official pricing CSV
DELETE FROM motor_models 
WHERE is_brochure = true 
  AND model_number NOT IN (
    '1F02201KK','1F03201KK','1F03211KK','1F04201KK','1F04211KK','1FX5201KK','1F05221KK',
    '1F05216KK','1FX6201KK','1FX6211KK','1A08201LK','1A08211LK','1A08301LK','1A08311LK',
    '1A10204LV','1A10201LK','1A10211LK','1A10301LK','1A10312LK','1A10311LK','1A10402LK',
    '1A10251LK','1A10261LK','1A10351LK','1A10361LK','1A10452LK','1A10462LK','1A10451LK',
    '1A10461LK','1A15204LK','1A15201LK','1A15211LK','1A15302LK','1A15312LK','1A15301LK',
    '1A15311LK','1A15402LK','1A15401LK','1A15412LK','1A15452BK','1A15462BK','1A15451BK',
    '1A15461BK','1A20204LK','1A20201LK','1A20211LK','1A20301LK','1A20302LK','1A20311LK',
    '1A20312LK','1A20402LK','1A20411LK','1A20412LK','1A25203BK','1A25213BK','1A25301BK',
    '1A25311BK','1A25312BK','1A25403BK','1A25411BK','1A25413BK','1A25452BK','1A25462BK',
    '1A3G203BK','1A3G213BK','1A3G313BK','1A3G311BK','1A30403BK','1A30413BK','1A30411BK',
    '1F40403GZ','1F40413GZ','1F4041TJZ','1F41453GZ','1F51413GZ','1F5141TJZ','1F51453GZ',
    '1F5145TJZ','1F60413GZ','1F6041TJZ','1F60453GZ','1F60463GZ','1F6045TJZ','1F754132D',
    '1F904132D','1F904232D','1F904532D','1F904632D','1115F132D','1115F232D','1115F532D',
    '1115F632D','1115F642D','1150F13ED','1150F23ED','1150F24ED','11750005A','11750006A',
    '11750007A','12000001A','12000009A','12000029A','12000005A','12000013A','12000017A',
    '12250001A','12250009A','12250047A','12250021A','12250005A','12250013A','12250017A',
    '12250025A','12250029A','12500001A','12500009A','12500083A','12500021A','12500087A',
    '12500005A','12500013A','12500017A','12500025A','12500029A','13000002A','13000010A',
    '13000111A','13000006A','13000014A','13000018A','1117F131D','1117F231D','1117F531D',
    '1117F631D','1152F131D','1152F231D','11750001A','11750002A','12000027A','12000039A',
    '12000041A','12000035A','12000040A','12250033A','12250034A','12250053A','12250055A',
    '12500033A','12500034A','12500094A','12500096A','13000022A','13000023A','13000177A',
    '13000179A','13000181A'
  );

-- Step 3: Create a function to extract HP from model description
CREATE OR REPLACE FUNCTION extract_hp_from_description(description TEXT)
RETURNS NUMERIC AS $$
BEGIN
  -- Extract HP from descriptions like "25ELPT FourStroke" or "9.9MH FourStroke"
  RETURN (regexp_match(description, '^([0-9]+(?:\.[0-9]+)?)'))[1]::NUMERIC;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 4: Create a function to determine motor family from description
CREATE OR REPLACE FUNCTION get_motor_family(description TEXT)
RETURNS TEXT AS $$
BEGIN
  IF description ILIKE '%Pro XS%' THEN
    RETURN 'Pro XS';
  ELSIF description ILIKE '%SeaPro%' THEN
    RETURN 'SeaPro';
  ELSIF description ILIKE '%Verado%' THEN
    RETURN 'Verado';
  ELSIF description ILIKE '%Racing%' THEN
    RETURN 'Racing';
  ELSE
    RETURN 'FourStroke';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 5: Create a function to build proper model keys
CREATE OR REPLACE FUNCTION build_official_model_key(model_number TEXT, description TEXT)
RETURNS TEXT AS $$
DECLARE
  hp NUMERIC;
  family TEXT;
  key_parts TEXT[];
BEGIN
  hp := extract_hp_from_description(description);
  family := get_motor_family(description);
  
  key_parts := ARRAY[
    UPPER(family),
    CASE WHEN hp IS NOT NULL THEN hp::TEXT || 'HP' ELSE 'UNKNOWN' END,
    'EFI'
  ];
  
  -- Add special designations
  IF description ILIKE '%Command Thrust%' THEN
    key_parts := key_parts || 'CT';
  END IF;
  
  IF description ILIKE '%ProKicker%' THEN
    key_parts := key_parts || 'PK';
  END IF;
  
  IF description ILIKE '%Tiller%' THEN
    key_parts := key_parts || 'TILLER';
  END IF;
  
  IF description ILIKE '%DTS%' THEN
    key_parts := key_parts || 'DTS';
  END IF;
  
  -- Add rigging code from description
  IF description ~ '(ELPT|ELHPT|EXLPT|EXLHPT|ECXLPT|EPT|ELH|EH|MLH|MXLH|MH|EL|XL|XXL|CXXL|CXL)' THEN
    key_parts := key_parts || (regexp_match(description, '(ELPT|ELHPT|EXLPT|EXLHPT|ECXLPT|EPT|ELH|EH|MLH|MXLH|MH|EL|XL|XXL|CXXL|CXL)'))[1];
  END IF;
  
  RETURN array_to_string(key_parts, '-');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 6: Insert or update all official Mercury models from the pricing CSV
-- This ensures we have every single official model with correct data
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
  make,
  family,
  created_at,
  updated_at
) VALUES 
  ('1F02201KK', build_official_model_key('1F02201KK', '2.5MH FourStroke'), '1F02201KK', 'Outboard', '2.5 MH FourStroke', 1270, 1815, 2.5, 'Outboard', 2025, true, 'Mercury', 'FourStroke', now(), now()),
  ('1F03201KK', build_official_model_key('1F03201KK', '3.5MH FourStroke'), '1F03201KK', 'Outboard', '3.5 MH FourStroke', 1524, 2178, 3.5, 'Outboard', 2025, true, 'Mercury', 'FourStroke', now(), now()),
  ('1F03211KK', build_official_model_key('1F03211KK', '3.5MLH FourStroke'), '1F03211KK', 'Outboard', '3.5 MLH FourStroke', 1557, 2226, 3.5, 'Outboard', 2025, true, 'Mercury', 'FourStroke', now(), now()),
  ('1F04201KK', build_official_model_key('1F04201KK', '4MH FourStroke'), '1F04201KK', 'Outboard', '4 MH FourStroke', 1815, 2595, 4, 'Outboard', 2025, true, 'Mercury', 'FourStroke', now(), now()),
  ('1F04211KK', build_official_model_key('1F04211KK', '4MLH FourStroke'), '1F04211KK', 'Outboard', '4 MLH FourStroke', 1854, 2651, 4, 'Outboard', 2025, true, 'Mercury', 'FourStroke', now(), now()),
  ('1FX5201KK', build_official_model_key('1FX5201KK', '5MH FourStroke'), '1FX5201KK', 'Outboard', '5 MH FourStroke', 2019, 2885, 5, 'Outboard', 2025, true, 'Mercury', 'FourStroke', now(), now()),
  ('1F05221KK', build_official_model_key('1F05221KK', '5MXLH FourStroke'), '1F05221KK', 'Outboard', '5 MXLH FourStroke', 2090, 2987, 5, 'Outboard', 2025, true, 'Mercury', 'FourStroke', now(), now()),
  ('1F05216KK', build_official_model_key('1F05216KK', '5MLHA Sail Power FourStroke'), '1F05216KK', 'Outboard', '5 MLHA Sail Power FourStroke', 2057, 2939, 5, 'Outboard', 2025, true, 'Mercury', 'FourStroke', now(), now()),
  ('1FX6201KK', build_official_model_key('1FX6201KK', '6MH FourStroke'), '1FX6201KK', 'Outboard', '6 MH FourStroke', 2084, 2978, 6, 'Outboard', 2025, true, 'Mercury', 'FourStroke', now(), now()),
  ('1FX6211KK', build_official_model_key('1FX6211KK', '6MLH FourStroke'), '1FX6211KK', 'Outboard', '6 MLH FourStroke', 2118, 3026, 6, 'Outboard', 2025, true, 'Mercury', 'FourStroke', now(), now()),
  ('1A08201LK', build_official_model_key('1A08201LK', '8MH FourStroke'), '1A08201LK', 'Outboard', '8 MH FourStroke', 3036, 4340, 8, 'Outboard', 2025, true, 'Mercury', 'FourStroke', now(), now()),
  ('1A08211LK', build_official_model_key('1A08211LK', '8MLH FourStroke'), '1A08211LK', 'Outboard', '8 MLH FourStroke', 3075, 4395, 8, 'Outboard', 2025, true, 'Mercury', 'FourStroke', now(), now()),
  ('1A08301LK', build_official_model_key('1A08301LK', '8EH FourStroke'), '1A08301LK', 'Outboard', '8 EH FourStroke', 3344, 4779, 8, 'Outboard', 2025, true, 'Mercury', 'FourStroke', now(), now()),
  ('1A08311LK', build_official_model_key('1A08311LK', '8ELH FourStroke'), '1A08311LK', 'Outboard', '8 ELH FourStroke', 3383, 4835, 8, 'Outboard', 2025, true, 'Mercury', 'FourStroke', now(), now()),
  ('1A10204LV', build_official_model_key('1A10204LV', '9.9MRC FourStroke'), '1A10204LV', 'Outboard', '9.9 MRC FourStroke', 3548, 5069, 9.9, 'Outboard', 2025, true, 'Mercury', 'FourStroke', now(), now()),
  ('1A10201LK', build_official_model_key('1A10201LK', '9.9MH FourStroke'), '1A10201LK', 'Outboard', '9.9 MH FourStroke', 3553, 5076, 9.9, 'Outboard', 2025, true, 'Mercury', 'FourStroke', now(), now()),
  ('1A10211LK', build_official_model_key('1A10211LK', '9.9MLH FourStroke'), '1A10211LK', 'Outboard', '9.9 MLH FourStroke', 3597, 5139, 9.9, 'Outboard', 2025, true, 'Mercury', 'FourStroke', now(), now()),
  ('1A10301LK', build_official_model_key('1A10301LK', '9.9EH FourStroke'), '1A10301LK', 'Outboard', '9.9 EH FourStroke', 3878, 5540, 9.9, 'Outboard', 2025, true, 'Mercury', 'FourStroke', now(), now()),
  ('1A10312LK', build_official_model_key('1A10312LK', '9.9EL FourStroke'), '1A10312LK', 'Outboard', '9.9 EL FourStroke', 3966, 5666, 9.9, 'Outboard', 2025, true, 'Mercury', 'FourStroke', now(), now()),
  ('1A10311LK', build_official_model_key('1A10311LK', '9.9ELH FourStroke'), '1A10311LK', 'Outboard', '9.9 ELH FourStroke', 4065, 5808, 9.9, 'Outboard', 2025, true, 'Mercury', 'FourStroke', now(), now()),
  ('1A10402LK', build_official_model_key('1A10402LK', '9.9EPT FourStroke'), '1A10402LK', 'Outboard', '9.9 EPT FourStroke', 4494, 6421, 9.9, 'Outboard', 2025, true, 'Mercury', 'FourStroke', now(), now()),
  ('1A10251LK', build_official_model_key('1A10251LK', '9.9MLH Command Thrust FourStroke'), '1A10251LK', 'Outboard', '9.9 MLH Command Thrust FourStroke', 3894, 5563, 9.9, 'Outboard', 2025, true, 'Mercury', 'FourStroke', now(), now()),
  ('1A10261LK', build_official_model_key('1A10261LK', '9.9MXLH Command Thrust FourStroke'), '1A10261LK', 'Outboard', '9.9 MXLH Command Thrust FourStroke', 4010, 5729, 9.9, 'Outboard', 2025, true, 'Mercury', 'FourStroke', now(), now()),
  ('1A10351LK', build_official_model_key('1A10351LK', '9.9ELH Command Thrust FourStroke'), '1A10351LK', 'Outboard', '9.9 ELH Command Thrust FourStroke', 4389, 6271, 9.9, 'Outboard', 2025, true, 'Mercury', 'FourStroke', now(), now()),
  ('1A10361LK', build_official_model_key('1A10361LK', '9.9EXLH Command Thrust FourStroke'), '1A10361LK', 'Outboard', '9.9 EXLH Command Thrust FourStroke', 4466, 6382, 9.9, 'Outboard', 2025, true, 'Mercury', 'FourStroke', now(), now()),
  ('1A10452LK', build_official_model_key('1A10452LK', '9.9ELPT Command Thrust ProKicker EFI FourStroke'), '1A10452LK', 'Outboard', '9.9 ELPT Command Thrust ProKicker EFI FourStroke', 4900, 7002, 9.9, 'Outboard', 2025, true, 'Mercury', 'FourStroke', now(), now()),
  ('1A10462LK', build_official_model_key('1A10462LK', '9.9EXLPT Command Thrust ProKicker EFI FourStroke'), '1A10462LK', 'Outboard', '9.9 EXLPT Command Thrust ProKicker EFI FourStroke', 4983, 7121, 9.9, 'Outboard', 2025, true, 'Mercury', 'FourStroke', now(), now()),
  ('1A10451LK', build_official_model_key('1A10451LK', '9.9ELHPT Command Thrust ProKicker EFI FourStroke'), '1A10451LK', 'Outboard', '9.9 ELHPT Command Thrust ProKicker EFI FourStroke', 5000, 7145, 9.9, 'Outboard', 2025, true, 'Mercury', 'FourStroke', now(), now()),
  ('1A10461LK', build_official_model_key('1A10461LK', '9.9EXLHPT Command Thrust ProKicker EFI FourStroke'), '1A10461LK', 'Outboard', '9.9 EXLHPT Command Thrust ProKicker EFI FourStroke', 5093, 7278, 9.9, 'Outboard', 2025, true, 'Mercury', 'FourStroke', now(), now())

-- Continue with remaining models in next part due to query length limits
ON CONFLICT (model_number) DO UPDATE SET
  model_key = EXCLUDED.model_key,
  model_display = EXCLUDED.model_display,
  dealer_price = EXCLUDED.dealer_price,
  msrp = EXCLUDED.msrp,
  horsepower = EXCLUDED.horsepower,
  is_brochure = true,
  make = 'Mercury',
  family = EXCLUDED.family,
  updated_at = now();