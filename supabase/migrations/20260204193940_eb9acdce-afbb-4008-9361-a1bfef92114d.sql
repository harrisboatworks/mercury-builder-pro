-- =====================================================
-- Trade Valuation Tables - Migrate from hardcoded values
-- =====================================================

-- Table 1: trade_valuation_brackets
-- Stores condition-based values for each brand/year-range/HP combination
CREATE TABLE public.trade_valuation_brackets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand TEXT NOT NULL,
  year_range TEXT NOT NULL,
  horsepower INTEGER NOT NULL,
  excellent NUMERIC NOT NULL,
  good NUMERIC NOT NULL,
  fair NUMERIC NOT NULL,
  poor NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (brand, year_range, horsepower)
);

-- Create indexes for efficient lookups
CREATE INDEX idx_trade_valuation_brand_year ON public.trade_valuation_brackets (brand, year_range);
CREATE INDEX idx_trade_valuation_brand ON public.trade_valuation_brackets (brand);

-- Table 2: trade_valuation_config
-- Stores global configuration (penalties, bonuses, min value)
CREATE TABLE public.trade_valuation_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.trade_valuation_brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_valuation_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trade_valuation_brackets
CREATE POLICY "Public read access for trade_valuation_brackets"
  ON public.trade_valuation_brackets
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage trade_valuation_brackets"
  ON public.trade_valuation_brackets
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for trade_valuation_config  
CREATE POLICY "Public read access for trade_valuation_config"
  ON public.trade_valuation_config
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage trade_valuation_config"
  ON public.trade_valuation_config
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger to auto-update updated_at
CREATE TRIGGER update_trade_valuation_brackets_updated_at
  BEFORE UPDATE ON public.trade_valuation_brackets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trade_valuation_config_updated_at
  BEFORE UPDATE ON public.trade_valuation_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- Insert Configuration Data
-- =====================================================
INSERT INTO public.trade_valuation_config (key, value, description) VALUES
  ('BRAND_PENALTY_JOHNSON', '{"factor": 0.5}', 'Johnson motors get 50% penalty - manufacturer out of business'),
  ('BRAND_PENALTY_EVINRUDE', '{"factor": 0.5}', 'Evinrude motors get 50% penalty - manufacturer out of business'),
  ('BRAND_PENALTY_OMC', '{"factor": 0.5}', 'OMC motors get 50% penalty - manufacturer out of business'),
  ('MERCURY_BONUS_YEARS', '{"max_age": 3, "factor": 1.1}', 'Mercury motors less than 3 years old get 10% bonus'),
  ('MIN_TRADE_VALUE', '{"value": 100}', 'Minimum trade-in value floor in CAD');

-- =====================================================
-- Insert Seed Data - Mercury (NEW 2025-2029 + existing brackets)
-- =====================================================

-- Mercury 2025-2029 (NEW - ~10% higher than 2020-2024)
INSERT INTO public.trade_valuation_brackets (brand, year_range, horsepower, excellent, good, fair, poor) VALUES
  ('Mercury', '2025-2029', 5, 880, 715, 550, 330),
  ('Mercury', '2025-2029', 10, 1540, 1265, 990, 605),
  ('Mercury', '2025-2029', 15, 2200, 1815, 1430, 880),
  ('Mercury', '2025-2029', 20, 2860, 2365, 1870, 1100),
  ('Mercury', '2025-2029', 25, 3520, 2860, 2200, 1320),
  ('Mercury', '2025-2029', 40, 4950, 4070, 3190, 1980),
  ('Mercury', '2025-2029', 50, 5720, 4730, 3740, 2310),
  ('Mercury', '2025-2029', 60, 6600, 5390, 4180, 2530),
  ('Mercury', '2025-2029', 75, 7920, 6490, 5060, 3080),
  ('Mercury', '2025-2029', 90, 9350, 7700, 6050, 3630),
  ('Mercury', '2025-2029', 115, 12100, 9900, 7700, 4620),
  ('Mercury', '2025-2029', 150, 15950, 13200, 10450, 6270),
  ('Mercury', '2025-2029', 200, 19800, 16280, 12760, 7700),
  ('Mercury', '2025-2029', 250, 24200, 19800, 15400, 9240),
  ('Mercury', '2025-2029', 300, 28600, 23100, 18150, 10890);

