-- Fix the RPC function with comprehensive error handling and logging
-- This should help us see exactly what's happening during the insert/update process

DROP FUNCTION IF EXISTS public.update_brochure_models_bulk(jsonb);

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
  existing_model_key_id uuid;
  current_model_key text;
  rows_affected integer;
  insert_id uuid;
BEGIN
  -- Log function start
  RAISE NOTICE '[RPC] Starting update_brochure_models_bulk with % records', jsonb_array_length(p_rows);
  
  -- Validate input
  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' THEN
    RAISE EXCEPTION 'p_rows must be a JSON array of objects with model_number';
  END IF;

  -- Process each record with existence checking
  FOR rec IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
    -- Log each record being processed
    RAISE NOTICE '[RPC] Processing model_number: %, model_display: %', 
      COALESCE(rec->>'model_number', 'NULL'), 
      COALESCE(rec->>'model_display', 'NULL');
    
    -- Skip if no model_number
    IF COALESCE(rec->>'model_number','') = '' THEN
      RAISE NOTICE '[RPC] Skipping record - no model_number';
      CONTINUE;
    END IF;

    current_model_key := COALESCE(rec->>'model_key', '');
    
    -- Skip if no model_key (avoid empty string conflicts)
    IF current_model_key = '' THEN
      RAISE NOTICE '[RPC] Skipping record - no model_key for model_number: %', rec->>'model_number';
      CONTINUE;
    END IF;

    -- Reset variables
    existing_id := NULL;
    existing_model_key_id := NULL;

    -- Check if a brochure record with this model_number already exists
    SELECT id INTO existing_id 
    FROM motor_models 
    WHERE model_number = rec->>'model_number' 
      AND is_brochure = true
    LIMIT 1;

    RAISE NOTICE '[RPC] Existing record check for model_number %, found ID: %', 
      rec->>'model_number', COALESCE(existing_id::text, 'NULL');

    -- Check if any record (brochure or inventory) with this model_key exists
    SELECT id INTO existing_model_key_id
    FROM motor_models 
    WHERE model_key = current_model_key
      AND (existing_id IS NULL OR id != existing_id) -- Exclude the record we might be updating
    LIMIT 1;

    -- If model_key already exists in a different record, skip this record to avoid conflict
    IF existing_model_key_id IS NOT NULL THEN
      RAISE NOTICE '[RPC] Skipping record with duplicate model_key: % (conflicts with existing record %)', 
        current_model_key, existing_model_key_id;
      CONTINUE;
    END IF;

    -- Validate required fields before proceeding
    IF COALESCE(NULLIF(rec->>'model', ''), 'Outboard') = '' THEN
      RAISE EXCEPTION '[RPC] Invalid model field for record %: cannot be empty', rec->>'model_number';
    END IF;
    
    IF COALESCE(NULLIF(rec->>'motor_type', ''), 'Outboard') = '' THEN
      RAISE EXCEPTION '[RPC] Invalid motor_type field for record %: cannot be empty', rec->>'model_number';
    END IF;

    BEGIN
      IF existing_id IS NOT NULL THEN
        -- Update existing brochure record
        RAISE NOTICE '[RPC] Updating existing record ID: % for model_number: %', existing_id, rec->>'model_number';
        
        UPDATE motor_models SET
          model_key = current_model_key,
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
        
        GET DIAGNOSTICS rows_affected = ROW_COUNT;
        RAISE NOTICE '[RPC] Update completed, rows affected: %', rows_affected;
        
        IF rows_affected > 0 THEN
          n_updated := n_updated + 1;
        ELSE
          RAISE NOTICE '[RPC] WARNING: Update returned 0 rows affected for ID %', existing_id;
        END IF;
      ELSE
        -- Insert new brochure record
        RAISE NOTICE '[RPC] Inserting new record for model_number: %', rec->>'model_number';
        
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
          current_model_key,
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
        ) RETURNING id INTO insert_id;
        
        GET DIAGNOSTICS rows_affected = ROW_COUNT;
        RAISE NOTICE '[RPC] Insert completed, rows affected: %, new ID: %', rows_affected, insert_id;
        
        IF rows_affected > 0 THEN
          n_updated := n_updated + 1;
        ELSE
          RAISE EXCEPTION '[RPC] CRITICAL: Insert returned 0 rows affected for model_number %', rec->>'model_number';
        END IF;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION '[RPC] Failed to process record %: % (SQLSTATE: %)', 
        rec->>'model_number', SQLERRM, SQLSTATE;
    END;
  END LOOP;
  
  RAISE NOTICE '[RPC] Function completed successfully. Total records processed: %', n_updated;
  RETURN n_updated;
END;
$function$;

-- Create a simple test function to insert just one record
CREATE OR REPLACE FUNCTION public.test_single_motor_insert(
  p_model_number text,
  p_model_display text,
  p_dealer_price numeric
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_id uuid;
  test_model_key text;
BEGIN
  -- Generate a simple model key for testing
  test_model_key := 'TEST_' || p_model_number;
  
  RAISE NOTICE '[TEST] Inserting test record: %, %, %', p_model_number, p_model_display, p_dealer_price;
  
  INSERT INTO motor_models (
    model_number,
    model_key,
    model,
    model_display,
    dealer_price,
    msrp,
    horsepower,
    motor_type,
    year,
    is_brochure,
    created_at,
    updated_at
  ) VALUES (
    p_model_number,
    test_model_key,
    'Outboard',
    p_model_display,
    p_dealer_price,
    p_dealer_price * 1.4, -- Simple MSRP calculation
    15, -- Default HP for test
    'Outboard',
    2025,
    true,
    now(),
    now()
  ) RETURNING id INTO new_id;
  
  RAISE NOTICE '[TEST] Successfully inserted record with ID: %', new_id;
  
  -- Verify the record exists
  IF NOT EXISTS (SELECT 1 FROM motor_models WHERE id = new_id) THEN
    RAISE EXCEPTION '[TEST] CRITICAL: Record was inserted but cannot be found in table!';
  END IF;
  
  RAISE NOTICE '[TEST] Record verified to exist in table';
  RETURN new_id;
END;
$function$;