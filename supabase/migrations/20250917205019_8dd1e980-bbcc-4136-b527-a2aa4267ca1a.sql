-- Update Mercury model numbers with correct spacing patterns
-- Fix the mapping to match actual database model_display format

-- Create function to update with correct spacing patterns
CREATE OR REPLACE FUNCTION update_mercury_model_numbers_v2()
RETURNS integer
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
    rec record;
    updated_count integer := 0;
    model_mappings jsonb;
    clean_display text;
    mercury_model_number text;
BEGIN
    -- Define mapping with correct spacing to match database format
    model_mappings := '{
        "2.5 MH FourStroke": "1F02201KK",
        "3.5 MH FourStroke": "1F03201KK", 
        "3.5 MLH FourStroke": "1F03211KK",
        "4 MH FourStroke": "1F04201KK",
        "4 MLH FourStroke": "1F04211KK",
        "5 MH FourStroke": "1FX5201KK",
        "5 MXLH FourStroke": "1F05221KK",
        "5 MLHA Sail Power FourStroke": "1F05216KK",
        "6 MH FourStroke": "1FX6201KK",
        "6 MLH FourStroke": "1FX6211KK",
        "8 MH FourStroke": "1A08201LK",
        "8 MLH FourStroke": "1A08211LK",
        "8 EH FourStroke": "1A08301LK",
        "8 ELH FourStroke": "1A08311LK",
        "9.9 MRC FourStroke": "1A10204LV",
        "9.9 MH FourStroke": "1A10201LK",
        "9.9 MLH FourStroke": "1A10211LK",
        "9.9 EH FourStroke": "1A10301LK",
        "9.9 EL FourStroke": "1A10312LK",
        "9.9 ELH FourStroke": "1A10311LK",
        "9.9 EPT FourStroke": "1A10402LK",
        "9.9 MLH Command Thrust FourStroke": "1A10251LK",
        "9.9 MXLH Command Thrust FourStroke": "1A10261LK",
        "9.9 ELH Command Thrust FourStroke": "1A10351LK",
        "9.9 EXLH Command Thrust FourStroke": "1A10361LK",
        "9.9 ELPT Command Thrust ProKicker EFI FourStroke": "1A10452LK",
        "9.9 EXLPT Command Thrust ProKicker EFI FourStroke": "1A10462LK",
        "9.9 ELHPT Command Thrust ProKicker EFI FourStroke": "1A10451LK",
        "9.9 EXLHPT Command Thrust ProKicker EFI FourStroke": "1A10461LK",
        "15 MRC FourStroke": "1A15204LK",
        "15 MH FourStroke": "1A15201LK",
        "15 MLH FourStroke": "1A15211LK",
        "15 E FourStroke": "1A15302LK",
        "15 EL FourStroke": "1A15312LK",
        "15 EH FourStroke": "1A15301LK",
        "15 ELH FourStroke": "1A15311LK",
        "15 EPT FourStroke": "1A15402LK",
        "15 EHPT FourStroke": "1A15401LK",
        "15 ELPT FourStroke": "1A15412LK",
        "15 ELPT ProKicker FourStroke": "1A15452BK",
        "15 EXLPT ProKicker FourStroke": "1A15462BK",
        "15 ELHPT ProKicker FourStroke": "1A15451BK",
        "15 EXLHPT ProKicker FourStroke": "1A15461BK",
        "20 MRC FourStroke": "1A20204LK",
        "20 MH FourStroke": "1A20201LK",
        "20 MLH FourStroke": "1A20211LK",
        "20 EH FourStroke": "1A20301LK",
        "20 E FourStroke": "1A20302LK",
        "20 ELH FourStroke": "1A20311LK",
        "20 EL FourStroke": "1A20312LK",
        "20 EPT FourStroke": "1A20402LK",
        "20 ELHPT FourStroke": "1A20411LK",
        "20 ELPT FourStroke": "1A20412LK",
        "25 MH FourStroke": "1A25203BK",
        "25 MLH FourStroke": "1A25213BK",
        "25 EH FourStroke": "1A25301BK",
        "25 ELH FourStroke": "1A25311BK",
        "25 EL FourStroke": "1A25312BK",
        "25 EPT FourStroke": "1A25403BK",
        "25 ELHPT FourStroke": "1A25411BK",
        "25 ELPT FourStroke": "1A25413BK",
        "25 ELPT ProKicker FourStroke": "1A25452BK",
        "25 EXLPT ProKicker FourStroke": "1A25462BK",
        "30 MHGA FourStroke": "1A3G203BK",
        "30 MLHGA FourStroke": "1A3G213BK",
        "30 ELGA FourStroke": "1A3G313BK",
        "30 ELHGA FourStroke": "1A3G311BK",
        "30 EPT FourStroke": "1A30403BK",
        "30 ELPT FourStroke": "1A30413BK",
        "30 ELHPT FourStroke": "1A30411BK",
        "40 EPT FourStroke": "1F40403GZ",
        "40 ELPT FourStroke": "1F40413GZ",
        "40 ELHPT FourStroke Tiller": "1F4041TJZ",
        "40 ELPT Command Thrust (Four-Cylinder) FourStroke": "1F41453GZ",
        "50 ELPT FourStroke": "1F51413GZ",
        "50 ELHPT FourStroke Tiller": "1F5141TJZ",
        "50 ELPT Command Thrust FourStroke": "1F51453GZ",
        "50 ELHPT Command Thrust FourStroke Tiller": "1F5145TJZ",
        "60 ELPT FourStroke": "1F60413GZ",
        "60 ELHPT FourStroke Tiller": "1F6041TJZ",
        "60 ELPT Command Thrust FourStroke": "1F60453GZ",
        "60 EXLPT Command Thrust FourStroke": "1F60463GZ",
        "60 ELHPT Command Thrust FourStroke Tiller": "1F6045TJZ",
        "75 ELPT FourStroke": "1F754132D",
        "90 ELPT FourStroke": "1F904132D",
        "90 EXLPT FourStroke": "1F904232D",
        "90 ELPT Command Thrust FourStroke": "1F904532D",
        "90 EXLPT Command Thrust FourStroke": "1F904632D",
        "115 ELPT FourStroke": "1115F132D",
        "115 EXLPT FourStroke": "1115F232D",
        "115 ELPT Command Thrust FourStroke": "1115F532D",
        "115 EXLPT Command Thrust FourStroke": "1115F632D",
        "115 ECXLPT Command Thrust FourStroke": "1115F642D",
        "150 L FourStroke": "1150F13ED",
        "150 XL FourStroke": "1150F23ED",
        "150 CXL FourStroke": "1150F24ED",
        "175 L FourStroke DTS": "11750005A",
        "175 XL FourStroke DTS": "11750006A",
        "175 CXL FourStroke DTS": "11750007A",
        "200 L FourStroke": "12000001A",
        "200 XL FourStroke": "12000009A",
        "200 CXL FourStroke": "12000029A",
        "200 L FourStroke DTS": "12000005A",
        "200 XL FourStroke DTS": "12000013A",
        "200 CXL FourStroke DTS": "12000017A",
        "225 L FourStroke": "12250001A",
        "225 XL FourStroke": "12250009A",
        "225 CXL FourStroke": "12250047A",
        "225 XXL FourStroke": "12250021A",
        "225 L FourStroke DTS": "12250005A",
        "225 XL FourStroke DTS": "12250013A",
        "225 CXL FourStroke DTS": "12250017A",
        "225 XXL FourStroke DTS": "12250025A",
        "225 CXXL FourStroke DTS": "12250029A",
        "250 L FourStroke": "12500001A",
        "250 XL FourStroke": "12500009A",
        "250 CXL FourStroke": "12500083A",
        "250 XXL FourStroke": "12500021A",
        "250 CXXL FourStroke": "12500087A",
        "250 L FourStroke DTS": "12500005A",
        "250 XL FourStroke DTS": "12500013A",
        "250 CXL FourStroke DTS": "12500017A",
        "250 XXL FourStroke DTS": "12500025A",
        "250 CXXL FourStroke DTS": "12500029A",
        "300 L FourStroke": "13000002A",
        "300 XL FourStroke": "13000010A",
        "300 CXL FourStroke": "13000111A",
        "300 L FourStroke DTS": "13000006A",
        "300 XL FourStroke DTS": "13000014A",
        "300 CXL FourStroke DTS": "13000018A",
        "115 ELPT Pro XS": "1117F131D",
        "115 EXLPT Pro XS": "1117F231D",
        "115 ELPT Pro XS Command Thrust": "1117F531D",
        "115 EXLPT Pro XS Command Thrust": "1117F631D",
        "150 L Pro XS": "1152F131D",
        "150 XL Pro XS": "1152F231D",
        "175 L Pro XS": "11750001A",
        "175 XL Pro XS": "11750002A",
        "200 L Pro XS TorqueMaster": "12000027A",
        "200 L Pro XS": "12000039A",
        "200 XL Pro XS": "12000041A",
        "200 L Pro XS DTS TorqueMaster": "12000035A",
        "200 XL Pro XS DTS": "12000040A",
        "225 L Pro XS TorqueMaster": "12250033A",
        "225 XL Pro XS": "12250034A",
        "225 L Pro XS DTS TorqueMaster": "12250053A",
        "225 XL Pro XS DTS": "12250055A",
        "250 L Pro XS TorqueMaster": "12500033A",
        "250 XL Pro XS": "12500034A",
        "250 L Pro XS DTS TorqueMaster": "12500094A",
        "250 XL Pro XS DTS": "12500096A",
        "300 L Pro XS TorqueMaster": "13000022A",
        "300 XL Pro XS": "13000023A", 
        "300 L Pro XS DTS TorqueMaster": "13000177A",
        "300 XL Pro XS DTS": "13000179A",
        "300 CXL Pro XS DTS": "13000181A"
    }'::jsonb;

    RAISE NOTICE '[MERCURY_V2] Starting Mercury model number update with corrected spacing...';

    -- Update motors by matching model_display
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
            RAISE NOTICE '[MERCURY_V2] Updated motor ID % (%.1f HP) "%" -> model_number: %', 
                rec.id, rec.horsepower, clean_display, mercury_model_number;
        ELSE
            RAISE NOTICE '[MERCURY_V2] No match found for motor ID % (%.1f HP): "%"', 
                rec.id, rec.horsepower, clean_display;
        END IF;
    END LOOP;

    RAISE NOTICE '[MERCURY_V2] Update complete. Updated % motors with Mercury model numbers.', updated_count;
    RETURN updated_count;
END;
$$;

-- Execute the update
SELECT update_mercury_model_numbers_v2();

-- Drop the temporary function
DROP FUNCTION update_mercury_model_numbers_v2();