-- Mercury 2020-2024
INSERT INTO public.trade_valuation_brackets (brand, year_range, horsepower, excellent, good, fair, poor) VALUES
  ('Mercury', '2020-2024', 5, 800, 650, 500, 300),
  ('Mercury', '2020-2024', 10, 1400, 1150, 900, 550),
  ('Mercury', '2020-2024', 15, 2000, 1650, 1300, 800),
  ('Mercury', '2020-2024', 20, 2600, 2150, 1700, 1000),
  ('Mercury', '2020-2024', 25, 3200, 2600, 2000, 1200),
  ('Mercury', '2020-2024', 40, 4500, 3700, 2900, 1800),
  ('Mercury', '2020-2024', 50, 5200, 4300, 3400, 2100),
  ('Mercury', '2020-2024', 60, 6000, 4900, 3800, 2300),
  ('Mercury', '2020-2024', 75, 7200, 5900, 4600, 2800),
  ('Mercury', '2020-2024', 90, 8500, 7000, 5500, 3300),
  ('Mercury', '2020-2024', 115, 11000, 9000, 7000, 4200),
  ('Mercury', '2020-2024', 150, 14500, 12000, 9500, 5700),
  ('Mercury', '2020-2024', 200, 18000, 14800, 11600, 7000),
  ('Mercury', '2020-2024', 250, 22000, 18000, 14000, 8400),
  ('Mercury', '2020-2024', 300, 26000, 21000, 16500, 9900);

-- Mercury 2015-2019
INSERT INTO public.trade_valuation_brackets (brand, year_range, horsepower, excellent, good, fair, poor) VALUES
  ('Mercury', '2015-2019', 5, 700, 550, 425, 250),
  ('Mercury', '2015-2019', 10, 1200, 950, 750, 450),
  ('Mercury', '2015-2019', 15, 1700, 1350, 1050, 650),
  ('Mercury', '2015-2019', 20, 2200, 1750, 1400, 850),
  ('Mercury', '2015-2019', 25, 2800, 2200, 1700, 1000),
  ('Mercury', '2015-2019', 40, 3900, 3100, 2400, 1500),
  ('Mercury', '2015-2019', 50, 4500, 3600, 2800, 1700),
  ('Mercury', '2015-2019', 60, 5200, 4100, 3200, 1900),
  ('Mercury', '2015-2019', 75, 6200, 4900, 3800, 2300),
  ('Mercury', '2015-2019', 90, 7300, 5800, 4500, 2700),
  ('Mercury', '2015-2019', 115, 9500, 7500, 5800, 3500),
  ('Mercury', '2015-2019', 150, 12500, 10000, 7800, 4700),
  ('Mercury', '2015-2019', 200, 15500, 12400, 9600, 5800),
  ('Mercury', '2015-2019', 250, 19000, 15200, 11800, 7100),
  ('Mercury', '2015-2019', 300, 22500, 18000, 14000, 8400);

-- Mercury 2010-2014
INSERT INTO public.trade_valuation_brackets (brand, year_range, horsepower, excellent, good, fair, poor) VALUES
  ('Mercury', '2010-2014', 5, 600, 475, 375, 225),
  ('Mercury', '2010-2014', 10, 1050, 825, 650, 400),
  ('Mercury', '2010-2014', 15, 1500, 1175, 925, 575),
  ('Mercury', '2010-2014', 20, 1950, 1525, 1200, 750),
  ('Mercury', '2010-2014', 25, 2450, 1900, 1500, 900),
  ('Mercury', '2010-2014', 40, 3400, 2700, 2100, 1300),
  ('Mercury', '2010-2014', 50, 3900, 3100, 2400, 1500),
  ('Mercury', '2010-2014', 60, 4500, 3600, 2800, 1700),
  ('Mercury', '2010-2014', 75, 5400, 4300, 3300, 2000),
  ('Mercury', '2010-2014', 90, 6400, 5100, 3900, 2400),
  ('Mercury', '2010-2014', 115, 8300, 6600, 5100, 3100),
  ('Mercury', '2010-2014', 150, 10900, 8700, 6800, 4100),
  ('Mercury', '2010-2014', 200, 13500, 10800, 8400, 5100),
  ('Mercury', '2010-2014', 250, 16600, 13300, 10300, 6200),
  ('Mercury', '2010-2014', 300, 19700, 15800, 12200, 7400);

