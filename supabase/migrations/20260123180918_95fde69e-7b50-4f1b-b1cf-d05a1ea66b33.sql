-- Remove overly permissive anonymous chat SELECT policies
DROP POLICY IF EXISTS "Users can view own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can view messages from own conversations" ON public.chat_messages;
DROP POLICY IF EXISTS "Authenticated users can view own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Authenticated users can view messages from own conversations" ON public.chat_messages;

-- Recreate with authenticated-only SELECT
-- Anonymous users can no longer SELECT directly - they must use the chat-history Edge Function
CREATE POLICY "Authenticated users can view own conversations"
ON public.chat_conversations FOR SELECT 
TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view messages from own conversations"
ON public.chat_messages FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM chat_conversations c
    WHERE c.id = chat_messages.conversation_id
    AND (c.user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  )
);