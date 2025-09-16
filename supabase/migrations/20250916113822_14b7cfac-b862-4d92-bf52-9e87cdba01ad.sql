-- Create the bulk update RPC function for brochure models
CREATE OR REPLACE FUNCTION public.update_brochure_models_bulk(
  p_rows jsonb
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec jsonb;
  _updated integer := 0;
BEGIN
  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' THEN
    RAISE EXCEPTION 'p_rows must be a JSON array of objects with model_number';
  END IF;

  FOR rec IN SELECT * FROM jsonb_array_elements(p_rows)
  LOOP
    -- Skip if no model_number
    IF COALESCE(rec->>'model_number','') = '' THEN
      CONTINUE;
    END IF;

    UPDATE public.motor_models m
       SET model_display    = COALESCE(rec->>'model_display',    m.model_display),
           model_key        = COALESCE(rec->>'model_key',        m.model_key),
           mercury_model_no = COALESCE(rec->>'mercury_model_no', m.mercury_model_no),
           dealer_price     = COALESCE((rec->>'dealer_price')::numeric, m.dealer_price),
           msrp             = COALESCE((rec->>'msrp')::numeric,        m.msrp),
           year             = COALESCE((rec->>'year')::int,            m.year),
           updated_at       = now()
     WHERE m.is_brochure = true
       AND m.model_number = rec->>'model_number';

    IF FOUND THEN
      _updated := _updated + 1;
    END IF;
  END LOOP;

  RETURN _updated;
END $$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.update_brochure_models_bulk(jsonb) TO anon, authenticated;