-- Mercury 2005-2009
INSERT INTO public.trade_valuation_brackets (brand, year_range, horsepower, excellent, good, fair, poor) VALUES
  ('Mercury', '2005-2009', 5, 500, 400, 300, 180),
  ('Mercury', '2005-2009', 10, 900, 700, 550, 325),
  ('Mercury', '2005-2009', 15, 1300, 1000, 800, 475),
  ('Mercury', '2005-2009', 20, 1700, 1300, 1025, 625),
  ('Mercury', '2005-2009', 25, 2100, 1650, 1300, 775),
  ('Mercury', '2005-2009', 40, 2900, 2300, 1800, 1100),
  ('Mercury', '2005-2009', 50, 3400, 2700, 2100, 1300),
  ('Mercury', '2005-2009', 60, 3900, 3100, 2400, 1450),
  ('Mercury', '2005-2009', 75, 4700, 3700, 2900, 1750),
  ('Mercury', '2005-2009', 90, 5500, 4400, 3400, 2050),
  ('Mercury', '2005-2009', 115, 7200, 5700, 4400, 2650),
  ('Mercury', '2005-2009', 150, 9500, 7600, 5900, 3550),
  ('Mercury', '2005-2009', 200, 11700, 9400, 7300, 4400),
  ('Mercury', '2005-2009', 250, 14400, 11500, 8900, 5400),
  ('Mercury', '2005-2009', 300, 17000, 13600, 10600, 6400);

-- =====================================================
-- Insert Seed Data - Yamaha (NEW 2025-2029 + existing brackets)
-- =====================================================

-- Yamaha 2025-2029 (NEW - ~10% higher than 2020-2024)
INSERT INTO public.trade_valuation_brackets (brand, year_range, horsepower, excellent, good, fair, poor) VALUES
  ('Yamaha', '2025-2029', 5, 825, 660, 523, 314),
  ('Yamaha', '2025-2029', 10, 1430, 1155, 908, 550),
  ('Yamaha', '2025-2029', 15, 2035, 1650, 1293, 798),
  ('Yamaha', '2025-2029', 20, 2640, 2145, 1678, 1018),
  ('Yamaha', '2025-2029', 25, 3300, 2640, 1980, 1210),
  ('Yamaha', '2025-2029', 40, 4620, 3740, 2860, 1760),
  ('Yamaha', '2025-2029', 50, 5280, 4290, 3300, 1980),
  ('Yamaha', '2025-2029', 60, 6050, 4840, 3740, 2200),
  ('Yamaha', '2025-2029', 75, 7260, 5830, 4510, 2750),
  ('Yamaha', '2025-2029', 90, 8580, 6820, 5280, 3190),
  ('Yamaha', '2025-2029', 115, 11000, 8800, 6820, 4070),
  ('Yamaha', '2025-2029', 150, 14520, 11660, 9020, 5390),
  ('Yamaha', '2025-2029', 200, 18040, 14410, 11220, 6710),
  ('Yamaha', '2025-2029', 250, 22000, 17600, 13640, 8140),
  ('Yamaha', '2025-2029', 300, 25960, 20790, 16170, 9680);

-- Yamaha 2020-2024
INSERT INTO public.trade_valuation_brackets (brand, year_range, horsepower, excellent, good, fair, poor) VALUES
  ('Yamaha', '2020-2024', 5, 750, 600, 475, 285),
  ('Yamaha', '2020-2024', 10, 1300, 1050, 825, 500),
  ('Yamaha', '2020-2024', 15, 1850, 1500, 1175, 725),
  ('Yamaha', '2020-2024', 20, 2400, 1950, 1525, 925),
  ('Yamaha', '2020-2024', 25, 3000, 2400, 1800, 1100),
  ('Yamaha', '2020-2024', 40, 4200, 3400, 2600, 1600),
  ('Yamaha', '2020-2024', 50, 4800, 3900, 3000, 1800),
  ('Yamaha', '2020-2024', 60, 5500, 4400, 3400, 2000),
  ('Yamaha', '2020-2024', 75, 6600, 5300, 4100, 2500),
  ('Yamaha', '2020-2024', 90, 7800, 6200, 4800, 2900),
  ('Yamaha', '2020-2024', 115, 10000, 8000, 6200, 3700),
  ('Yamaha', '2020-2024', 150, 13200, 10600, 8200, 4900),
  ('Yamaha', '2020-2024', 200, 16400, 13100, 10200, 6100),
  ('Yamaha', '2020-2024', 250, 20000, 16000, 12400, 7400),
  ('Yamaha', '2020-2024', 300, 23600, 18900, 14700, 8800);

