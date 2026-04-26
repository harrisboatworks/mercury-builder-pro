
-- 1. Lock down schema_docs to admin-only reads
DROP POLICY IF EXISTS "schema_docs_public_read" ON public.schema_docs;

CREATE POLICY "Admins can read schema_docs"
ON public.schema_docs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2. Remove permissive public SELECT on chat_messages
-- (Anonymous reads now go exclusively through the chat-history edge function,
--  which validates session ownership server-side using the service role.)
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update reactions on messages" ON public.chat_messages;

-- Re-create reaction updates restricted to authenticated owners only.
-- Anonymous reaction updates (rare) would need to go through an edge function.
CREATE POLICY "Authenticated users can update reactions on own messages"
ON public.chat_messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
      AND (c.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
      AND (c.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
  )
);

-- 3. Tighten anonymous INSERTs on chat_conversations: must be a true anon row
DROP POLICY IF EXISTS "Users can create conversations" ON public.chat_conversations;

CREATE POLICY "Anonymous users can create session-bound conversations"
ON public.chat_conversations
FOR INSERT
TO anon
WITH CHECK (
  user_id IS NULL
  AND session_id IS NOT NULL
  AND length(session_id) BETWEEN 8 AND 128
);

-- 4. Tighten anonymous INSERTs on chat_messages: only into anon-owned conversations
DROP POLICY IF EXISTS "Users can insert messages in own conversations" ON public.chat_messages;

CREATE POLICY "Anonymous users can insert messages in session conversations"
ON public.chat_messages
FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
      AND c.user_id IS NULL
      AND c.session_id IS NOT NULL
  )
);

-- 5. Fix function search_path
CREATE OR REPLACE FUNCTION public.touch_schema_docs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
