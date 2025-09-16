-- Fix the duplicate key error by dropping the actual INDEX (not constraint) and updating RPC function
-- The uq_brochure_identity is actually a unique INDEX, not a constraint

-- Drop the conflicting unique index that's causing the duplicate key violations
DROP INDEX IF EXISTS uq_brochure_identity;

-- Update the RPC function to handle conflicts more robustly
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

  -- Process each record with robust UPSERT using ON CONFLICT
  FOR rec IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
    -- Skip if no model_number
    IF COALESCE(rec->>'model_number','') = '' THEN
      CONTINUE;
    END IF;

    -- UPSERT with comprehensive conflict resolution
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
    )
    ON CONFLICT (model_number) 
    DO UPDATE SET
      model_key = EXCLUDED.model_key,
      mercury_model_no = EXCLUDED.mercury_model_no,
      model = EXCLUDED.model,
      model_display = EXCLUDED.model_display,
      dealer_price = EXCLUDED.dealer_price,
      msrp = EXCLUDED.msrp,
      horsepower = EXCLUDED.horsepower,
      motor_type = EXCLUDED.motor_type,
      year = EXCLUDED.year,
      updated_at = now()
    WHERE motor_models.is_brochure = true;
    
    -- Count successful operations
    IF FOUND THEN
      n_updated := n_updated + 1;
    END IF;
  END LOOP;
  
  RETURN n_updated;
END;
$function$;