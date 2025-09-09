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
      .order('horsepower', { ascending: true });
    
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
      .order('priority', { ascending: false });
    
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

// Helper function to format motor data for AI
function formatMotorData(motors) {
  const motorsByType = {};
  
  motors.forEach(motor => {
    const type = motor.motor_type || 'Other';
    if (!motorsByType[type]) {
      motorsByType[type] = [];
    }
    motorsByType[type].push({
      model: motor.model,
      hp: motor.horsepower,
      price: motor.sale_price || motor.base_price,
      availability: motor.availability,
      year: motor.year
    });
  });
  
  let formatted = "\n## CURRENT INVENTORY (Real-time data):\n\n";
  
  Object.entries(motorsByType).forEach(([type, typeMotors]) => {
    formatted += `**${type} Motors:**\n`;
    typeMotors.slice(0, 10).forEach(motor => { // Limit to prevent prompt bloat
      const price = motor.price ? `$${motor.price.toLocaleString()}` : 'Call for pricing';
      formatted += `- ${motor.model} (${motor.hp}HP) - ${price} - ${motor.availability}\n`;
    });
    formatted += "\n";
  });
  
  return formatted;
}

// Helper function to format promotion data for AI
function formatPromotionData(promotions) {
  if (!promotions.length) return "";
  
  let formatted = "\n## CURRENT PROMOTIONS & SPECIAL OFFERS:\n\n";
  
  promotions.slice(0, 5).forEach(promo => { // Limit to prevent prompt bloat
    formatted += `**${promo.name}**\n`;
    if (promo.discount_percentage > 0) {
      formatted += `- ${promo.discount_percentage}% off qualifying motors\n`;
    }
    if (promo.discount_fixed_amount > 0) {
      formatted += `- $${promo.discount_fixed_amount} off qualifying motors\n`;
    }
    if (promo.bonus_title) {
      formatted += `- Bonus: ${promo.bonus_title}\n`;
    }
    if (promo.end_date) {
      formatted += `- Valid until: ${promo.end_date}\n`;
    }
    formatted += "\n";
  });
  
  return formatted;
}

// Build dynamic system prompt with real-time data
async function buildSystemPrompt() {
  const [motors, promotions] = await Promise.all([
    getCurrentMotorInventory(),
    getActivePromotions()
  ]);
  
  const basePrompt = `You are a helpful assistant for Harris Boat Works, a Mercury outboard motor dealership. You help customers with:

1. Mercury motor selection and compatibility
2. Boat motor pricing and quotes  
3. Technical specifications and features
4. Installation requirements
5. General boating advice

## DETAILED PRODUCT KNOWLEDGE:

### Mercury Motor Categories:
**FourStroke Series (Most Popular for Recreational)**
- 15-150HP range
- Fuel efficient, quiet operation
- Perfect for pontoons, fishing boats, small cruisers
- Price range: $3,000-$12,000

**OptiMax (High Performance 2-Stroke)**
- 75-225HP range
- Lightweight, excellent acceleration
- Great for bass boats, center consoles
- Price range: $8,000-$18,000

**Pro XS (Racing/High Performance)**
- 115-300HP range
- Maximum speed and acceleration
- Tournament-grade reliability
- Price range: $12,000-$25,000+

**SeaPro (Commercial/Heavy Duty)**
- 40-300HP range
- Built for commercial use, extended warranties
- Perfect for work boats, charter boats
- Price range: $6,000-$22,000

### Boat Compatibility Guide:
**Pontoon Boats:** 
- Best: FourStroke 60-150HP
- Consider: Twin motors for 24'+ boats
- Popular: 90HP, 115HP, 150HP

**Bass Boats:**
- Best: OptiMax or Pro XS 150-250HP
- Focus: Acceleration and top speed
- Popular: 200HP, 225HP, 250HP

**Center Console:**
- Best: OptiMax or Pro XS 150-300HP
- Consider: Twin setup for 25'+ boats
- Popular: 200HP, 250HP, 300HP

**Aluminum Fishing:**
- Best: FourStroke 40-115HP
- Focus: Fuel efficiency, reliability
- Popular: 60HP, 90HP, 115HP

### Installation Package Includes:
- Motor and mounting hardware
- Engine controls (steering, throttle, shift)
- Wiring harness and gauges
- Propeller selection and installation
- Rigging and setup
- Sea trial and delivery
- Typical installation cost: $800-$2,000

### Financing Available:
- Mercury Credit financing options
- Competitive rates for qualified buyers
- Terms up to 144 months available
- Trade-in values accepted

### Service & Warranty:
- Full Mercury factory warranty
- Certified Mercury technicians
- Genuine Mercury parts and service
- Located in Ontario, serving Canadian customers

### Common Questions & Answers:
Q: "What size motor for my 22' pontoon?"
A: "For a 22' pontoon, I'd recommend 90-115HP FourStroke. The 90HP offers great fuel economy for cruising, while 115HP gives you more power for watersports or heavier loads."

Q: "Difference between 2-stroke and 4-stroke?"
A: "4-stroke (FourStroke) motors are quieter, more fuel efficient, and have lower emissions. 2-stroke (OptiMax) motors are lighter, have better acceleration, and higher power-to-weight ratio."

Q: "How much does installation cost?"
A: "Installation typically runs $800-$2,000 depending on boat complexity. This includes controls, rigging, propeller, and setup. We always provide detailed quotes upfront."`;

  // Add real-time inventory data
  const motorData = formatMotorData(motors);
  const promotionData = formatPromotionData(promotions);
  
  const dynamicPrompt = basePrompt + motorData + promotionData + `

## CONVERSATION RULES & ADVANCED KNOWLEDGE:

### Lead Qualification Protocol:
- Always ask about boat size, type, and intended use
- Inquire about budget range to recommend appropriate motors
- Ask about current motor (if replacing) for comparison
- Determine timeline for purchase/installation

### Response Guidelines:
- Use specific pricing from inventory when available
- Always mention current promotions when relevant
- Provide 2-3 motor options when possible (good/better/best)
- Ask qualifying questions to narrow down recommendations
- Be enthusiastic but honest about product capabilities

### Escalation Triggers:
- Complex technical issues → "Let me connect you with our technical expert"
- Warranty claims → "I'll have our service manager contact you directly"
- Special financing needs → "Our finance specialist can help with that"
- Custom rigging requirements → "Our installation team will need to assess that"

### Context Awareness:
- Reference previous conversation points
- Build on customer's stated preferences
- Remember budget constraints mentioned
- Track boat details shared earlier

IMPORTANT INSTRUCTIONS:
- Use REAL pricing from inventory when available (be specific: "The 90HP FourStroke is currently $8,995")
- Always mention current promotions that apply
- Suggest getting a personalized quote for final pricing
- Mention our text line (647-952-2153) for quick questions
- If technical issues or warranty questions come up, recommend calling directly
- Be enthusiastic about Mercury products but honest about recommendations
- Ask follow-up questions to better understand their needs (boat size, usage, budget)
- Keep responses conversational and helpful, not overly technical

Location: Ontario, Canada - we serve Canadian customers with Canadian pricing and support.`;

  return dynamicPrompt;
}

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

    // Build dynamic system prompt with real-time data
    const systemPrompt = await buildSystemPrompt();

    // Build conversation context
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    console.log('Sending request to OpenAI with', messages.length, 'messages');
    console.log('Using dynamic system prompt with real-time inventory and promotions');

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