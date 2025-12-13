import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to get current motor inventory
async function getCurrentMotorInventory() {
  try {
    const { data: motors, error } = await supabase
      .from('motor_models')
      .select('*')
      .order('horsepower', { ascending: true })
      .limit(50);
    
    if (error) {
      console.error('Error fetching motors:', error);
      return [];
    }
    
    return motors || [];
  } catch (error) {
    console.error('Error in getCurrentMotorInventory:', error);
    return [];
  }
}

// Helper function to get active promotions
async function getActivePromotions() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data: promotions, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .or(`start_date.is.null,start_date.lte.${today}`)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order('priority', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('Error fetching promotions:', error);
      return [];
    }
    
    return promotions || [];
  } catch (error) {
    console.error('Error in getActivePromotions:', error);
    return [];
  }
}

// Build compact system prompt
function buildSystemPrompt(motors: any[], promotions: any[], context: any) {
  let contextInfo = '';
  
  if (context?.currentMotor) {
    contextInfo = `\n\nCURRENT CONTEXT: User is viewing ${context.currentMotor.model} (${context.currentMotor.hp}HP) at $${context.currentMotor.price?.toLocaleString() || 'TBD'}`;
  }
  
  const motorSummary = motors.slice(0, 20).map(m => 
    `${m.model}: ${m.horsepower}HP - $${(m.sale_price || m.msrp || 0).toLocaleString()}`
  ).join('\n');
  
  const promoSummary = promotions.map(p => 
    `${p.name}: ${p.discount_percentage > 0 ? p.discount_percentage + '% off' : '$' + p.discount_fixed_amount + ' off'}${p.end_date ? ' (until ' + p.end_date + ')' : ''}`
  ).join('\n');

  return `You are Mercury Marine's expert sales assistant at Harris Boat Works, Ontario's premier Mercury dealer since 1965.

## YOUR ROLE
- Friendly, knowledgeable Mercury outboard expert
- Help customers find the right motor for their boat
- Answer technical questions about Mercury products
- Explain current promotions and financing options
- Keep responses concise but helpful (2-3 sentences ideal)
${contextInfo}

## CURRENT INVENTORY (Top Models)
${motorSummary || 'Contact us for current inventory'}

## ACTIVE PROMOTIONS
${promoSummary || 'Contact us for current offers'}

## KEY POINTS
- Always ask about boat size/type before recommending HP
- Never recommend motors exceeding boat's max HP rating
- Mention financing available (7.99-8.99% rates)
- Text 647-952-2153 for quick questions
- Located in Ontario, serving Canadian customers

Be enthusiastic about Mercury products. Keep responses conversational and under 150 words unless the question requires more detail.`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [], context = {} } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Fetch data in parallel
    const [motors, promotions] = await Promise.all([
      getCurrentMotorInventory(),
      getActivePromotions()
    ]);

    const systemPrompt = buildSystemPrompt(motors, promotions, context);

    // Build conversation context (limit to last 6 messages to save tokens)
    const recentHistory = conversationHistory.slice(-6);
    const messages = [
      { role: 'system', content: systemPrompt },
      ...recentHistory,
      { role: 'user', content: message }
    ];

    console.log('AI Chat request:', { messageLength: message.length, historyLength: recentHistory.length });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 300,
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

    console.log('AI response generated, length:', reply.length);

    return new Response(JSON.stringify({ 
      reply,
      conversationHistory: [...recentHistory, 
        { role: 'user', content: message },
        { role: 'assistant', content: reply }
      ]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chatbot-stream function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      reply: "I'm having a moment! Please try again or text us at 647-952-2153 for immediate help."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
