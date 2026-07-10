import { createClient } from "npm:@supabase/supabase-js@2.53.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatHistoryRequest {
  session_id: string;
  action?: 'history' | 'ensure' | 'save_message' | 'reaction' | 'clear';
  context?: Record<string, unknown>;
  conversation_id?: string;
  content?: string;
  role?: 'user' | 'assistant';
  metadata?: Record<string, unknown>;
  message_id?: string;
  reaction?: 'thumbs_up' | 'thumbs_down' | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body: ChatHistoryRequest = await req.json();
    const { session_id, action = 'history' } = body;

    // Validate session_id format (must be our secure format: chat_<64 hex chars>)
    if (!session_id || typeof session_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing session_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate format: must start with "chat_" and have 64 hex characters
    const sessionIdPattern = /^chat_[a-f0-9]{64}$/;
    if (!sessionIdPattern.test(session_id)) {
      return new Response(
        JSON.stringify({ error: 'Invalid session_id format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Use service role to bypass RLS - we manually validate session ownership
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Find conversation by session_id (this is our ownership validation)
    const { data: existingConversation, error: convError } = await adminClient
      .from('chat_conversations')
      .select('id, session_id, context, created_at, last_message_at, is_active')
      .eq('session_id', session_id)
      .eq('is_active', true)
      .order('last_message_at', { ascending: false })
      .limit(1)
      .single();

    if (convError && convError.code !== 'PGRST116') {
      console.error('Error loading conversation:', convError);
      return new Response(
        JSON.stringify({ error: 'Failed to load conversation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let conversation = existingConversation;

    if (!conversation && action === 'ensure') {
      const { data: created, error: createError } = await adminClient
        .from('chat_conversations')
        .insert({ session_id, context: body.context || {} })
        .select('id, session_id, context, created_at, last_message_at, is_active')
        .single();

      if (createError || !created) {
        console.error('Error creating conversation:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create conversation' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      conversation = created;
    }

    if (!conversation) {
      return new Response(
        JSON.stringify({ conversation: null, messages: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (body.conversation_id && body.conversation_id !== conversation.id) {
      return new Response(
        JSON.stringify({ error: 'Conversation does not belong to this session' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'save_message') {
      if (!body.content || !body.role || !['user', 'assistant'].includes(body.role)) {
        return new Response(
          JSON.stringify({ error: 'Invalid message' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const now = new Date().toISOString();
      const { data: saved, error: saveError } = await adminClient
        .from('chat_messages')
        .insert({
          conversation_id: conversation.id,
          content: body.content,
          role: body.role,
          metadata: body.metadata || {},
        })
        .select('id')
        .single();

      if (saveError || !saved) {
        console.error('Error saving message:', saveError);
        return new Response(
          JSON.stringify({ error: 'Failed to save message' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await adminClient
        .from('chat_conversations')
        .update({ last_message_at: now, updated_at: now })
        .eq('id', conversation.id);

      return new Response(
        JSON.stringify({ conversation, messages: [], message_id: saved.id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'reaction') {
      if (!body.message_id) {
        return new Response(
          JSON.stringify({ error: 'Missing message_id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const { error: reactionError } = await adminClient
        .from('chat_messages')
        .update({
          reaction: body.reaction ?? null,
          reaction_at: body.reaction ? new Date().toISOString() : null,
        })
        .eq('id', body.message_id)
        .eq('conversation_id', conversation.id);

      if (reactionError) {
        console.error('Error updating reaction:', reactionError);
        return new Response(
          JSON.stringify({ error: 'Failed to update reaction' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ conversation, messages: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'clear') {
      const { error: clearError } = await adminClient
        .from('chat_conversations')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', conversation.id);

      if (clearError) {
        console.error('Error clearing conversation:', clearError);
        return new Response(
          JSON.stringify({ error: 'Failed to clear conversation' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ conversation: null, messages: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Load messages for the validated conversation
    const { data: messages, error: msgError } = await adminClient
      .from('chat_messages')
      .select('id, content, role, created_at, reaction, metadata')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(20);

    if (msgError) {
      console.error('Error loading messages:', msgError);
      return new Response(
        JSON.stringify({ error: 'Failed to load messages' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        conversation: {
          id: conversation.id,
          context: conversation.context,
          created_at: conversation.created_at,
          last_message_at: conversation.last_message_at,
        }, 
        messages: messages || [] 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Chat history error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