-- Yamaha 2015-2019
INSERT INTO public.trade_valuation_brackets (brand, year_range, horsepower, excellent, good, fair, poor) VALUES
  ('Yamaha', '2015-2019', 5, 650, 525, 400, 240),
  ('Yamaha', '2015-2019', 10, 1100, 900, 700, 425),
  ('Yamaha', '2015-2019', 15, 1575, 1275, 1000, 600),
  ('Yamaha', '2015-2019', 20, 2050, 1650, 1300, 800),
  ('Yamaha', '2015-2019', 25, 2600, 2100, 1600, 950),
  ('Yamaha', '2015-2019', 40, 3600, 2900, 2200, 1350),
  ('Yamaha', '2015-2019', 50, 4100, 3300, 2500, 1500),
  ('Yamaha', '2015-2019', 60, 4700, 3800, 2900, 1750),
  ('Yamaha', '2015-2019', 75, 5700, 4600, 3500, 2100),
  ('Yamaha', '2015-2019', 90, 6700, 5400, 4100, 2500),
  ('Yamaha', '2015-2019', 115, 8600, 6900, 5300, 3200),
  ('Yamaha', '2015-2019', 150, 11400, 9100, 7000, 4200),
  ('Yamaha', '2015-2019', 200, 14100, 11300, 8700, 5200),
  ('Yamaha', '2015-2019', 250, 17200, 13800, 10600, 6400),
  ('Yamaha', '2015-2019', 300, 20300, 16200, 12600, 7600);

-- Yamaha 2010-2014
INSERT INTO public.trade_valuation_brackets (brand, year_range, horsepower, excellent, good, fair, poor) VALUES
  ('Yamaha', '2010-2014', 5, 550, 450, 350, 210),
  ('Yamaha', '2010-2014', 10, 950, 775, 600, 375),
  ('Yamaha', '2010-2014', 15, 1375, 1100, 875, 525),
  ('Yamaha', '2010-2014', 20, 1800, 1425, 1125, 700),
  ('Yamaha', '2010-2014', 25, 2275, 1800, 1400, 850),
  ('Yamaha', '2010-2014', 40, 3150, 2500, 1950, 1200),
  ('Yamaha', '2010-2014', 50, 3600, 2850, 2200, 1350),
  ('Yamaha', '2010-2014', 60, 4100, 3300, 2550, 1550),
  ('Yamaha', '2010-2014', 75, 5000, 4000, 3100, 1900),
  ('Yamaha', '2010-2014', 90, 5850, 4700, 3600, 2200),
  ('Yamaha', '2010-2014', 115, 7500, 6000, 4650, 2800),
  ('Yamaha', '2010-2014', 150, 10000, 8000, 6200, 3700),
  ('Yamaha', '2010-2014', 200, 12350, 9900, 7650, 4600),
  ('Yamaha', '2010-2014', 250, 15000, 12000, 9300, 5600),
  ('Yamaha', '2010-2014', 300, 17800, 14200, 11000, 6650);

-- Yamaha 2005-2009
INSERT INTO public.trade_valuation_brackets (brand, year_range, horsepower, excellent, good, fair, poor) VALUES
  ('Yamaha', '2005-2009', 5, 475, 375, 300, 175),
  ('Yamaha', '2005-2009', 10, 825, 650, 500, 300),
  ('Yamaha', '2005-2009', 15, 1175, 925, 725, 450),
  ('Yamaha', '2005-2009', 20, 1550, 1225, 950, 575),
  ('Yamaha', '2005-2009', 25, 1950, 1550, 1200, 725),
  ('Yamaha', '2005-2009', 40, 2700, 2150, 1650, 1000),
  ('Yamaha', '2005-2009', 50, 3100, 2450, 1900, 1150),
  ('Yamaha', '2005-2009', 60, 3550, 2800, 2175, 1300),
  ('Yamaha', '2005-2009', 75, 4275, 3400, 2625, 1600),
  ('Yamaha', '2005-2009', 90, 5050, 4025, 3100, 1875),
  ('Yamaha', '2005-2009', 115, 6450, 5150, 4000, 2400),
  ('Yamaha', '2005-2009', 150, 8550, 6850, 5300, 3175),
  ('Yamaha', '2005-2009', 200, 10600, 8475, 6550, 3950),
  ('Yamaha', '2005-2009', 250, 12900, 10300, 8000, 4800),
  ('Yamaha', '2005-2009', 300, 15250, 12200, 9450, 5700);

-- =====================================================
-- Insert Seed Data - Honda (NEW 2025-2029 + existing brackets)
-- =====================================================

