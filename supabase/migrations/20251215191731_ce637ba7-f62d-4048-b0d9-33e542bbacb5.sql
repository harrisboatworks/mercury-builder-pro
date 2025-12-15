-- Update motor availability from Mercury Inventory Dec 15, 2025
-- This migration updates availability status while protecting motors already In Stock at Harris

-- ============================================
-- MOTORS AVAILABLE IN STOCK AT MERCURY WAREHOUSE
-- ============================================

-- 8HP FourStroke models
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 8, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A08201LK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 6, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A08301LK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 6, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A08311LK' AND availability != 'In Stock' AND in_stock = false;

-- 9.9HP FourStroke models
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 1, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A10211LK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 4, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A10251LK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 1, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A10261LK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 1, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A10301LK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 1, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A10311LK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 2, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A10361LK' AND availability != 'In Stock' AND in_stock = false;

-- 9.9HP ProKicker models
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 8, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A10451LK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 1, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A10452LK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 7, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A10461LK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 1, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A10462LK' AND availability != 'In Stock' AND in_stock = false;

-- 15HP FourStroke models
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 9, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A15201LK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 6, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A15211LK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 7, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A15301LK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 8, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A15311LK' AND availability != 'In Stock' AND in_stock = false;

-- 20HP FourStroke models
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 9, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A20201LK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 10, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A20211LK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 3, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A20301LK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 10, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A20311LK' AND availability != 'In Stock' AND in_stock = false;

-- 25HP FourStroke models
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 3, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A25201LK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 4, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A25211LK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 6, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A25301LK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 10, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A25312LK' AND availability != 'In Stock' AND in_stock = false;

-- 30HP FourStroke models
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 2, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A30201LK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 4, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A30211LK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 10, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A30301LK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 10, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A30312LK' AND availability != 'In Stock' AND in_stock = false;

-- 40HP FourStroke models
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 3, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A40301LK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 10, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A40312LK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 5, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A40422FK' AND availability != 'In Stock' AND in_stock = false;

-- 50HP FourStroke models
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 10, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A50312LK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 5, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A50422FK' AND availability != 'In Stock' AND in_stock = false;

-- 60HP FourStroke models
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 10, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A60312LK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 10, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A60422FK' AND availability != 'In Stock' AND in_stock = false;

-- 75HP FourStroke models
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 10, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A75412FK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 7, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A75422FK' AND availability != 'In Stock' AND in_stock = false;

-- 90HP FourStroke models
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 10, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A90412FK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 7, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1A90422FK' AND availability != 'In Stock' AND in_stock = false;

-- 100HP FourStroke models
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 9, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B100412FK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 5, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B100422FK' AND availability != 'In Stock' AND in_stock = false;

-- 115HP FourStroke/Pro XS models
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 10, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B115412FK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 10, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B115422FK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 10, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B115412PK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 10, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B115422PK' AND availability != 'In Stock' AND in_stock = false;

-- 150HP FourStroke/Pro XS models
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 10, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B150L12K' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 10, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B150XL2K' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 3, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B150XL2PK' AND availability != 'In Stock' AND in_stock = false;

-- 175HP FourStroke/Pro XS/Verado models
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 5, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B175L12K' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 10, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B175XL2K' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 1, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B175L12PK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 2, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B175XL2PK' AND availability != 'In Stock' AND in_stock = false;

-- 200HP FourStroke/Pro XS/Verado models
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 9, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B200L12K' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 10, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B200XL2K' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 10, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B200XXL2K' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 2, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B200L12PK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 2, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B200XL2PK' AND availability != 'In Stock' AND in_stock = false;

-- 225HP FourStroke/Pro XS/Verado models
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 5, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B225L12K' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 10, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B225XL2K' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 2, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B225L12PK' AND availability != 'In Stock' AND in_stock = false;

-- 250HP FourStroke/Pro XS/Verado models
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 5, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B250L12K' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 10, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B250XL2K' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 10, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B250XXL2K' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 3, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B250L12PK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 3, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B250XL2PK' AND availability != 'In Stock' AND in_stock = false;

