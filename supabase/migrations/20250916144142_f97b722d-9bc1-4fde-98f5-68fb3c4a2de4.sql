-- Update the RPC function to handle horsepower field correctly
CREATE OR REPLACE FUNCTION public.update_brochure_models_bulk(p_rows jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  rec jsonb;
  n_updated integer := 0;
BEGIN
  -- Validate input
  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' THEN
    RAISE EXCEPTION 'p_rows must be a JSON array of objects with model_number';
  END IF;

  -- Process each record
  FOR rec IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
    -- Skip if no model_number
    IF COALESCE(rec->>'model_number','') = '' THEN
      CONTINUE;
    END IF;

    -- Update the record with all fields from toDbRow()
    UPDATE motor_models m
    SET
      -- Core identifiers & flags
      model_key = COALESCE(rec->>'model_key', m.model_key),
      mercury_model_no = COALESCE(rec->>'mercury_model_no', m.mercury_model_no),
      
      -- NOT NULL fields (critical for brochure data)
      model = COALESCE(NULLIF(rec->>'model', ''), m.model),
      motor_type = COALESCE(NULLIF(rec->>'motor_type', ''), m.motor_type),
      
      -- Display & pricing
      model_display = COALESCE(rec->>'model_display', m.model_display),
      dealer_price = COALESCE((rec->>'dealer_price')::numeric, m.dealer_price),
      msrp = COALESCE((rec->>'msrp')::numeric, m.msrp),
      
      -- Handle horsepower field (check both hp and horsepower in JSON)
      horsepower = COALESCE((rec->>'horsepower')::numeric, (rec->>'hp')::numeric, m.horsepower),
      
      -- Metadata
      year = COALESCE((rec->>'year')::integer, m.year),
      updated_at = now()
    WHERE m.is_brochure = true
      AND m.model_number = rec->>'model_number';
    
    -- Count successful updates
    IF FOUND THEN
      n_updated := n_updated + 1;
    END IF;
  END LOOP;
  
  RETURN n_updated;
END;
$function$