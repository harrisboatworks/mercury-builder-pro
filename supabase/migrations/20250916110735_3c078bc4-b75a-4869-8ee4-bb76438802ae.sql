-- Create RPC function for bulk update of brochure models
CREATE OR REPLACE FUNCTION update_brochure_models_bulk(
  p_model_numbers text[],
  p_fields jsonb[]
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  updated_count integer := 0;
  field_record jsonb;
  i integer;
BEGIN
  -- Validate inputs
  IF array_length(p_model_numbers, 1) IS NULL OR array_length(p_fields, 1) IS NULL THEN
    RETURN 0;
  END IF;
  
  IF array_length(p_model_numbers, 1) != array_length(p_fields, 1) THEN
    RAISE EXCEPTION 'Arrays must have same length';
  END IF;
  
  -- Update each record individually for precise control
  FOR i IN 1..array_length(p_model_numbers, 1) LOOP
    field_record := p_fields[i];
    
    UPDATE motor_models SET
      model_display = field_record->>'model_display',
      model_key = field_record->>'model_key', 
      mercury_model_no = field_record->>'mercury_model_no',
      dealer_price = COALESCE((field_record->>'dealer_price')::numeric, dealer_price),
      msrp = COALESCE((field_record->>'msrp')::numeric, msrp),
      year = COALESCE((field_record->>'year')::integer, year),
      updated_at = now(),
      last_scraped = now()
    WHERE model_number = p_model_numbers[i] 
      AND is_brochure = true;
    
    IF FOUND THEN
      updated_count := updated_count + 1;
    END IF;
  END LOOP;
  
  RETURN updated_count;
END;
$$;