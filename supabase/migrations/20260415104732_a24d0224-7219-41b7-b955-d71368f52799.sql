-- ============================================
-- FIX 1: Chat messages session enumeration
-- The INSERT and UPDATE policies allow any anonymous user to write to ANY
-- conversation that has a session_id. We need the chatbot Edge Function
-- (which uses service_role) to insert messages, so we restrict client-side
-- INSERT/UPDATE to authenticated users only (matching their user_id).
-- Anonymous chat writes go through the Edge Function with service_role.
-- ============================================

-- Drop old permissive INSERT/UPDATE policies on chat_messages
DROP POLICY IF EXISTS "Users can insert messages to own conversations" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update messages in own conversations" ON public.chat_messages;

-- Recreate INSERT: authenticated users only, for their own conversations
CREATE POLICY "Authenticated users can insert messages to own conversations"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
    AND (c.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Recreate UPDATE: authenticated users only (for reactions), for their own conversations
CREATE POLICY "Authenticated users can update messages in own conversations"
ON public.chat_messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
    AND (c.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Also fix chat_conversations INSERT/UPDATE (same session_id issue)
DROP POLICY IF EXISTS "Users can create own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.chat_conversations;

-- Conversations: INSERT for authenticated users only
-- Anonymous conversations are created by the Edge Function (service_role)
CREATE POLICY "Authenticated users can create own conversations"
ON public.chat_conversations
FOR INSERT
TO authenticated
WITH CHECK (
  user_id IS NULL OR user_id = auth.uid()
);

-- Conversations: UPDATE for authenticated users only
CREATE POLICY "Authenticated users can update own conversations"
ON public.chat_conversations
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- ============================================
-- FIX 2: review_monitor_state - restrict to service_role only
-- OAuth refresh tokens should never be accessible via client queries.
-- Edge Functions already use service_role to read/write this table.
-- ============================================

DROP POLICY IF EXISTS "Admins can manage review_monitor_state" ON public.review_monitor_state;

-- Only service_role can access this table (Edge Functions)
CREATE POLICY "Service role only access to review_monitor_state"
ON public.review_monitor_state
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);