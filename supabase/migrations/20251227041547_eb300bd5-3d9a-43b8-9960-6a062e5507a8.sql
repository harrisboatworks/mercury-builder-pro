-- Create table to track ElevenLabs Knowledge Base sync state
CREATE TABLE public.elevenlabs_sync_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  document_id text,
  document_name text,
  last_synced_at timestamptz,
  sync_status text DEFAULT 'pending',
  motor_count integer DEFAULT 0,
  in_stock_count integer DEFAULT 0,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.elevenlabs_sync_state ENABLE ROW LEVEL SECURITY;

-- Only admins can manage sync state
CREATE POLICY "Admins can manage elevenlabs_sync_state"
  ON public.elevenlabs_sync_state
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_elevenlabs_sync_state_updated_at
  BEFORE UPDATE ON public.elevenlabs_sync_state
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();