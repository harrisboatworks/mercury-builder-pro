import { createClient } from "npm:@supabase/supabase-js@2.53.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatHistoryRequest {
  session_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body: ChatHistoryRequest = await req.json();
    const { session_id } = body;

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
    const { data: conversation, error: convError } = await adminClient
      .from('chat_conversations')
      .select('id, session_id, context, created_at, last_message_at, is_active')
      .eq('session_id', session_id)
      .eq('is_active', true)
      .order('last_message_at', { ascending: false })
      .limit(1)
      .single();

    if (convError || !conversation) {
      // No conversation found for this session_id - not an error, just no history
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