-- Honda 2025-2029 (NEW - ~10% higher than 2020-2024)
INSERT INTO public.trade_valuation_brackets (brand, year_range, horsepower, excellent, good, fair, poor) VALUES
  ('Honda', '2025-2029', 5, 798, 633, 495, 303),
  ('Honda', '2025-2029', 10, 1375, 1100, 880, 523),
  ('Honda', '2025-2029', 15, 1953, 1568, 1238, 770),
  ('Honda', '2025-2029', 20, 2530, 2035, 1623, 990),
  ('Honda', '2025-2029', 25, 3190, 2530, 1980, 1210),
  ('Honda', '2025-2029', 40, 4400, 3520, 2750, 1650),
  ('Honda', '2025-2029', 50, 5060, 4070, 3190, 1925),
  ('Honda', '2025-2029', 60, 5830, 4620, 3630, 2200),
  ('Honda', '2025-2029', 75, 6930, 5500, 4290, 2585),
  ('Honda', '2025-2029', 90, 8140, 6490, 5060, 3025),
  ('Honda', '2025-2029', 115, 10560, 8470, 6600, 3960),
  ('Honda', '2025-2029', 150, 13860, 11110, 8580, 5170),
  ('Honda', '2025-2029', 200, 17160, 13750, 10670, 6380),
  ('Honda', '2025-2029', 250, 20900, 16720, 12980, 7810);

-- Honda 2020-2024
INSERT INTO public.trade_valuation_brackets (brand, year_range, horsepower, excellent, good, fair, poor) VALUES
  ('Honda', '2020-2024', 5, 725, 575, 450, 275),
  ('Honda', '2020-2024', 10, 1250, 1000, 800, 475),
  ('Honda', '2020-2024', 15, 1775, 1425, 1125, 700),
  ('Honda', '2020-2024', 20, 2300, 1850, 1475, 900),
  ('Honda', '2020-2024', 25, 2900, 2300, 1800, 1100),
  ('Honda', '2020-2024', 40, 4000, 3200, 2500, 1500),
  ('Honda', '2020-2024', 50, 4600, 3700, 2900, 1750),
  ('Honda', '2020-2024', 60, 5300, 4200, 3300, 2000),
  ('Honda', '2020-2024', 75, 6300, 5000, 3900, 2350),
  ('Honda', '2020-2024', 90, 7400, 5900, 4600, 2750),
  ('Honda', '2020-2024', 115, 9600, 7700, 6000, 3600),
  ('Honda', '2020-2024', 150, 12600, 10100, 7800, 4700),
  ('Honda', '2020-2024', 200, 15600, 12500, 9700, 5800),
  ('Honda', '2020-2024', 250, 19000, 15200, 11800, 7100);

-- Honda 2015-2019
INSERT INTO public.trade_valuation_brackets (brand, year_range, horsepower, excellent, good, fair, poor) VALUES
  ('Honda', '2015-2019', 5, 625, 500, 375, 225),
  ('Honda', '2015-2019', 10, 1075, 850, 650, 400),
  ('Honda', '2015-2019', 15, 1525, 1225, 950, 575),
  ('Honda', '2015-2019', 20, 1975, 1575, 1225, 750),
  ('Honda', '2015-2019', 25, 2500, 2000, 1500, 900),
  ('Honda', '2015-2019', 40, 3400, 2700, 2100, 1300),
  ('Honda', '2015-2019', 50, 3900, 3100, 2400, 1450),
  ('Honda', '2015-2019', 60, 4500, 3600, 2800, 1700),
  ('Honda', '2015-2019', 75, 5400, 4300, 3300, 2000),
  ('Honda', '2015-2019', 90, 6300, 5000, 3900, 2350),
  ('Honda', '2015-2019', 115, 8200, 6600, 5100, 3100),
  ('Honda', '2015-2019', 150, 10800, 8600, 6700, 4000),
  ('Honda', '2015-2019', 200, 13400, 10700, 8300, 5000),
  ('Honda', '2015-2019', 250, 16300, 13000, 10100, 6100);

