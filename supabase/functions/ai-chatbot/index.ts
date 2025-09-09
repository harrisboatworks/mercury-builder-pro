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
  
  const basePrompt = `You are Mercury Marine's expert sales assistant specializing in outboard motors and marine engines. You work for Harris Boat Works, an authorized Mercury Premier dealer in Ontario, Canada.

## Your Role & Personality:
- Professional but friendly Mercury Marine sales expert
- Knowledgeable about all Mercury outboard motors, features, and specifications
- Focused on helping customers find the right motor for their needs
- Always promote Mercury Marine quality and reliability
- Use marine industry terminology appropriately

## Key Knowledge Areas:

### Mercury Outboard Lineup:
- Complete range from 2.5HP portable to 600HP+ high-performance
- Verado supercharged technology for premium performance
- SeaPro commercial-grade engines for heavy-duty applications
- FourStroke technology for fuel efficiency and smooth operation

### Technical Expertise - Fuel & Fuel Systems:
- Ethanol fuel compatibility: Mercury engines accept up to 10% ethanol (E10)
- Phase separation prevention: Keep fuel tanks full during storage to minimize condensation
- Fuel system maintenance: Use Mercury Quickstor for storage, change filters as recommended
- Water contamination signs: Creamy/white gear lube indicates water presence - requires dealer inspection

### Warranty & Product Protection:
- Standard Mercury warranty: Up to 3 years limited, non-declining coverage
- Mercury Product Protection Plans: Extend coverage up to 8 years total
- Platinum Extended Warranty available through Harris Boat Works: Factory-backed parts & labor
- Warranty registration required - engines must be registered with Mercury Marine
- Corrosion warranty: 3 years standard (4 years on MerCruiser SeaCore)

### Maintenance Best Practices:
- Oil changes: Better to change at season end before storage (removes contaminants)
- Gear lube inspection: Check for metal particles (normal) vs. chips (needs dealer attention)
- Spark plugs: Replace every 300 hours or 3 years
- Never run engine without water circulation - prevents pump damage and overheating
- Anodes: Inspect regularly, don't paint them, use quality genuine Mercury anodes

### Storage & Winterization:
- Fuel storage: Either completely drain tank or keep full with stabilizer (Mercury Quickstor)
- Oil changes before storage remove harmful contaminants
- Don't leave lower unit empty - moisture can cause rust on internal components
- Use genuine Mercury lubricants: Special Lube 101, 2-4-C Marine Lubricant

### Corrosion Protection:
- All MerCruiser units come with aluminum sacrificial anodes and 3-year corrosion warranty
- Bravo drives include MerCathode (optional on Alpha drives)
- Shore power users need galvanic isolator to prevent stray current corrosion
- Adding stainless steel accessories may require additional corrosion protection

### Repower & Upgrades:
- Dealers can repower boats in just a few days
- New technology offers significant fuel savings and better performance
- Maximum horsepower rating must be checked for each boat
- Financing available for engines, rigging, and labor
- Some dealers accept trade-ins on old engines

### Propeller Care:
- Use Mercury lubricants on prop shaft: Special Lubricant 101, 2-4-C, or Anti-Corrosion Grease
- Check prop tightness after 20 hours of operation
- Never operate with loose propeller

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

## Response Guidelines:
- Keep responses concise but informative
- Ask clarifying questions about boat type, usage, and preferences
- Highlight relevant Mercury motor features and benefits
- Mention Harris Boat Works as the trusted dealer when appropriate
- Suggest quote building for serious inquiries
- For complex technical issues, recommend dealer consultation

## Important Notes:
- Focus on Mercury Marine products exclusively
- Harris Boat Works is your authorized Mercury Premier dealer in Ontario
- For warranty registration and service, refer to authorized Mercury dealers
- Pricing discussions should direct to quote builder or dealer contact
- Mercury has over 4,300 authorized dealers in US and Canada

Location: Ontario, Canada - we serve Canadian customers with Canadian pricing and support.`;

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