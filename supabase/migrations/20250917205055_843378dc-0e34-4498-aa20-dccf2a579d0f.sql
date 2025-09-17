-- Update Mercury model numbers safely, handling duplicates
-- Only update the first motor record for each Mercury model number to avoid constraint violations

-- Create function to update with duplicate handling
CREATE OR REPLACE FUNCTION update_mercury_model_numbers_safe()
RETURNS integer
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
    rec record;
    updated_count integer := 0;
    mercury_model_number text;
    clean_display text;
    model_mappings jsonb;
BEGIN
    -- Define mapping with correct spacing to match database format
    model_mappings := '{
        "2.5 MH FourStroke": "1F02201KK",
        "3.5 MH FourStroke": "1F03201KK", 
        "4 MH FourStroke": "1F04201KK",
        "5 MH FourStroke": "1FX5201KK",
        "6 MH FourStroke": "1FX6201KK",
        "8 MH FourStroke": "1A08201LK",
        "9.9 MH FourStroke": "1A10201LK",
        "9.9 ELH FourStroke": "1A10311LK",
        "15 MH FourStroke": "1A15201LK",
        "20 MH FourStroke": "1A20201LK",
        "25 MH FourStroke": "1A25203BK",
        "30 EH FourStroke": "1A30401BK",
        "40 ELPT FourStroke": "1F40413GZ",
        "50 ELPT FourStroke": "1F51413GZ",
        "60 ELPT FourStroke": "1F60413GZ",
        "75 ELPT FourStroke": "1F754132D",
        "90 ELPT FourStroke": "1F904132D",
        "115 ELPT FourStroke": "1115F132D",
        "150 L FourStroke": "1150F13ED",
        "175 L FourStroke DTS": "11750005A",
        "200 L FourStroke": "12000001A",
        "225 L FourStroke": "12250001A",
        "250 L FourStroke": "12500001A",
        "300 L FourStroke": "13000002A"
    }'::jsonb;

    RAISE NOTICE '[MERCURY_SAFE] Starting safe Mercury model number update...';

    -- Update only one motor per Mercury model number to avoid duplicates
    FOR rec IN 
        SELECT DISTINCT ON (clean_model_display) 
               id, model_display, model_number, horsepower,
               regexp_replace(trim(model_display), '[†‡]+\s*$', '', 'g') as clean_model_display
        FROM motor_models
        WHERE model_display IS NOT NULL
        ORDER BY clean_model_display, created_at ASC  -- Take the oldest record for each model
    LOOP
        -- Look up Mercury model number
        mercury_model_number := model_mappings->>rec.clean_model_display;
        
        IF mercury_model_number IS NOT NULL THEN
            -- Check if this Mercury model number is already in use
            IF NOT EXISTS (SELECT 1 FROM motor_models WHERE model_number = mercury_model_number AND id != rec.id) THEN
                -- Update the motor with Mercury model number
                UPDATE motor_models 
                SET model_number = mercury_model_number,
                    updated_at = now()
                WHERE id = rec.id;
                
                updated_count := updated_count + 1;
                RAISE NOTICE '[MERCURY_SAFE] Updated motor ID % (%.1f HP) "%" -> model_number: %', 
                    rec.id, rec.horsepower, rec.clean_model_display, mercury_model_number;
            ELSE
                RAISE NOTICE '[MERCURY_SAFE] Skipped motor ID % - Mercury model number % already in use', 
                    rec.id, mercury_model_number;
            END IF;
        ELSE
            RAISE NOTICE '[MERCURY_SAFE] No mapping found for: "%"', rec.clean_model_display;
        END IF;
    END LOOP;

    RAISE NOTICE '[MERCURY_SAFE] Safe update complete. Updated % motors with Mercury model numbers.', updated_count;
    RETURN updated_count;
END;
$$;

-- Execute the safe update
SELECT update_mercury_model_numbers_safe();

-- Drop the temporary function
DROP FUNCTION update_mercury_model_numbers_safe();