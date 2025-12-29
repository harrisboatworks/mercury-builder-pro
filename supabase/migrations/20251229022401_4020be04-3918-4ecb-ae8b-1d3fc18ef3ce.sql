-- Add voice_summary column to chat_conversations for voice-text context handoff
ALTER TABLE public.chat_conversations 
ADD COLUMN IF NOT EXISTS voice_summary text;

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_chat_conversations_session_id_active 
ON public.chat_conversations(session_id, is_active) 
WHERE is_active = true;

-- Add comment explaining the column
COMMENT ON COLUMN public.chat_conversations.voice_summary IS 'Summary of recent voice sessions for the same session_id, used for voice-text context handoff';