-- Honda 2010-2014
INSERT INTO public.trade_valuation_brackets (brand, year_range, horsepower, excellent, good, fair, poor) VALUES
  ('Honda', '2010-2014', 5, 525, 425, 325, 200),
  ('Honda', '2010-2014', 10, 925, 725, 575, 350),
  ('Honda', '2010-2014', 15, 1325, 1050, 825, 500),
  ('Honda', '2010-2014', 20, 1700, 1350, 1050, 650),
  ('Honda', '2010-2014', 25, 2150, 1700, 1325, 800),
  ('Honda', '2010-2014', 40, 2950, 2350, 1825, 1100),
  ('Honda', '2010-2014', 50, 3375, 2700, 2100, 1275),
  ('Honda', '2010-2014', 60, 3900, 3100, 2425, 1475),
  ('Honda', '2010-2014', 75, 4675, 3725, 2875, 1750),
  ('Honda', '2010-2014', 90, 5475, 4350, 3375, 2050),
  ('Honda', '2010-2014', 115, 7100, 5675, 4400, 2675),
  ('Honda', '2010-2014', 150, 9350, 7475, 5800, 3500),
  ('Honda', '2010-2014', 200, 11600, 9275, 7200, 4350),
  ('Honda', '2010-2014', 250, 14100, 11275, 8750, 5300);

-- Honda 2005-2009
INSERT INTO public.trade_valuation_brackets (brand, year_range, horsepower, excellent, good, fair, poor) VALUES
  ('Honda', '2005-2009', 5, 450, 350, 275, 165),
  ('Honda', '2005-2009', 10, 800, 625, 500, 300),
  ('Honda', '2005-2009', 15, 1150, 900, 700, 425),
  ('Honda', '2005-2009', 20, 1475, 1175, 900, 550),
  ('Honda', '2005-2009', 25, 1850, 1475, 1150, 700),
  ('Honda', '2005-2009', 40, 2550, 2025, 1575, 950),
  ('Honda', '2005-2009', 50, 2925, 2325, 1800, 1100),
  ('Honda', '2005-2009', 60, 3375, 2700, 2100, 1275),
  ('Honda', '2005-2009', 75, 4050, 3225, 2500, 1500),
  ('Honda', '2005-2009', 90, 4750, 3775, 2925, 1775),
  ('Honda', '2005-2009', 115, 6150, 4900, 3800, 2300),
  ('Honda', '2005-2009', 150, 8100, 6475, 5025, 3025),
  ('Honda', '2005-2009', 200, 10050, 8025, 6225, 3750),
  ('Honda', '2005-2009', 250, 12225, 9775, 7575, 4575);

-- =====================================================
-- Insert Seed Data - Suzuki (NEW 2025-2029 + existing brackets)
-- =====================================================

-- Suzuki 2025-2029 (NEW - ~10% higher than 2020-2024)
INSERT INTO public.trade_valuation_brackets (brand, year_range, horsepower, excellent, good, fair, poor) VALUES
  ('Suzuki', '2025-2029', 5, 743, 605, 468, 275),
  ('Suzuki', '2025-2029', 10, 1265, 1018, 798, 495),
  ('Suzuki', '2025-2029', 15, 1815, 1458, 1155, 715),
  ('Suzuki', '2025-2029', 20, 2365, 1925, 1513, 935),
  ('Suzuki', '2025-2029', 25, 2970, 2420, 1870, 1100),
  ('Suzuki', '2025-2029', 40, 4070, 3300, 2530, 1540),
  ('Suzuki', '2025-2029', 50, 4620, 3740, 2860, 1760),
  ('Suzuki', '2025-2029', 60, 5280, 4290, 3300, 1980),
  ('Suzuki', '2025-2029', 75, 6270, 5060, 3850, 2310),
  ('Suzuki', '2025-2029', 90, 7370, 5940, 4510, 2750),
  ('Suzuki', '2025-2029', 115, 9570, 7700, 5940, 3575),
  ('Suzuki', '2025-2029', 150, 12540, 10010, 7700, 4620),
  ('Suzuki', '2025-2029', 200, 15510, 12430, 9570, 5720),
  ('Suzuki', '2025-2029', 250, 18920, 15180, 11660, 7040);

-- Suzuki 2020-2024
INSERT INTO public.trade_valuation_brackets (brand, year_range, horsepower, excellent, good, fair, poor) VALUES
  ('Suzuki', '2020-2024', 5, 675, 550, 425, 250),
  ('Suzuki', '2020-2024', 10, 1150, 925, 725, 450),
  ('Suzuki', '2020-2024', 15, 1650, 1325, 1050, 650),
  ('Suzuki', '2020-2024', 20, 2150, 1750, 1375, 850),
  ('Suzuki', '2020-2024', 25, 2700, 2200, 1700, 1000),
  ('Suzuki', '2020-2024', 40, 3700, 3000, 2300, 1400),
  ('Suzuki', '2020-2024', 50, 4200, 3400, 2600, 1600),
  ('Suzuki', '2020-2024', 60, 4800, 3900, 3000, 1800),
  ('Suzuki', '2020-2024', 75, 5700, 4600, 3500, 2100),
  ('Suzuki', '2020-2024', 90, 6700, 5400, 4100, 2500),
  ('Suzuki', '2020-2024', 115, 8700, 7000, 5400, 3250),
  ('Suzuki', '2020-2024', 150, 11400, 9100, 7000, 4200),
  ('Suzuki', '2020-2024', 200, 14100, 11300, 8700, 5200),
  ('Suzuki', '2020-2024', 250, 17200, 13800, 10600, 6400);

