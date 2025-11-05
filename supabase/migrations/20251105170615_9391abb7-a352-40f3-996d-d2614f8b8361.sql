-- Create saved_quotes table for quote progress saving
CREATE TABLE saved_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NULL,
  email TEXT NOT NULL,
  resume_token TEXT UNIQUE NOT NULL,
  quote_state JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  last_accessed TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_completed BOOLEAN DEFAULT FALSE,
  converted_to_quote_id UUID REFERENCES quotes(id) NULL
);

-- Indexes for performance
CREATE INDEX idx_saved_quotes_token ON saved_quotes(resume_token);
CREATE INDEX idx_saved_quotes_email ON saved_quotes(email);
CREATE INDEX idx_saved_quotes_user ON saved_quotes(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_saved_quotes_expires ON saved_quotes(expires_at);

-- Enable RLS
ALTER TABLE saved_quotes ENABLE ROW LEVEL SECURITY;

-- Anyone can create saved quotes
CREATE POLICY "Anyone can create saved quotes"
  ON saved_quotes FOR INSERT
  WITH CHECK (true);

-- Users can view their own saved quotes by email or user_id
CREATE POLICY "Users can view own saved quotes"
  ON saved_quotes FOR SELECT
  USING (
    email = (auth.jwt()->>'email') OR 
    user_id = auth.uid()
  );

-- Users can update their own saved quotes
CREATE POLICY "Users can update own saved quotes"
  ON saved_quotes FOR UPDATE
  USING (
    email = (auth.jwt()->>'email') OR 
    user_id = auth.uid()
  );

-- Update timestamp trigger
CREATE TRIGGER update_saved_quotes_updated_at
  BEFORE UPDATE ON saved_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();