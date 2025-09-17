-- Extract Mercury model numbers from pricelist and update motor_models
-- This migration maps motor descriptions to exact Mercury model numbers

-- Create temporary function to apply Mercury model numbers
CREATE OR REPLACE FUNCTION update_mercury_model_numbers()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    rec record;
    updated_count integer := 0;
    model_mappings jsonb;
    clean_display text;
    mercury_model_number text;
BEGIN
    -- Define the mapping of descriptions to Mercury model numbers from the pricelist
    model_mappings := '{
        "2.5MH FourStroke": "1F02201KK",
        "3.5MH FourStroke": "1F03201KK", 
        "3.5MLH FourStroke": "1F03211KK",
        "4MH FourStroke": "1F04201KK",
        "4MLH FourStroke": "1F04211KK",
        "5MH FourStroke": "1FX5201KK",
        "5MXLH FourStroke": "1F05221KK",
        "5MLHA Sail Power FourStroke": "1F05216KK",
        "6MH FourStroke": "1FX6201KK",
        "6MLH FourStroke": "1FX6211KK",
        "8MH FourStroke": "1A08201LK",
        "8MLH FourStroke": "1A08211LK",
        "8EH FourStroke": "1A08301LK",
        "8ELH FourStroke": "1A08311LK",
        "9.9MRC FourStroke": "1A10204LV",
        "9.9MH FourStroke": "1A10201LK",
        "9.9MLH FourStroke": "1A10211LK",
        "9.9EH FourStroke": "1A10301LK",
        "9.9EL FourStroke": "1A10312LK",
        "9.9ELH FourStroke": "1A10311LK",
        "9.9EPT FourStroke": "1A10402LK",
        "9.9MLH Command Thrust FourStroke": "1A10251LK",
        "9.9MXLH Command Thrust FourStroke": "1A10261LK",
        "9.9ELH Command Thrust FourStroke": "1A10351LK",
        "9.9EXLH Command Thrust FourStroke": "1A10361LK",
        "9.9ELPT Command Thrust ProKicker EFI FourStroke": "1A10452LK",
        "9.9EXLPT Command Thrust ProKicker EFI FourStroke": "1A10462LK",
        "9.9ELHPT Command Thrust ProKicker EFI FourStroke": "1A10451LK",
        "9.9EXLHPT Command Thrust ProKicker EFI FourStroke": "1A10461LK",
        "15MRC FourStroke": "1A15204LK",
        "15MH FourStroke": "1A15201LK",
        "15MLH FourStroke": "1A15211LK",
        "15E FourStroke": "1A15302LK",
        "15EL FourStroke": "1A15312LK",
        "15EH FourStroke": "1A15301LK",
        "15ELH FourStroke": "1A15311LK",
        "15EPT FourStroke": "1A15402LK",
        "15EHPT FourStroke": "1A15401LK",
        "15ELPT FourStroke": "1A15412LK",
        "15ELPT ProKicker FourStroke": "1A15452BK",
        "15EXLPT ProKicker FourStroke": "1A15462BK",
        "15ELHPT ProKicker FourStroke": "1A15451BK",
        "15EXLHPT ProKicker FourStroke": "1A15461BK",
        "20MRC FourStroke": "1A20204LK",
        "20MH FourStroke": "1A20201LK",
        "20MLH FourStroke": "1A20211LK",
        "20EH FourStroke": "1A20301LK",
        "20E FourStroke": "1A20302LK",
        "20ELH FourStroke": "1A20311LK",
        "20EL FourStroke": "1A20312LK",
        "20EPT FourStroke": "1A20402LK",
        "20ELHPT FourStroke": "1A20411LK",
        "20ELPT FourStroke": "1A20412LK",
        "25MH FourStroke": "1A25203BK",
        "25MLH FourStroke": "1A25213BK",
        "25EH FourStroke": "1A25301BK",
        "25ELH FourStroke": "1A25311BK",
        "25EL FourStroke": "1A25312BK",
        "25EPT FourStroke": "1A25403BK",
        "25ELHPT FourStroke": "1A25411BK",
        "25ELPT FourStroke": "1A25413BK",
        "25ELPT ProKicker FourStroke": "1A25452BK",
        "25EXLPT ProKicker FourStroke": "1A25462BK",
        "30MHGA FourStroke": "1A3G203BK",
        "30MLHGA FourStroke": "1A3G213BK",
        "30ELGA FourStroke": "1A3G313BK",
        "30ELHGA FourStroke": "1A3G311BK",
        "30EPT FourStroke": "1A30403BK",
        "30ELPT FourStroke": "1A30413BK",
        "30ELHPT FourStroke": "1A30411BK",
        "40EPT FourStroke": "1F40403GZ",
        "40ELPT FourStroke": "1F40413GZ",
        "40ELHPT FourStroke Tiller": "1F4041TJZ",
        "40ELPT Command Thrust (Four-Cylinder) FourStroke": "1F41453GZ",
        "50ELPT FourStroke": "1F51413GZ",
        "50ELHPT FourStroke Tiller": "1F5141TJZ",
        "50ELPT Command Thrust FourStroke": "1F51453GZ",
        "50ELHPT Command Thrust FourStroke Tiller": "1F5145TJZ",
        "60ELPT FourStroke": "1F60413GZ",
        "60ELHPT FourStroke Tiller": "1F6041TJZ",
        "60ELPT Command Thrust FourStroke": "1F60453GZ",
        "60EXLPT Command Thrust FourStroke": "1F60463GZ",
        "60ELHPT Command Thrust FourStroke Tiller": "1F6045TJZ",
        "75ELPT FourStroke": "1F754132D",
        "90ELPT FourStroke": "1F904132D",
        "90EXLPT FourStroke": "1F904232D",
        "90ELPT Command Thrust FourStroke": "1F904532D",
        "90EXLPT Command Thrust FourStroke": "1F904632D",
        "115ELPT FourStroke": "1115F132D",
        "115EXLPT FourStroke": "1115F232D",
        "115ELPT Command Thrust FourStroke": "1115F532D",
        "115EXLPT Command Thrust FourStroke": "1115F632D",
        "115ECXLPT Command Thrust FourStroke": "1115F642D",
        "150L FourStroke": "1150F13ED",
        "150XL FourStroke": "1150F23ED",
        "150CXL FourStroke": "1150F24ED",
        "175L FourStroke DTS": "11750005A",
        "175XL FourStroke DTS": "11750006A",
        "175CXL FourStroke DTS": "11750007A",
        "200L FourStroke": "12000001A",
        "200XL FourStroke": "12000009A",
        "200CXL FourStroke": "12000029A",
        "200L FourStroke DTS": "12000005A",
        "200XL FourStroke DTS": "12000013A",
        "200CXL FourStroke DTS": "12000017A",
        "225L FourStroke": "12250001A",
        "225XL FourStroke": "12250009A",
        "225CXL FourStroke": "12250047A",
        "225XXL FourStroke": "12250021A",
        "225L FourStroke DTS": "12250005A",
        "225XL FourStroke DTS": "12250013A",
        "225CXL FourStroke DTS": "12250017A",
        "225XXL FourStroke DTS": "12250025A",
        "225CXXL FourStroke DTS": "12250029A",
        "250L FourStroke": "12500001A",
        "250XL FourStroke": "12500009A",
        "250CXL FourStroke": "12500083A",
        "250XXL FourStroke": "12500021A",
        "250CXXL FourStroke": "12500087A",
        "250L FourStroke DTS": "12500005A",
        "250XL FourStroke DTS": "12500013A",
        "250CXL FourStroke DTS": "12500017A",
        "250XXL FourStroke DTS": "12500025A",
        "250CXXL FourStroke DTS": "12500029A",
        "300L FourStroke": "13000002A",
        "300XL FourStroke": "13000010A",
        "300CXL FourStroke": "13000111A",
        "300L FourStroke DTS": "13000006A",
        "300XL FourStroke DTS": "13000014A",
        "300CXL FourStroke DTS": "13000018A",
        "115ELPT Pro XS": "1117F131D",
        "115EXLPT Pro XS": "1117F231D",
        "115ELPT Pro XS Command Thrust": "1117F531D",
        "115EXLPT Pro XS Command Thrust": "1117F631D",
        "150L Pro XS": "1152F131D",
        "150XL Pro XS": "1152F231D",
        "175L Pro XS": "11750001A",
        "175XL Pro XS": "11750002A",
        "200L Pro XS TorqueMaster": "12000027A",
        "200L Pro XS": "12000039A",
        "200XL Pro XS": "12000041A",
        "200L Pro XS DTS TorqueMaster": "12000035A",
        "200XL Pro XS DTS": "12000040A",
        "225L Pro XS TorqueMaster": "12250033A",
        "225XL Pro XS": "12250034A",
        "225L Pro XS DTS TorqueMaster": "12250053A",
        "225XL Pro XS DTS": "12250055A",
        "250L Pro XS TorqueMaster": "12500033A",
        "250XL Pro XS": "12500034A",
        "250L Pro XS DTS TorqueMaster": "12500094A",
        "250XL Pro XS DTS": "12500096A",
        "300L Pro XS TorqueMaster": "13000022A",
        "300XL Pro XS": "13000023A",
        "300L Pro XS DTS TorqueMaster": "13000177A",
        "300XL Pro XS DTS": "13000179A",
        "300CXL Pro XS DTS": "13000181A"
    }'::jsonb;

    -- Log start
    RAISE NOTICE '[MERCURY] Starting Mercury model number update...';

    -- Update motors by matching model_display (cleaning symbols first)
    FOR rec IN 
        SELECT id, model_display, model_number, horsepower
        FROM motor_models
        WHERE model_display IS NOT NULL
        ORDER BY id
    LOOP
        -- Clean the model_display by removing symbols like †‡
        clean_display := regexp_replace(trim(rec.model_display), '[†‡]+\s*$', '', 'g');
        
        -- Look up Mercury model number
        mercury_model_number := model_mappings->>clean_display;
        
        IF mercury_model_number IS NOT NULL THEN
            -- Update the motor with Mercury model number
            UPDATE motor_models 
            SET model_number = mercury_model_number,
                updated_at = now()
            WHERE id = rec.id;
            
            updated_count := updated_count + 1;
            RAISE NOTICE '[MERCURY] Updated motor ID % (%.1f HP) "%" -> model_number: %', 
                rec.id, rec.horsepower, clean_display, mercury_model_number;
        ELSE
            RAISE NOTICE '[MERCURY] No match found for motor ID % (%.1f HP): "%"', 
                rec.id, rec.horsepower, clean_display;
        END IF;
    END LOOP;

    RAISE NOTICE '[MERCURY] Update complete. Updated % motors with Mercury model numbers.', updated_count;
    RETURN updated_count;
END;
$$;

-- Execute the update
SELECT update_mercury_model_numbers();

-- Drop the temporary function
DROP FUNCTION update_mercury_model_numbers();

-- Add comment documenting the change
COMMENT ON COLUMN motor_models.model_number IS 'Exact Mercury Marine model number from official pricelist for ordering and identification';