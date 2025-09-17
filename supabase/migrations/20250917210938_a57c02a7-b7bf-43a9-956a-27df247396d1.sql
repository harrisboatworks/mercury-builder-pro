-- Execute the model number fix function
DO $$
DECLARE
    result_record RECORD;
BEGIN
    -- Run the function and capture results
    SELECT * INTO result_record FROM public.fix_auto_generated_model_numbers_safe();
    
    -- Log the results
    RAISE NOTICE 'Model number fix completed. Updated % records.', result_record.updated_count;
    
    -- If any updates were made, log some details
    IF result_record.updated_count > 0 THEN
        RAISE NOTICE 'First few updates: %', LEFT(result_record.details::text, 500);
    END IF;
END $$;