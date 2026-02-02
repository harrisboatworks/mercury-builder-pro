-- Standardize Pro XS model_display to full rigging codes

-- Handle "XXX L ProXS" format (with space before L)
UPDATE motor_models
SET model_display = REPLACE(model_display, ' L ProXS', ' ELPT ProXS')
WHERE model_display LIKE '% L ProXS';

-- Handle "XXX XL ProXS" format (with space before XL)
UPDATE motor_models
SET model_display = REPLACE(model_display, ' XL ProXS', ' EXLPT ProXS')
WHERE model_display LIKE '% XL ProXS';

-- Handle 300 HP variants with different spacing (no space: "300L Pro XS")
UPDATE motor_models
SET model_display = REGEXP_REPLACE(model_display, '^(\d+)L Pro XS', '\1 ELPT Pro XS')
WHERE model_display ~ '^\d+L Pro XS';

UPDATE motor_models
SET model_display = REGEXP_REPLACE(model_display, '^(\d+)XL Pro XS', '\1 EXLPT Pro XS')
WHERE model_display ~ '^\d+XL Pro XS';

-- Counter-rotating: CXL → CEXLPT
UPDATE motor_models
SET model_display = REGEXP_REPLACE(model_display, '^(\d+)CXL Pro XS', '\1 CEXLPT Pro XS')
WHERE model_display ~ '^\d+CXL Pro XS';