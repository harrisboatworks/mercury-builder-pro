-- Create motor_options table (central catalog)
CREATE TABLE motor_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  category TEXT NOT NULL DEFAULT 'accessory',
  base_price NUMERIC NOT NULL DEFAULT 0,
  msrp NUMERIC,
  image_url TEXT,
  part_number TEXT,
  is_active BOOLEAN DEFAULT true,
  is_taxable BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  specifications JSONB DEFAULT '{}',
  features JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create motor_option_assignments table (direct motor-to-option links)
CREATE TABLE motor_option_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  motor_id UUID NOT NULL REFERENCES motor_models(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES motor_options(id) ON DELETE CASCADE,
  assignment_type TEXT NOT NULL DEFAULT 'available',
  price_override NUMERIC,
  is_included BOOLEAN DEFAULT false,
  notes TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(motor_id, option_id)
);

-- Create motor_option_rules table (rule-based auto-assignments)
CREATE TABLE motor_option_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  description TEXT,
  option_id UUID NOT NULL REFERENCES motor_options(id) ON DELETE CASCADE,
  conditions JSONB NOT NULL DEFAULT '{}',
  assignment_type TEXT NOT NULL DEFAULT 'available',
  price_override NUMERIC,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE motor_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE motor_option_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE motor_option_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for motor_options
CREATE POLICY "Public read access for motor_options"
  ON motor_options FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage motor_options"
  ON motor_options FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for motor_option_assignments
CREATE POLICY "Public read access for motor_option_assignments"
  ON motor_option_assignments FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage motor_option_assignments"
  ON motor_option_assignments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for motor_option_rules
CREATE POLICY "Public read access for motor_option_rules"
  ON motor_option_rules FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage motor_option_rules"
  ON motor_option_rules FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_motor_option_assignments_motor_id ON motor_option_assignments(motor_id);
CREATE INDEX idx_motor_option_assignments_option_id ON motor_option_assignments(option_id);
CREATE INDEX idx_motor_option_rules_option_id ON motor_option_rules(option_id);
CREATE INDEX idx_motor_options_category ON motor_options(category);
CREATE INDEX idx_motor_options_is_active ON motor_options(is_active);