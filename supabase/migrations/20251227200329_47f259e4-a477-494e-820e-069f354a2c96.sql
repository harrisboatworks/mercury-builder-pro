-- Create voice_sessions table for persisting voice chat history
CREATE TABLE public.voice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL, -- Links to chat_conversations.session_id for anonymous users
  conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  messages_exchanged INTEGER DEFAULT 0,
  context JSONB DEFAULT '{}'::jsonb, -- Motor viewed, page context, quote state
  summary TEXT, -- Brief summary of key topics discussed
  end_reason TEXT, -- 'user_ended', 'timeout', 'error', 'goodbye'
  motor_context JSONB, -- Motor they were viewing
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX idx_voice_sessions_session_id ON public.voice_sessions(session_id);
CREATE INDEX idx_voice_sessions_user_id ON public.voice_sessions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_voice_sessions_started_at ON public.voice_sessions(started_at DESC);

-- Enable RLS
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own voice sessions"
  ON public.voice_sessions FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR session_id IS NOT NULL
  );

CREATE POLICY "Users can create voice sessions"
  ON public.voice_sessions FOR INSERT
  WITH CHECK (
    ((auth.uid() IS NOT NULL AND user_id = auth.uid()) OR (user_id IS NULL))
    AND session_id IS NOT NULL
  );

CREATE POLICY "Users can update own voice sessions"
  ON public.voice_sessions FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR session_id IS NOT NULL
  );

CREATE POLICY "Admins can manage voice sessions"
  ON public.voice_sessions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_voice_sessions_updated_at
  BEFORE UPDATE ON public.voice_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();