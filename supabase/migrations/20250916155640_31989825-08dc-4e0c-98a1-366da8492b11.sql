-- Fix ON CONFLICT error by replacing with existence-checking strategy
-- This approach works reliably with conditional unique indexes

CREATE OR REPLACE FUNCTION public.update_brochure_models_bulk(p_rows jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  rec jsonb;
  n_updated integer := 0;
  existing_id uuid;
BEGIN
  -- Validate input
  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' THEN
    RAISE EXCEPTION 'p_rows must be a JSON array of objects with model_number';
  END IF;

  -- Process each record with existence checking
  FOR rec IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
    -- Skip if no model_number
    IF COALESCE(rec->>'model_number','') = '' THEN
      CONTINUE;
    END IF;

    -- Check if a brochure record with this model_number already exists
    SELECT id INTO existing_id 
    FROM motor_models 
    WHERE model_number = rec->>'model_number' 
      AND is_brochure = true
    LIMIT 1;

    IF existing_id IS NOT NULL THEN
      -- Update existing record
      UPDATE motor_models SET
        model_key = COALESCE(rec->>'model_key', ''),
        mercury_model_no = COALESCE(rec->>'mercury_model_no', ''),
        model = COALESCE(NULLIF(rec->>'model', ''), 'Outboard'),
        model_display = COALESCE(rec->>'model_display', ''),
        dealer_price = COALESCE((rec->>'dealer_price')::numeric, 0),
        msrp = COALESCE((rec->>'msrp')::numeric, 0),
        horsepower = COALESCE((rec->>'horsepower')::numeric, (rec->>'hp')::numeric, 0),
        motor_type = COALESCE(NULLIF(rec->>'motor_type', ''), 'Outboard'),
        year = COALESCE((rec->>'year')::integer, 2025),
        updated_at = now()
      WHERE id = existing_id;
      
      n_updated := n_updated + 1;
    ELSE
      -- Insert new record
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
        updated_at
      ) VALUES (
        rec->>'model_number',
        COALESCE(rec->>'model_key', ''),
        COALESCE(rec->>'mercury_model_no', ''),
        COALESCE(NULLIF(rec->>'model', ''), 'Outboard'),
        COALESCE(rec->>'model_display', ''),
        COALESCE((rec->>'dealer_price')::numeric, 0),
        COALESCE((rec->>'msrp')::numeric, 0),
        COALESCE((rec->>'horsepower')::numeric, (rec->>'hp')::numeric, 0),
        COALESCE(NULLIF(rec->>'motor_type', ''), 'Outboard'),
        COALESCE((rec->>'year')::integer, 2025),
        true,
        now()
      );
      
      n_updated := n_updated + 1;
    END IF;
    
    -- Reset for next iteration
    existing_id := NULL;
  END LOOP;
  
  RETURN n_updated;
END;
$function$;