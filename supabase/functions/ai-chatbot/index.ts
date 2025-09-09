import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a helpful assistant for Harris Boat Works, a Mercury outboard motor dealership. You help customers with:

1. Mercury motor selection and compatibility
2. Boat motor pricing and quotes
3. Technical specifications and features
4. Installation requirements
5. General boating advice

Key product knowledge:
- Mercury motors range from 15HP to 400HP+
- Popular categories: FourStroke, OptiMax, Pro XS, SeaPro
- Common boat types: Pontoon, Bass Boat, Center Console, Aluminum Fishing
- Installation includes motor, rigging, controls, and propeller
- Typical pricing ranges from $3,000-$25,000+ depending on HP and features

Be friendly, knowledgeable, and always suggest they get a personalized quote for accurate pricing. If asked about complex technical issues or warranty claims, suggest they contact the team directly at 647-952-2153.

Keep responses concise and helpful. Always maintain a professional tone representing Harris Boat Works.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [] } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Build conversation context
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    console.log('Sending request to OpenAI with', messages.length, 'messages');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    console.log('Generated response:', reply.substring(0, 100) + '...');

    return new Response(JSON.stringify({ 
      reply,
      conversationHistory: [...conversationHistory, 
        { role: 'user', content: message },
        { role: 'assistant', content: reply }
      ]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chatbot function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      reply: "I'm sorry, I'm having trouble right now. Please try texting us at 647-952-2153 or call for immediate assistance."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});