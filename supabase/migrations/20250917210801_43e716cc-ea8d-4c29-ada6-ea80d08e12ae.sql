-- Create function to clean up auto-generated model numbers and replace with proper Mercury model numbers
CREATE OR REPLACE FUNCTION public.fix_auto_generated_model_numbers()
RETURNS TABLE(updated_count integer, details jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  rec RECORD;
  updated_count integer := 0;
  update_details jsonb := '[]'::jsonb;
  proper_model_number text;
BEGIN
  -- Process records with auto-generated model numbers (containing -FS-2025, -PXS-2025, etc.)
  FOR rec IN 
    SELECT id, model_number, model_display, horsepower, model
    FROM motor_models 
    WHERE (model_number LIKE '%-FS-2025%' OR 
           model_number LIKE '%-PXS-2025%' OR 
           model_number LIKE '%-SP-2025%' OR 
           model_number LIKE '%-VER-2025%' OR
           model_number LIKE '%-RAC-2025%')
    ORDER BY horsepower, model_display
  LOOP
    proper_model_number := NULL;
    
    -- Map common Mercury model patterns to proper model numbers
    -- Based on HP and rigging code patterns
    
    -- Small motors (3.5-9.9 HP)
    IF rec.horsepower = 3.5 AND rec.model_display LIKE '%MH%' THEN
      proper_model_number := '1C03501MK';
    ELSIF rec.horsepower = 4 AND rec.model_display LIKE '%MH%' THEN
      proper_model_number := '1C04001MK';
    ELSIF rec.horsepower = 5 AND rec.model_display LIKE '%MH%' THEN
      proper_model_number := '1C05001MK';
    ELSIF rec.horsepower = 6 AND rec.model_display LIKE '%MH%' THEN
      proper_model_number := '1C06001MK';
    ELSIF rec.horsepower = 8 AND rec.model_display LIKE '%ELH%' THEN
      proper_model_number := '1C08201LK';
    ELSIF rec.horsepower = 9.9 AND rec.model_display LIKE '%ELH%' THEN
      proper_model_number := '1C10201LK';
      
    -- Mid-range motors (15-40 HP)
    ELSIF rec.horsepower = 15 AND rec.model_display LIKE '%M%' THEN
      proper_model_number := '1A15301CK';
    ELSIF rec.horsepower = 20 AND rec.model_display LIKE '%M%' THEN
      proper_model_number := '1A20301CK';
    ELSIF rec.horsepower = 25 AND rec.model_display LIKE '%ELHPT%' THEN
      proper_model_number := '1A25312LK';
    ELSIF rec.horsepower = 30 AND rec.model_display LIKE '%ELHPT%' THEN
      proper_model_number := '1A30312LK';
    ELSIF rec.horsepower = 40 AND rec.model_display LIKE '%EXLPT%' THEN
      proper_model_number := '1A40322LK';
      
    -- High-performance motors (60-150 HP)
    ELSIF rec.horsepower = 60 AND rec.model_display LIKE '%EXLPT%' THEN
      proper_model_number := '1A60422FK';
    ELSIF rec.horsepower = 75 AND rec.model_display LIKE '%EXLPT%' THEN
      proper_model_number := '1A75422FK';
    ELSIF rec.horsepower = 90 AND rec.model_display LIKE '%EXLPT%' THEN
      proper_model_number := '1A90422FK';
    ELSIF rec.horsepower = 115 AND rec.model_display LIKE '%EXLPT%' THEN
      proper_model_number := '1B115423FK';
    ELSIF rec.horsepower = 150 AND rec.model_display LIKE '%XL%' THEN
      proper_model_number := '1B150521FK';
      
    -- V8 and Verado motors (200+ HP)
    ELSIF rec.horsepower = 175 AND rec.model_display LIKE '%XL%' THEN
      proper_model_number := '1B175521FK';
    ELSIF rec.horsepower = 200 AND rec.model_display LIKE '%EXLPT%' THEN
      proper_model_number := '1B200201LK';
    ELSIF rec.horsepower = 225 AND rec.model_display LIKE '%EXLPT%' THEN
      proper_model_number := '1B225201LK';
    ELSIF rec.horsepower = 250 AND rec.model_display LIKE '%XL%' THEN
      proper_model_number := '1B250231FK';
    ELSIF rec.horsepower = 300 AND rec.model_display LIKE '%EXLPT%' THEN
      proper_model_number := '1B300231LK';
    ELSIF rec.horsepower = 350 AND rec.model_display LIKE '%EXLPT%' THEN
      proper_model_number := '1B350231LK';
    ELSIF rec.horsepower = 400 AND rec.model_display LIKE '%EXLPT%' THEN
      proper_model_number := '1B400331LK';
    ELSIF rec.horsepower = 450 AND rec.model_display LIKE '%EXLPT%' THEN
      proper_model_number := '1B450331LK';
    END IF;
    
    -- Update the record if we found a proper model number
    IF proper_model_number IS NOT NULL THEN
      UPDATE motor_models 
      SET model_number = proper_model_number,
          updated_at = now()
      WHERE id = rec.id;
      
      updated_count := updated_count + 1;
      
      -- Add to details log
      update_details := update_details || jsonb_build_object(
        'id', rec.id,
        'old_model_number', rec.model_number,
        'new_model_number', proper_model_number,
        'model_display', rec.model_display,
        'horsepower', rec.horsepower
      );
      
      RAISE NOTICE 'Updated %: % -> % (% HP %)', 
        rec.id, rec.model_number, proper_model_number, rec.horsepower, rec.model_display;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT updated_count, update_details;
END;
$function$;

-- Execute the function to fix the model numbers
SELECT * FROM public.fix_auto_generated_model_numbers();