-- Suzuki 2015-2019
INSERT INTO public.trade_valuation_brackets (brand, year_range, horsepower, excellent, good, fair, poor) VALUES
  ('Suzuki', '2015-2019', 5, 575, 475, 375, 225),
  ('Suzuki', '2015-2019', 10, 1000, 800, 625, 400),
  ('Suzuki', '2015-2019', 15, 1425, 1150, 900, 575),
  ('Suzuki', '2015-2019', 20, 1875, 1500, 1175, 725),
  ('Suzuki', '2015-2019', 25, 2350, 1900, 1475, 875),
  ('Suzuki', '2015-2019', 40, 3200, 2575, 2000, 1225),
  ('Suzuki', '2015-2019', 50, 3650, 2950, 2275, 1400),
  ('Suzuki', '2015-2019', 60, 4175, 3375, 2600, 1575),
  ('Suzuki', '2015-2019', 75, 4950, 4000, 3050, 1850),
  ('Suzuki', '2015-2019', 90, 5825, 4700, 3575, 2175),
  ('Suzuki', '2015-2019', 115, 7575, 6100, 4700, 2850),
  ('Suzuki', '2015-2019', 150, 9900, 7925, 6100, 3675),
  ('Suzuki', '2015-2019', 200, 12275, 9825, 7575, 4550),
  ('Suzuki', '2015-2019', 250, 14950, 11975, 9225, 5575);

-- Suzuki 2010-2014
INSERT INTO public.trade_valuation_brackets (brand, year_range, horsepower, excellent, good, fair, poor) VALUES
  ('Suzuki', '2010-2014', 5, 500, 400, 325, 200),
  ('Suzuki', '2010-2014', 10, 875, 700, 550, 350),
  ('Suzuki', '2010-2014', 15, 1250, 1000, 800, 500),
  ('Suzuki', '2010-2014', 20, 1625, 1300, 1025, 625),
  ('Suzuki', '2010-2014', 25, 2050, 1650, 1275, 775),
  ('Suzuki', '2010-2014', 40, 2800, 2250, 1750, 1075),
  ('Suzuki', '2010-2014', 50, 3200, 2575, 2000, 1225),
  ('Suzuki', '2010-2014', 60, 3650, 2950, 2275, 1375),
  ('Suzuki', '2010-2014', 75, 4325, 3475, 2675, 1625),
  ('Suzuki', '2010-2014', 90, 5100, 4100, 3125, 1900),
  ('Suzuki', '2010-2014', 115, 6625, 5325, 4100, 2500),
  ('Suzuki', '2010-2014', 150, 8650, 6925, 5350, 3225),
  ('Suzuki', '2010-2014', 200, 10700, 8575, 6625, 4000),
  ('Suzuki', '2010-2014', 250, 13050, 10450, 8050, 4875);

-- Suzuki 2005-2009
INSERT INTO public.trade_valuation_brackets (brand, year_range, horsepower, excellent, good, fair, poor) VALUES
  ('Suzuki', '2005-2009', 5, 425, 350, 275, 165),
  ('Suzuki', '2005-2009', 10, 750, 600, 475, 300),
  ('Suzuki', '2005-2009', 15, 1075, 850, 675, 425),
  ('Suzuki', '2005-2009', 20, 1400, 1125, 875, 525),
  ('Suzuki', '2005-2009', 25, 1775, 1425, 1100, 675),
  ('Suzuki', '2005-2009', 40, 2425, 1950, 1500, 925),
  ('Suzuki', '2005-2009', 50, 2775, 2225, 1725, 1050),
  ('Suzuki', '2005-2009', 60, 3175, 2550, 1975, 1200),
  ('Suzuki', '2005-2009', 75, 3750, 3000, 2325, 1400),
  ('Suzuki', '2005-2009', 90, 4425, 3550, 2725, 1650),
  ('Suzuki', '2005-2009', 115, 5750, 4600, 3550, 2150),
  ('Suzuki', '2005-2009', 150, 7500, 6000, 4650, 2800),
  ('Suzuki', '2005-2009', 200, 9300, 7450, 5750, 3475),
  ('Suzuki', '2005-2009', 250, 11325, 9075, 7000, 4225);

