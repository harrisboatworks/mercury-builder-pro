-- COMPREHENSIVE MOTOR DATABASE RESTORATION
-- This migration implements the complete restoration plan:
-- 1. Delete all existing motor records (clean slate)
-- 2. Import complete official Mercury catalog with proper model numbers
-- 3. Set up proper data structure for future imports

-- Step 1: Clear existing motor data
DELETE FROM motor_models;

-- Step 2: Import complete official Mercury catalog
-- This ensures we have a complete, clean database with official model numbers

-- FourStroke Motors
INSERT INTO motor_models (
  model_number, model_display, horsepower, family, rigging_code, 
  motor_type, model, make, year, is_brochure, availability,
  model_key, mercury_model_no, created_at, updated_at
) VALUES 
-- 2.5-6 HP FourStroke
('1F02201KK', '2.5 MH FourStroke', 2.5, 'FourStroke', 'MH', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_2.5_MH', '1F02201KK', now(), now()),
('1F03201KK', '3.5 MH FourStroke', 3.5, 'FourStroke', 'MH', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_3.5_MH', '1F03201KK', now(), now()),
('1F03211KK', '3.5 MLH FourStroke', 3.5, 'FourStroke', 'MLH', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_3.5_MLH', '1F03211KK', now(), now()),
('1F04201KK', '4 MH FourStroke', 4, 'FourStroke', 'MH', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_4_MH', '1F04201KK', now(), now()),
('1F04211KK', '4 MLH FourStroke', 4, 'FourStroke', 'MLH', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_4_MLH', '1F04211KK', now(), now()),
('1FX5201KK', '5 MH FourStroke', 5, 'FourStroke', 'MH', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_5_MH', '1FX5201KK', now(), now()),
('1F05221KK', '5 MXLH FourStroke', 5, 'FourStroke', 'MXLH', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_5_MXLH', '1F05221KK', now(), now()),
('1F05216KK', '5 MLHA Sail Power FourStroke', 5, 'FourStroke', 'MLHA', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_5_MLHA', '1F05216KK', now(), now()),
('1FX6201KK', '6 MH FourStroke', 6, 'FourStroke', 'MH', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_6_MH', '1FX6201KK', now(), now()),
('1FX6211KK', '6 MLH FourStroke', 6, 'FourStroke', 'MLH', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_6_MLH', '1FX6211KK', now(), now()),

-- 8-9.9 HP FourStroke
('1A08201LK', '8 MH FourStroke', 8, 'FourStroke', 'MH', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_8_MH', '1A08201LK', now(), now()),
('1A08211LK', '8 MLH FourStroke', 8, 'FourStroke', 'MLH', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_8_MLH', '1A08211LK', now(), now()),
('1A08301LK', '8 EH FourStroke', 8, 'FourStroke', 'EH', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_8_EH', '1A08301LK', now(), now()),
('1A08311LK', '8 ELH FourStroke', 8, 'FourStroke', 'ELH', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_8_ELH', '1A08311LK', now(), now()),
('1A10204LV', '9.9 MRC FourStroke', 9.9, 'FourStroke', 'MRC', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_9.9_MRC', '1A10204LV', now(), now()),
('1A10201LK', '9.9 MH FourStroke', 9.9, 'FourStroke', 'MH', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_9.9_MH', '1A10201LK', now(), now()),
('1A10211LK', '9.9 MLH FourStroke', 9.9, 'FourStroke', 'MLH', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_9.9_MLH', '1A10211LK', now(), now()),
('1A10301LK', '9.9 EH FourStroke', 9.9, 'FourStroke', 'EH', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_9.9_EH', '1A10301LK', now(), now()),
('1A10312LK', '9.9 EL FourStroke', 9.9, 'FourStroke', 'EL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_9.9_EL', '1A10312LK', now(), now()),
('1A10311LK', '9.9 ELH FourStroke', 9.9, 'FourStroke', 'ELH', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_9.9_ELH', '1A10311LK', now(), now()),
('1A10402LK', '9.9 EPT FourStroke', 9.9, 'FourStroke', 'EPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_9.9_EPT', '1A10402LK', now(), now()),

-- 9.9 Command Thrust
('1A10251LK', '9.9 MLH Command Thrust FourStroke', 9.9, 'FourStroke', 'MLH', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_9.9_MLH_CT', '1A10251LK', now(), now()),
('1A10261LK', '9.9 MXLH Command Thrust FourStroke', 9.9, 'FourStroke', 'MXLH', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_9.9_MXLH_CT', '1A10261LK', now(), now()),
('1A10351LK', '9.9 ELH Command Thrust FourStroke', 9.9, 'FourStroke', 'ELH', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_9.9_ELH_CT', '1A10351LK', now(), now()),
('1A10361LK', '9.9 EXLH Command Thrust FourStroke', 9.9, 'FourStroke', 'EXLH', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_9.9_EXLH_CT', '1A10361LK', now(), now()),

-- 9.9 ProKicker
('1A10452LK', '9.9 ELPT Command Thrust ProKicker EFI FourStroke', 9.9, 'FourStroke', 'ELPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_9.9_ELPT_PK', '1A10452LK', now(), now()),
('1A10462LK', '9.9 EXLPT Command Thrust ProKicker EFI FourStroke', 9.9, 'FourStroke', 'EXLPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_9.9_EXLPT_PK', '1A10462LK', now(), now()),
('1A10451LK', '9.9 ELHPT Command Thrust ProKicker EFI FourStroke', 9.9, 'FourStroke', 'ELHPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_9.9_ELHPT_PK', '1A10451LK', now(), now()),
('1A10461LK', '9.9 EXLHPT Command Thrust ProKicker EFI FourStroke', 9.9, 'FourStroke', 'EXLHPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_9.9_EXLHPT_PK', '1A10461LK', now(), now()),

-- 15-30 HP FourStroke
('1A15204LK', '15 MRC FourStroke', 15, 'FourStroke', 'MRC', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_15_MRC', '1A15204LK', now(), now()),
('1A15201LK', '15 MH FourStroke', 15, 'FourStroke', 'MH', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_15_MH', '1A15201LK', now(), now()),
('1A15211LK', '15 MLH FourStroke', 15, 'FourStroke', 'MLH', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_15_MLH', '1A15211LK', now(), now()),
('1A15302LK', '15 E FourStroke', 15, 'FourStroke', 'E', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_15_E', '1A15302LK', now(), now()),
('1A15312LK', '15 EL FourStroke', 15, 'FourStroke', 'EL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_15_EL', '1A15312LK', now(), now()),
('1A15301LK', '15 EH FourStroke', 15, 'FourStroke', 'EH', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_15_EH', '1A15301LK', now(), now()),
('1A15311LK', '15 ELH FourStroke', 15, 'FourStroke', 'ELH', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_15_ELH', '1A15311LK', now(), now()),
('1A15402LK', '15 EPT FourStroke', 15, 'FourStroke', 'EPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_15_EPT', '1A15402LK', now(), now()),
('1A15401LK', '15 EHPT FourStroke', 15, 'FourStroke', 'EHPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_15_EHPT', '1A15401LK', now(), now()),
('1A15412LK', '15 ELPT FourStroke', 15, 'FourStroke', 'ELPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_15_ELPT', '1A15412LK', now(), now()),

-- 15 ProKicker
('1A15452BK', '15 ELPT ProKicker FourStroke', 15, 'FourStroke', 'ELPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_15_ELPT_PK', '1A15452BK', now(), now()),
('1A15462BK', '15 EXLPT ProKicker FourStroke', 15, 'FourStroke', 'EXLPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_15_EXLPT_PK', '1A15462BK', now(), now()),
('1A15451BK', '15 ELHPT ProKicker FourStroke', 15, 'FourStroke', 'ELHPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_15_ELHPT_PK', '1A15451BK', now(), now()),
('1A15461BK', '15 EXLHPT ProKicker FourStroke', 15, 'FourStroke', 'EXLHPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_15_EXLHPT_PK', '1A15461BK', now(), now()),

-- 20 HP FourStroke
('1A20204LK', '20 MRC FourStroke', 20, 'FourStroke', 'MRC', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_20_MRC', '1A20204LK', now(), now()),
('1A20201LK', '20 MH FourStroke', 20, 'FourStroke', 'MH', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_20_MH', '1A20201LK', now(), now()),
('1A20211LK', '20 MLH FourStroke', 20, 'FourStroke', 'MLH', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_20_MLH', '1A20211LK', now(), now()),
('1A20301LK', '20 EH FourStroke', 20, 'FourStroke', 'EH', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_20_EH', '1A20301LK', now(), now()),
('1A20302LK', '20 E FourStroke', 20, 'FourStroke', 'E', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_20_E', '1A20302LK', now(), now()),
('1A20311LK', '20 ELH FourStroke', 20, 'FourStroke', 'ELH', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_20_ELH', '1A20311LK', now(), now()),
('1A20312LK', '20 EL FourStroke', 20, 'FourStroke', 'EL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_20_EL', '1A20312LK', now(), now()),
('1A20402LK', '20 EPT FourStroke', 20, 'FourStroke', 'EPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_20_EPT', '1A20402LK', now(), now()),
('1A20411LK', '20 ELHPT FourStroke', 20, 'FourStroke', 'ELHPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_20_ELHPT', '1A20411LK', now(), now()),
('1A20412LK', '20 ELPT FourStroke', 20, 'FourStroke', 'ELPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_20_ELPT', '1A20412LK', now(), now()),

-- 25 HP FourStroke
('1A25203BK', '25 MH FourStroke', 25, 'FourStroke', 'MH', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_25_MH', '1A25203BK', now(), now()),
('1A25213BK', '25 MLH FourStroke', 25, 'FourStroke', 'MLH', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_25_MLH', '1A25213BK', now(), now()),
('1A25301BK', '25 EH FourStroke', 25, 'FourStroke', 'EH', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_25_EH', '1A25301BK', now(), now()),
('1A25311BK', '25 ELH FourStroke', 25, 'FourStroke', 'ELH', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_25_ELH', '1A25311BK', now(), now()),
('1A25312BK', '25 EL FourStroke', 25, 'FourStroke', 'EL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_25_EL', '1A25312BK', now(), now()),
('1A25403BK', '25 EPT FourStroke', 25, 'FourStroke', 'EPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_25_EPT', '1A25403BK', now(), now()),
('1A25411BK', '25 ELHPT FourStroke', 25, 'FourStroke', 'ELHPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_25_ELHPT', '1A25411BK', now(), now()),
('1A25413BK', '25 ELPT FourStroke', 25, 'FourStroke', 'ELPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_25_ELPT', '1A25413BK', now(), now()),

-- 25 ProKicker
('1A25452BK', '25 ELPT ProKicker FourStroke', 25, 'FourStroke', 'ELPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_25_ELPT_PK', '1A25452BK', now(), now()),
('1A25462BK', '25 EXLPT ProKicker FourStroke', 25, 'FourStroke', 'EXLPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_25_EXLPT_PK', '1A25462BK', now(), now()),

-- 30 HP FourStroke
('1A3G203BK', '30 MHGA FourStroke', 30, 'FourStroke', 'MHGA', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_30_MHGA', '1A3G203BK', now(), now()),
('1A3G213BK', '30 MLHGA FourStroke', 30, 'FourStroke', 'MLHGA', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_30_MLHGA', '1A3G213BK', now(), now()),
('1A3G313BK', '30 ELGA FourStroke', 30, 'FourStroke', 'ELGA', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_30_ELGA', '1A3G313BK', now(), now()),
('1A3G311BK', '30 ELHGA FourStroke', 30, 'FourStroke', 'ELHGA', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_30_ELHGA', '1A3G311BK', now(), now()),
('1A30403BK', '30 EPT FourStroke', 30, 'FourStroke', 'EPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_30_EPT', '1A30403BK', now(), now()),
('1A30413BK', '30 ELPT FourStroke', 30, 'FourStroke', 'ELPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_30_ELPT', '1A30413BK', now(), now()),
('1A30411BK', '30 ELHPT FourStroke', 30, 'FourStroke', 'ELHPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_30_ELHPT', '1A30411BK', now(), now()),

-- 40-60 HP FourStroke (Four-Cylinder)
('1F40403GZ', '40 EPT FourStroke', 40, 'FourStroke', 'EPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_40_EPT', '1F40403GZ', now(), now()),
('1F40413GZ', '40 ELPT FourStroke', 40, 'FourStroke', 'ELPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_40_ELPT', '1F40413GZ', now(), now()),
('1F4041TJZ', '40 ELHPT FourStroke Tiller', 40, 'FourStroke', 'ELHPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_40_ELHPT_T', '1F4041TJZ', now(), now()),
('1F41453GZ', '40 ELPT Command Thrust (Four-Cylinder) FourStroke', 40, 'FourStroke', 'ELPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_40_ELPT_CT', '1F41453GZ', now(), now()),

-- 50 HP FourStroke
('1F51413GZ', '50 ELPT FourStroke', 50, 'FourStroke', 'ELPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_50_ELPT', '1F51413GZ', now(), now()),
('1F5141TJZ', '50 ELHPT FourStroke Tiller', 50, 'FourStroke', 'ELHPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_50_ELHPT_T', '1F5141TJZ', now(), now()),
('1F51453GZ', '50 ELPT Command Thrust FourStroke', 50, 'FourStroke', 'ELPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_50_ELPT_CT', '1F51453GZ', now(), now()),
('1F5145TJZ', '50 ELHPT Command Thrust FourStroke Tiller', 50, 'FourStroke', 'ELHPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochue', 'FS_50_ELHPT_CT_T', '1F5145TJZ', now(), now()),

-- 60 HP FourStroke
('1F60413GZ', '60 ELPT FourStroke', 60, 'FourStroke', 'ELPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_60_ELPT', '1F60413GZ', now(), now()),
('1F6041TJZ', '60 ELHPT FourStroke Tiller', 60, 'FourStroke', 'ELHPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_60_ELHPT_T', '1F6041TJZ', now(), now()),
('1F60453GZ', '60 ELPT Command Thrust FourStroke', 60, 'FourStroke', 'ELPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_60_ELPT_CT', '1F60453GZ', now(), now()),
('1F60463GZ', '60 EXLPT Command Thrust FourStroke', 60, 'FourStroke', 'EXLPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_60_EXLPT_CT', '1F60463GZ', now(), now()),
('1F6045TJZ', '60 ELHPT Command Thrust FourStroke Tiller', 60, 'FourStroke', 'ELHPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_60_ELHPT_CT_T', '1F6045TJZ', now(), now()),

-- 75-115 HP FourStroke
('1F754132D', '75 ELPT FourStroke', 75, 'FourStroke', 'ELPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_75_ELPT', '1F754132D', now(), now()),
('1F904132D', '90 ELPT FourStroke', 90, 'FourStroke', 'ELPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_90_ELPT', '1F904132D', now(), now()),
('1F904232D', '90 EXLPT FourStroke', 90, 'FourStroke', 'EXLPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_90_EXLPT', '1F904232D', now(), now()),
('1F904532D', '90 ELPT Command Thrust FourStroke', 90, 'FourStroke', 'ELPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_90_ELPT_CT', '1F904532D', now(), now()),
('1F904632D', '90 EXLPT Command Thrust FourStroke', 90, 'FourStroke', 'EXLPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_90_EXLPT_CT', '1F904632D', now(), now()),

-- 115 HP FourStroke
('1115F132D', '115 ELPT FourStroke', 115, 'FourStroke', 'ELPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_115_ELPT', '1115F132D', now(), now()),
('1115F232D', '115 EXLPT FourStroke', 115, 'FourStroke', 'EXLPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochue', 'FS_115_EXLPT', '1115F232D', now(), now()),
('1115F532D', '115 ELPT Command Thrust FourStroke', 115, 'FourStroke', 'ELPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_115_ELPT_CT', '1115F532D', now(), now()),
('1115F632D', '115 EXLPT Command Thrust FourStroke', 115, 'FourStroke', 'EXLPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_115_EXLPT_CT', '1115F632D', now(), now()),
('1115F642D', '115 ECXLPT Command Thrust FourStroke', 115, 'FourStroke', 'ECXLPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_115_ECXLPT_CT', '1115F642D', now(), now()),

-- 150-300 HP FourStroke V6
('1150F13ED', '150 L FourStroke', 150, 'FourStroke', 'L', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_150_L', '1150F13ED', now(), now()),
('1150F23ED', '150 XL FourStroke', 150, 'FourStroke', 'XL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_150_XL', '1150F23ED', now(), now()),
('1150F24ED', '150 CXL FourStroke', 150, 'FourStroke', 'CXL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_150_CXL', '1150F24ED', now(), now()),

-- 175 HP FourStroke
('11750005A', '175 L FourStroke DTS', 175, 'FourStroke', 'L', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_175_L_DTS', '11750005A', now(), now()),
('11750006A', '175 XL FourStroke DTS', 175, 'FourStroke', 'XL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_175_XL_DTS', '11750006A', now(), now()),
('11750007A', '175 CXL FourStroke DTS', 175, 'FourStroke', 'CXL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_175_CXL_DTS', '11750007A', now(), now()),

-- 200 HP FourStroke
('12000001A', '200 L FourStroke', 200, 'FourStroke', 'L', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_200_L', '12000001A', now(), now()),
('12000009A', '200 XL FourStroke', 200, 'FourStroke', 'XL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_200_XL', '12000009A', now(), now()),
('12000029A', '200 CXL FourStroke', 200, 'FourStroke', 'CXL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_200_CXL', '12000029A', now(), now()),
('12000005A', '200 L FourStroke DTS', 200, 'FourStroke', 'L', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_200_L_DTS', '12000005A', now(), now()),
('12000013A', '200 XL FourStroke DTS', 200, 'FourStroke', 'XL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_200_XL_DTS', '12000013A', now(), now()),
('12000017A', '200 CXL FourStroke DTS', 200, 'FourStroke', 'CXL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_200_CXL_DTS', '12000017A', now(), now()),

-- 225 HP FourStroke
('12250001A', '225 L FourStroke', 225, 'FourStroke', 'L', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_225_L', '12250001A', now(), now()),
('12250009A', '225 XL FourStroke', 225, 'FourStroke', 'XL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_225_XL', '12250009A', now(), now()),
('12250047A', '225 CXL FourStroke', 225, 'FourStroke', 'CXL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_225_CXL', '12250047A', now(), now()),
('12250021A', '225 XXL FourStroke', 225, 'FourStroke', 'XXL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_225_XXL', '12250021A', now(), now()),
('12250005A', '225 L FourStroke DTS', 225, 'FourStroke', 'L', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_225_L_DTS', '12250005A', now(), now()),
('12250013A', '225 XL FourStroke DTS', 225, 'FourStroke', 'XL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_225_XL_DTS', '12250013A', now(), now()),
('12250017A', '225 CXL FourStroke DTS', 225, 'FourStroke', 'CXL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_225_CXL_DTS', '12250017A', now(), now()),
('12250025A', '225 XXL FourStroke DTS', 225, 'FourStroke', 'XXL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_225_XXL_DTS', '12250025A', now(), now()),
('12250029A', '225 CXXL FourStroke DTS', 225, 'FourStroke', 'CXXL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_225_CXXL_DTS', '12250029A', now(), now()),

-- 250 HP FourStroke
('12500001A', '250 L FourStroke', 250, 'FourStroke', 'L', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_250_L', '12500001A', now(), now()),
('12500009A', '250 XL FourStroke', 250, 'FourStroke', 'XL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_250_XL', '12500009A', now(), now()),
('12500083A', '250 CXL FourStroke', 250, 'FourStroke', 'CXL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_250_CXL', '12500083A', now(), now()),
('12500021A', '250 XXL FourStroke', 250, 'FourStroke', 'XXL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_250_XXL', '12500021A', now(), now()),
('12500087A', '250 CXXL FourStroke', 250, 'FourStroke', 'CXXL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_250_CXXL', '12500087A', now(), now()),
('12500005A', '250 L FourStroke DTS', 250, 'FourStroke', 'L', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_250_L_DTS', '12500005A', now(), now()),
('12500013A', '250 XL FourStroke DTS', 250, 'FourStroke', 'XL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_250_XL_DTS', '12500013A', now(), now()),
('12500017A', '250 CXL FourStroke DTS', 250, 'FourStroke', 'CXL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_250_CXL_DTS', '12500017A', now(), now()),
('12500025A', '250 XXL FourStroke DTS', 250, 'FourStroke', 'XXL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_250_XXL_DTS', '12500025A', now(), now()),
('12500029A', '250 CXXL FourStroke DTS', 250, 'FourStroke', 'CXXL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_250_CXXL_DTS', '12500029A', now(), now()),

-- 300 HP FourStroke
('13000002A', '300 L FourStroke', 300, 'FourStroke', 'L', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_300_L', '13000002A', now(), now()),
('13000010A', '300 XL FourStroke', 300, 'FourStroke', 'XL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_300_XL', '13000010A', now(), now()),
('13000111A', '300 CXL FourStroke', 300, 'FourStroke', 'CXL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_300_CXL', '13000111A', now(), now()),
('13000006A', '300 L FourStroke DTS', 300, 'FourStroke', 'L', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_300_L_DTS', '13000006A', now(), now()),
('13000014A', '300 XL FourStroke DTS', 300, 'FourStroke', 'XL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_300_XL_DTS', '13000014A', now(), now()),
('13000018A', '300 CXL FourStroke DTS', 300, 'FourStroke', 'CXL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'FS_300_CXL_DTS', '13000018A', now(), now()),

-- ProXS Motors
('1117F131D', '115 ELPT Pro XS', 115, 'ProXS', 'ELPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'PXS_115_ELPT', '1117F131D', now(), now()),
('1117F231D', '115 EXLPT Pro XS', 115, 'ProXS', 'EXLPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'PXS_115_EXLPT', '1117F231D', now(), now()),
('1117F531D', '115 ELPT Pro XS Command Thrust', 115, 'ProXS', 'ELPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'PXS_115_ELPT_CT', '1117F531D', now(), now()),
('1117F631D', '115 EXLPT Pro XS Command Thrust', 115, 'ProXS', 'EXLPT', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'PXS_115_EXLPT_CT', '1117F631D', now(), now()),

-- 150 HP ProXS
('1152F131D', '150 L Pro XS', 150, 'ProXS', 'L', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'PXS_150_L', '1152F131D', now(), now()),
('1152F231D', '150 XL Pro XS', 150, 'ProXS', 'XL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'PXS_150_XL', '1152F231D', now(), now()),

-- 175 HP ProXS
('11750001A', '175 L Pro XS', 175, 'ProXS', 'L', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'PXS_175_L', '11750001A', now(), now()),
('11750002A', '175 XL Pro XS', 175, 'ProXS', 'XL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'PXS_175_XL', '11750002A', now(), now()),

-- 200 HP ProXS
('12000027A', '200 L Pro XS TorqueMaster', 200, 'ProXS', 'L', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'PXS_200_L_TM', '12000027A', now(), now()),
('12000039A', '200 L Pro XS', 200, 'ProXS', 'L', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'PXS_200_L', '12000039A', now(), now()),
('12000041A', '200 XL Pro XS', 200, 'ProXS', 'XL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'PXS_200_XL', '12000041A', now(), now()),
('12000035A', '200 L Pro XS DTS TorqueMaster', 200, 'ProXS', 'L', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'PXS_200_L_DTS_TM', '12000035A', now(), now()),
('12000040A', '200 XL Pro XS DTS', 200, 'ProXS', 'XL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'PXS_200_XL_DTS', '12000040A', now(), now()),

-- 225 HP ProXS
('12250033A', '225 L Pro XS TorqueMaster', 225, 'ProXS', 'L', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'PXS_225_L_TM', '12250033A', now(), now()),
('12250034A', '225 XL Pro XS', 225, 'ProXS', 'XL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'PXS_225_XL', '12250034A', now(), now()),
('12250053A', '225 L Pro XS DTS TorqueMaster', 225, 'ProXS', 'L', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'PXS_225_L_DTS_TM', '12250053A', now(), now()),
('12250055A', '225 XL Pro XS DTS', 225, 'ProXS', 'XL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'PXS_225_XL_DTS', '12250055A', now(), now()),

-- 250 HP ProXS
('12500033A', '250 L Pro XS TorqueMaster', 250, 'ProXS', 'L', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'PXS_250_L_TM', '12500033A', now(), now()),
('12500034A', '250 XL Pro XS', 250, 'ProXS', 'XL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'PXS_250_XL', '12500034A', now(), now()),
('12500094A', '250 L Pro XS DTS TorqueMaster', 250, 'ProXS', 'L', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'PXS_250_L_DTS_TM', '12500094A', now(), now()),
('12500096A', '250 XL Pro XS DTS', 250, 'ProXS', 'XL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'PXS_250_XL_DTS', '12500096A', now(), now()),

-- 300 HP ProXS
('13000022A', '300 L Pro XS TorqueMaster', 300, 'ProXS', 'L', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'PXS_300_L_TM', '13000022A', now(), now()),
('13000023A', '300 XL Pro XS', 300, 'ProXS', 'XL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'PXS_300_XL', '13000023A', now(), now()),
('13000177A', '300 L Pro XS DTS TorqueMaster', 300, 'ProXS', 'L', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'PXS_300_L_DTS_TM', '13000177A', now(), now()),
('13000179A', '300 XL Pro XS DTS', 300, 'ProXS', 'XL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'PXS_300_XL_DTS', '13000179A', now(), now()),
('13000181A', '300 CXL Pro XS DTS', 300, 'ProXS', 'CXL', 'Outboard', 'Outboard', 'Mercury', 2025, true, 'Brochure', 'PXS_300_CXL_DTS', '13000181A', now(), now());

-- Create enhanced bulk upsert function for proper conflict resolution
-- This replaces the old function with one that uses official Mercury model numbers
CREATE OR REPLACE FUNCTION public.update_brochure_models_bulk_v2(p_rows jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rec jsonb;
  n_updated integer := 0;
  existing_id uuid;
  current_model_number text;
  current_model_key text;
  rows_affected integer;
  insert_id uuid;
BEGIN
  -- Log function start
  RAISE NOTICE '[RPC] Starting update_brochure_models_bulk_v2 with % records', jsonb_array_length(p_rows);
  
  -- Validate input
  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' THEN
    RAISE EXCEPTION 'p_rows must be a JSON array of objects with model_number';
  END IF;

  -- Process each record with proper conflict resolution using official model numbers
  FOR rec IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
    -- Extract model number and key
    current_model_number := rec->>'model_number';
    current_model_key := COALESCE(rec->>'model_key', '');
    
    -- Log each record being processed
    RAISE NOTICE '[RPC] Processing model_number: %, model_display: %', 
      COALESCE(current_model_number, 'NULL'), 
      COALESCE(rec->>'model_display', 'NULL');
    
    -- Skip if no model_number
    IF COALESCE(current_model_number, '') = '' THEN
      RAISE NOTICE '[RPC] Skipping record - no model_number';
      CONTINUE;
    END IF;

    -- Reset variables
    existing_id := NULL;

    -- Check if a record with this official Mercury model_number already exists
    -- This is the KEY change - we use model_number for conflict resolution, not model_key
    SELECT id INTO existing_id 
    FROM motor_models 
    WHERE model_number = current_model_number
    LIMIT 1;

    RAISE NOTICE '[RPC] Existing record check for model_number %, found ID: %', 
      current_model_number, COALESCE(existing_id::text, 'NULL');

    -- Validate required fields before proceeding
    IF COALESCE(NULLIF(rec->>'model', ''), 'Outboard') = '' THEN
      RAISE EXCEPTION '[RPC] Invalid model field for record %: cannot be empty', current_model_number;
    END IF;
    
    IF COALESCE(NULLIF(rec->>'motor_type', ''), 'Outboard') = '' THEN
      RAISE EXCEPTION '[RPC] Invalid motor_type field for record %: cannot be empty', current_model_number;
    END IF;

    BEGIN
      IF existing_id IS NOT NULL THEN
        -- Update existing record with official Mercury model number
        RAISE NOTICE '[RPC] Updating existing record ID: % for model_number: %', existing_id, current_model_number;
        
        UPDATE motor_models SET
          model_key = current_model_key,
          mercury_model_no = COALESCE(rec->>'mercury_model_no', current_model_number),
          model = COALESCE(NULLIF(rec->>'model', ''), 'Outboard'),
          model_display = COALESCE(rec->>'model_display', ''),
          dealer_price = COALESCE((rec->>'dealer_price')::numeric, dealer_price),
          msrp = COALESCE((rec->>'msrp')::numeric, msrp),
          horsepower = COALESCE((rec->>'horsepower')::numeric, (rec->>'hp')::numeric, horsepower),
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
        -- Insert new record - but only if it doesn't conflict with our official catalog
        -- Check if this would conflict with an existing official model number
        IF EXISTS (SELECT 1 FROM motor_models WHERE model_number = current_model_number AND is_brochure = true) THEN
          RAISE NOTICE '[RPC] Skipping insert - conflicts with existing official model: %', current_model_number;
          CONTINUE;
        END IF;
        
        RAISE NOTICE '[RPC] Inserting new record for model_number: %', current_model_number;
        
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
          current_model_number,
          current_model_key,
          COALESCE(rec->>'mercury_model_no', current_model_number),
          COALESCE(NULLIF(rec->>'model', ''), 'Outboard'),
          COALESCE(rec->>'model_display', ''),
          COALESCE((rec->>'dealer_price')::numeric, 0),
          COALESCE((rec->>'msrp')::numeric, 0),
          COALESCE((rec->>'horsepower')::numeric, (rec->>'hp')::numeric, 0),
          COALESCE(NULLIF(rec->>'motor_type', ''), 'Outboard'),
          COALESCE((rec->>'year')::integer, 2025),
          false, -- New inventory records are not brochure records
          now()
        ) RETURNING id INTO insert_id;
        
        GET DIAGNOSTICS rows_affected = ROW_COUNT;
        RAISE NOTICE '[RPC] Insert completed, rows affected: %, new ID: %', rows_affected, insert_id;
        
        IF rows_affected > 0 THEN
          n_updated := n_updated + 1;
        ELSE
          RAISE EXCEPTION '[RPC] CRITICAL: Insert returned 0 rows affected for model_number %', current_model_number;
        END IF;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION '[RPC] Failed to process record %: % (SQLSTATE: %)', 
        current_model_number, SQLERRM, SQLSTATE;
    END;
  END LOOP;
  
  RAISE NOTICE '[RPC] Function completed successfully. Total records processed: %', n_updated;
  RETURN n_updated;
END;
$$;

-- Verification: Show summary of imported motors
DO $$
DECLARE
  total_count integer;
  fs_count integer;
  pxs_count integer;
  sp_count integer;
  ver_count integer;
BEGIN
  SELECT COUNT(*) INTO total_count FROM motor_models;
  SELECT COUNT(*) INTO fs_count FROM motor_models WHERE family = 'FourStroke';
  SELECT COUNT(*) INTO pxs_count FROM motor_models WHERE family = 'ProXS';
  SELECT COUNT(*) INTO sp_count FROM motor_models WHERE family = 'SeaPro';
  SELECT COUNT(*) INTO ver_count FROM motor_models WHERE family = 'Verado';
  
  RAISE NOTICE 'MOTOR DATABASE RESTORATION COMPLETE:';
  RAISE NOTICE '  Total Motors: %', total_count;
  RAISE NOTICE '  FourStroke: %', fs_count;
  RAISE NOTICE '  ProXS: %', pxs_count;
  RAISE NOTICE '  SeaPro: %', sp_count;
  RAISE NOTICE '  Verado: %', ver_count;
  RAISE NOTICE 'All motors now use official Mercury model numbers for conflict resolution.';
END $$;