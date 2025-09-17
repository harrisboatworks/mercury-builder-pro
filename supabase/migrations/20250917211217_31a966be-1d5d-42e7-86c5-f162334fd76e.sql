-- Add more comprehensive pattern matching for remaining auto-generated model numbers
CREATE OR REPLACE FUNCTION public.fix_auto_generated_model_numbers_comprehensive()
RETURNS TABLE(updated_count integer, details jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  rec RECORD;
  updated_count integer := 0;
  update_details jsonb := '[]'::jsonb;
  base_model_number text;
  final_model_number text;
  suffix_counter integer;
  existing_count integer;
BEGIN
  -- Process records with auto-generated model numbers (all patterns)
  FOR rec IN 
    SELECT id, model_number, model_display, horsepower, model, is_brochure
    FROM motor_models 
    WHERE model_number ~ '^[0-9.]+[A-Z]+-[A-Z]+-202[0-9].*'
    ORDER BY horsepower, model_display, is_brochure DESC
  LOOP
    base_model_number := NULL;
    
    -- Comprehensive mapping of HP and rigging patterns to Mercury model numbers
    IF rec.horsepower = 3.5 AND rec.model_display LIKE '%MH%' THEN
      base_model_number := '1C03501MK';
    ELSIF rec.horsepower = 4 AND rec.model_display LIKE '%MH%' THEN
      base_model_number := '1C04001MK';
    ELSIF rec.horsepower = 5 AND rec.model_display LIKE '%MH%' THEN
      base_model_number := '1C05001MK';
    ELSIF rec.horsepower = 6 AND rec.model_display LIKE '%MH%' THEN
      base_model_number := '1C06001MK';
    ELSIF rec.horsepower = 8 AND rec.model_display LIKE '%ELH%' THEN
      base_model_number := '1C08201LK';
    ELSIF rec.horsepower = 9.9 AND rec.model_display LIKE '%ELH%' THEN
      base_model_number := '1C10201LK';
    ELSIF rec.horsepower = 15 AND rec.model_display LIKE '%ELH%' THEN
      base_model_number := '1A15301CK';
    ELSIF rec.horsepower = 20 AND rec.model_display LIKE '%ELH%' THEN
      base_model_number := '1A20301CK';
    ELSIF rec.horsepower = 25 AND rec.model_display LIKE '%ELH%' THEN
      base_model_number := '1A25312LK';
    ELSIF rec.horsepower = 30 AND (rec.model_display LIKE '%ELPT%' OR rec.model_display LIKE '%ELH%') THEN
      base_model_number := '1A30312LK';
    ELSIF rec.horsepower = 40 AND (rec.model_display LIKE '%ELPT%' OR rec.model_display LIKE '%EXLPT%') THEN
      base_model_number := '1A40322LK';
    ELSIF rec.horsepower = 50 AND (rec.model_display LIKE '%ELPT%' OR rec.model_display LIKE '%EXLPT%') THEN
      base_model_number := '1A50322LK';
    ELSIF rec.horsepower = 60 AND (rec.model_display LIKE '%EXLPT%' OR rec.model_display LIKE '%ELPT%') THEN
      base_model_number := '1A60422FK';
    ELSIF rec.horsepower = 75 AND rec.model_display LIKE '%EXLPT%' THEN
      base_model_number := '1A75422FK';
    ELSIF rec.horsepower = 90 AND rec.model_display LIKE '%EXLPT%' THEN
      base_model_number := '1A90422FK';
    ELSIF rec.horsepower = 115 AND rec.model_display LIKE '%EXLPT%' AND rec.model_display LIKE '%FourStroke%' THEN
      base_model_number := '1B115423FK';
    ELSIF rec.horsepower = 115 AND rec.model_display LIKE '%EXLPT%' AND rec.model_display LIKE '%ProXS%' THEN
      base_model_number := '1B115423PK';
    ELSIF rec.horsepower = 150 AND rec.model_display LIKE '%EXLPT%' AND rec.model_display LIKE '%FourStroke%' THEN
      base_model_number := '1B150521FK';
    ELSIF rec.horsepower = 150 AND rec.model_display LIKE '%EXLPT%' AND rec.model_display LIKE '%ProXS%' THEN
      base_model_number := '1B150521PK';
    ELSIF rec.horsepower = 175 AND rec.model_display LIKE '%XL%' THEN
      base_model_number := '1B175521FK';
    ELSIF rec.horsepower = 200 AND rec.model_display LIKE '%EXLPT%' THEN
      base_model_number := '1B200201LK';
    ELSIF rec.horsepower = 225 AND rec.model_display LIKE '%EXLPT%' THEN
      base_model_number := '1B225201LK';
    ELSIF rec.horsepower = 250 AND rec.model_display LIKE '%XL%' THEN
      base_model_number := '1B250231FK';
    ELSIF rec.horsepower = 300 AND rec.model_display LIKE '%EXLPT%' THEN
      base_model_number := '1B300231LK';
    ELSIF rec.horsepower = 350 AND rec.model_display LIKE '%EXLPT%' THEN
      base_model_number := '1B350231LK';
    ELSIF rec.horsepower = 400 AND rec.model_display LIKE '%EXLPT%' THEN
      base_model_number := '1B400331LK';
    ELSIF rec.horsepower = 450 AND rec.model_display LIKE '%EXLPT%' THEN
      base_model_number := '1B450331LK';
    END IF;
    
    -- Only proceed if we have a base model number
    IF base_model_number IS NOT NULL THEN
      final_model_number := base_model_number;
      suffix_counter := 0;
      
      -- Check if the base model number already exists
      SELECT COUNT(*) INTO existing_count
      FROM motor_models 
      WHERE model_number = final_model_number 
        AND id != rec.id;
      
      -- If it exists, try with suffixes until we find a unique one
      WHILE existing_count > 0 AND suffix_counter < 20 LOOP
        suffix_counter := suffix_counter + 1;
        
        -- For brochure records, prefer base number; for inventory, add suffix
        IF rec.is_brochure = true AND suffix_counter = 1 THEN
          final_model_number := base_model_number;
        ELSE
          final_model_number := base_model_number || '-' || suffix_counter;
        END IF;
        
        SELECT COUNT(*) INTO existing_count
        FROM motor_models 
        WHERE model_number = final_model_number 
          AND id != rec.id;
      END LOOP;
      
      -- Update if we found a unique model number
      IF final_model_number IS NOT NULL AND existing_count = 0 THEN
        UPDATE motor_models 
        SET model_number = final_model_number,
            updated_at = now()
        WHERE id = rec.id;
        
        updated_count := updated_count + 1;
        
        -- Add to details log (limit to first 10 for readability)
        IF updated_count <= 10 THEN
          update_details := update_details || jsonb_build_object(
            'id', rec.id,
            'old_model_number', rec.model_number,
            'new_model_number', final_model_number,
            'model_display', rec.model_display,
            'horsepower', rec.horsepower,
            'is_brochure', rec.is_brochure
          );
        END IF;
        
        RAISE NOTICE 'Updated %: % -> % (% HP %, brochure: %)', 
          rec.id, rec.model_number, final_model_number, rec.horsepower, rec.model_display, rec.is_brochure;
      ELSE
        RAISE NOTICE 'Skipped % - could not find unique model number (% HP %)', 
          rec.id, rec.horsepower, rec.model_display;
      END IF;
    ELSE
      -- Log unmapped patterns for analysis
      RAISE NOTICE 'No mapping for % HP % (pattern: %)', 
        rec.horsepower, rec.model_display, SUBSTRING(rec.model_number, '^[0-9.]+[A-Z]+');
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT updated_count, update_details;
END;
$function$;

-- Execute the comprehensive function
SELECT * FROM public.fix_auto_generated_model_numbers_comprehensive();