-- =====================================================
-- Insert Seed Data - Evinrude (existing brackets only - no 2020+)
-- =====================================================

-- Evinrude 2015-2019
INSERT INTO public.trade_valuation_brackets (brand, year_range, horsepower, excellent, good, fair, poor) VALUES
  ('Evinrude', '2015-2019', 5, 550, 450, 350, 210),
  ('Evinrude', '2015-2019', 10, 950, 775, 600, 375),
  ('Evinrude', '2015-2019', 15, 1350, 1100, 875, 525),
  ('Evinrude', '2015-2019', 20, 1750, 1425, 1125, 700),
  ('Evinrude', '2015-2019', 25, 2200, 1800, 1400, 850),
  ('Evinrude', '2015-2019', 40, 3000, 2400, 1900, 1150),
  ('Evinrude', '2015-2019', 50, 3400, 2700, 2100, 1300),
  ('Evinrude', '2015-2019', 60, 3900, 3100, 2400, 1450),
  ('Evinrude', '2015-2019', 75, 4600, 3700, 2900, 1750),
  ('Evinrude', '2015-2019', 90, 5400, 4300, 3300, 2000),
  ('Evinrude', '2015-2019', 115, 7000, 5600, 4300, 2600),
  ('Evinrude', '2015-2019', 150, 9200, 7400, 5700, 3400),
  ('Evinrude', '2015-2019', 200, 11400, 9100, 7000, 4200),
  ('Evinrude', '2015-2019', 250, 13900, 11100, 8600, 5200);

-- Evinrude 2010-2014
INSERT INTO public.trade_valuation_brackets (brand, year_range, horsepower, excellent, good, fair, poor) VALUES
  ('Evinrude', '2010-2014', 5, 475, 375, 300, 175),
  ('Evinrude', '2010-2014', 10, 825, 650, 500, 325),
  ('Evinrude', '2010-2014', 15, 1175, 925, 750, 450),
  ('Evinrude', '2010-2014', 20, 1525, 1200, 950, 600),
  ('Evinrude', '2010-2014', 25, 1900, 1525, 1200, 725),
  ('Evinrude', '2010-2014', 40, 2600, 2075, 1625, 1000),
  ('Evinrude', '2010-2014', 50, 2950, 2350, 1825, 1125),
  ('Evinrude', '2010-2014', 60, 3375, 2700, 2075, 1250),
  ('Evinrude', '2010-2014', 75, 4000, 3200, 2500, 1525),
  ('Evinrude', '2010-2014', 90, 4700, 3750, 2875, 1750),
  ('Evinrude', '2010-2014', 115, 6075, 4875, 3750, 2275),
  ('Evinrude', '2010-2014', 150, 8000, 6400, 4950, 2975),
  ('Evinrude', '2010-2014', 200, 9900, 7925, 6100, 3675),
  ('Evinrude', '2010-2014', 250, 12075, 9675, 7475, 4525);

-- Evinrude 2005-2009
INSERT INTO public.trade_valuation_brackets (brand, year_range, horsepower, excellent, good, fair, poor) VALUES
  ('Evinrude', '2005-2009', 5, 400, 325, 250, 150),
  ('Evinrude', '2005-2009', 10, 700, 550, 425, 275),
  ('Evinrude', '2005-2009', 15, 1000, 800, 625, 375),
  ('Evinrude', '2005-2009', 20, 1300, 1025, 800, 500),
  ('Evinrude', '2005-2009', 25, 1650, 1300, 1025, 625),
  ('Evinrude', '2005-2009', 40, 2250, 1800, 1400, 850),
  ('Evinrude', '2005-2009', 50, 2550, 2025, 1575, 950),
  ('Evinrude', '2005-2009', 60, 2925, 2325, 1800, 1100),
  ('Evinrude', '2005-2009', 75, 3475, 2775, 2150, 1300),
  ('Evinrude', '2005-2009', 90, 4075, 3250, 2500, 1525),
  ('Evinrude', '2005-2009', 115, 5275, 4225, 3250, 1975),
  ('Evinrude', '2005-2009', 150, 6925, 5550, 4275, 2575),
  ('Evinrude', '2005-2009', 200, 8575, 6875, 5300, 3200),
  ('Evinrude', '2005-2009', 250, 10450, 8375, 6475, 3925);