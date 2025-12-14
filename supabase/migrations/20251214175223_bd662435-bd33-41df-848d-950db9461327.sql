-- Drop existing policies and recreate with proper anonymous session support
DROP POLICY IF EXISTS "Users can view own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can create own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can view messages from own conversations" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert messages to own conversations" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update messages in own conversations" ON public.chat_messages;

-- Recreate with improved anonymous session support
CREATE POLICY "Users can view own conversations"
ON public.chat_conversations
FOR SELECT
USING (
  (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
  (session_id IS NOT NULL)
);

CREATE POLICY "Users can create own conversations"
ON public.chat_conversations
FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL)) OR
  (session_id IS NOT NULL)
);

CREATE POLICY "Users can update own conversations"
ON public.chat_conversations
FOR UPDATE
USING (
  (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
  (session_id IS NOT NULL)
);

CREATE POLICY "Users can view messages from own conversations"
ON public.chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
    AND (
      (auth.uid() IS NOT NULL AND c.user_id = auth.uid()) OR
      (c.session_id IS NOT NULL)
    )
  )
);

CREATE POLICY "Users can insert messages to own conversations"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
    AND (
      (auth.uid() IS NOT NULL AND c.user_id = auth.uid()) OR
      (c.session_id IS NOT NULL)
    )
  )
);

CREATE POLICY "Users can update messages in own conversations"
ON public.chat_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
    AND (
      (auth.uid() IS NOT NULL AND c.user_id = auth.uid()) OR
      (c.session_id IS NOT NULL)
    )
  )
);