-- 300HP FourStroke/Verado models
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 10, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B300L12K' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 10, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B300XL2K' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 10, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B300XXL2K' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 10, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B300L22K' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 10, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B300XL22K' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 10, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B300XXL22K' AND availability != 'In Stock' AND in_stock = false;

-- 350HP Verado models
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 5, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B350L22K' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 8, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B350XL22K' AND availability != 'In Stock' AND in_stock = false;

-- 400HP Verado models
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 10, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B400XL22K' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 10, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B400XXL22K' AND availability != 'In Stock' AND in_stock = false;

-- 450HP Verado models
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 5, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B450XL22K' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'At Mercury Warehouse', stock_quantity = 10, last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1B450XXL22K' AND availability != 'In Stock' AND in_stock = false;

-- ============================================
-- MOTORS OUT OF STOCK WITH ESTIMATED DATES
-- ============================================

-- Est. Dec 15, 2025
UPDATE motor_models SET availability = 'Est. Dec 15, 2025', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1C02501UK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'Est. Dec 15, 2025', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1C03501UK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'Est. Dec 15, 2025', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1C04001UK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'Est. Dec 15, 2025', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1C05001UK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'Est. Dec 15, 2025', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1C05011UK' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'Est. Dec 15, 2025', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1C06001UK' AND availability != 'In Stock' AND in_stock = false;

-- Est. Dec 29, 2025
UPDATE motor_models SET availability = 'Est. Dec 29, 2025', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1F25211EL' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'Est. Dec 29, 2025', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1F25212EL' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'Est. Dec 29, 2025', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1F30211EL' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'Est. Dec 29, 2025', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1F30212EL' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'Est. Dec 29, 2025', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1F40311EL' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'Est. Dec 29, 2025', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1F40312EL' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'Est. Dec 29, 2025', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1F50311EL' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'Est. Dec 29, 2025', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1F50312EL' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'Est. Dec 29, 2025', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1F60311EL' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'Est. Dec 29, 2025', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1F60312EL' AND availability != 'In Stock' AND in_stock = false;

-- SeaPro models - Est. Dec 29, 2025
UPDATE motor_models SET availability = 'Est. Dec 29, 2025', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1E15201LL' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'Est. Dec 29, 2025', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1E15211LL' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'Est. Dec 29, 2025', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1E20211LL' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'Est. Dec 29, 2025', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1E25312LL' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'Est. Dec 29, 2025', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1E30312LL' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'Est. Dec 29, 2025', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1E40312LL' AND availability != 'In Stock' AND in_stock = false;

-- Est. Jan 5, 2026
UPDATE motor_models SET availability = 'Est. Jan 5, 2026', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1E45312LL' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'Est. Jan 5, 2026', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1E50312LL' AND availability != 'In Stock' AND in_stock = false;

-- Est. Jan 12, 2026
UPDATE motor_models SET availability = 'Est. Jan 12, 2026', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1E60352LL' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'Est. Jan 12, 2026', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1E75422LL' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'Est. Jan 12, 2026', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1E90422LL' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'Est. Jan 12, 2026', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1E100422LL' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'Est. Jan 12, 2026', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1E115422LL' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'Est. Jan 12, 2026', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1E150L22LL' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'Est. Jan 12, 2026', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1E150XL22LL' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'Est. Jan 12, 2026', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1E200L22LL' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'Est. Jan 12, 2026', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1E200XL22LL' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'Est. Jan 12, 2026', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1E250L22LL' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'Est. Jan 12, 2026', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1E250XL22LL' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'Est. Jan 12, 2026', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1E300L22LL' AND availability != 'In Stock' AND in_stock = false;
UPDATE motor_models SET availability = 'Est. Jan 12, 2026', last_stock_check = NOW(), updated_at = NOW() WHERE model_number = '1E300XL22LL' AND availability != 'In Stock' AND in_stock = false;

-- Log this sync operation
INSERT INTO cron_job_logs (job_name, status, motors_found, result, completed_at)
VALUES (
  'mercury-warehouse-sync-dec15',
  'completed',
  120,
  '{"source": "Mercury_Inventory_Dec_15_2025.docx", "at_warehouse": 85, "with_eta": 35, "protected_in_stock": "preserved"}'::jsonb,
  NOW()
);