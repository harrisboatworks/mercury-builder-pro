import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { checkRateLimit, rateLimitedResponse } from "../_shared/rate-limit.ts";
import {
  buildCustomerKnowledgeSnapshot,
  loadCustomerKnowledge,
  type CustomerKnowledge,
} from "../_shared/customer-knowledge-context.ts";

import { composeVoiceSystemPrompt } from "../_shared/voice-system-prompt.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  // The web app sends `x-session-id` (anonymous session tracking) via the Supabase client.
  // If this header isn't explicitly allowed, the browser will block the request at the CORS layer.
  'Access-Control-Allow-Headers': [
    'authorization',
    'x-client-info',
    'apikey',
    'content-type',
    'x-session-id',
    // Supabase clients may include platform/runtime headers; allow them to avoid CORS drift.
    'x-supabase-client-platform',
    'x-supabase-client-platform-version',
    'x-supabase-client-runtime',
    'x-supabase-client-runtime-version',
  ].join(', '),
};

const ELEVENLABS_AGENT_ID = "agent_0501kdexvsfkfx8a240g7ts27dy1";

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Map page paths to human-readable descriptions
function getPageDescription(currentPage: string): string {
  const pageDescriptions: Record<string, string> = {
    '/': 'the homepage',
    '/motors': 'the motors catalog',
    '/motor/': 'a specific motor details page',
    '/quote': 'the quote builder',
    '/quote/motor': 'selecting a motor in the quote builder',
    '/quote/package': 'choosing options/packages',
    '/quote/purchase-path': 'deciding between loose motor or professional installation',
    '/quote/trade-in': 'the trade-in value section',
    '/quote/summary': 'the quote summary',
    '/quote/contact': 'the quote contact form',
    '/about': 'the About Harris Boat Works page',
    '/financing': 'the financing options page',
    '/contact': 'the contact page',
  };
  
  // Find matching page (check for partial matches for dynamic routes)
  const match = Object.entries(pageDescriptions)
    .find(([path]) => currentPage === path || (path.endsWith('/') && currentPage.startsWith(path)));
  
  return match?.[1] || currentPage;
}

// Build quote context section for the prompt
function buildQuoteContextPrompt(quoteContext: any): string {
  if (!quoteContext) return "";
  
  const parts: string[] = [];
  
  if (quoteContext.boatInfo) {
    const boat = quoteContext.boatInfo;
    const boatParts = [];
    if (boat.length) boatParts.push(`${boat.length} ft`);
    if (boat.type) boatParts.push(boat.type);
    if (boat.make) boatParts.push(boat.make);
    if (boat.currentHp) boatParts.push(`currently powered by ${boat.currentHp}HP`);
    if (boatParts.length > 0) {
      parts.push(`- Their boat: ${boatParts.join(' ')}`);
    }
  }
  
  if (quoteContext.selectedMotor) {
    parts.push(`- Motor in their quote: ${quoteContext.selectedMotor.model} (${quoteContext.selectedMotor.hp}HP)`);
  }
  
  if (quoteContext.packageSelection) {
    parts.push(`- Package selected: ${quoteContext.packageSelection}`);
  }
  
  if (quoteContext.purchasePath) {
    const pathDesc = quoteContext.purchasePath === 'loose' 
      ? 'Taking motor home (loose purchase)' 
      : 'Professional installation at the shop';
    parts.push(`- Purchase type: ${pathDesc}`);
  }
  
  if (quoteContext.tradeInValue) {
    parts.push(`- Trade-in value: $${quoteContext.tradeInValue.toLocaleString()}`);
  }
  
  if (parts.length === 0) return "";
  
  return `
## CUSTOMER'S QUOTE PROGRESS (Use naturally if relevant - don't announce it):
${parts.join('\n')}
This is background info to help you give personalized answers. Reference their boat specs or quote naturally when relevant, but don't say "I see you have a boat in your quote..." - just use the info conversationally.
`;
}

// Build returning customer context for personalization
function buildReturningCustomerPrompt(previousContext: any): string {
  if (!previousContext || previousContext.totalPreviousChats === 0) return "";
  
  const parts: string[] = [];
  parts.push(`\n## RETURNING CUSTOMER (Use naturally - don't be creepy about it):`);
  parts.push(`This customer has talked with us ${previousContext.totalPreviousChats} time(s) before.`);
  
  if (previousContext.lastVisitDate) {
    parts.push(`Last visit: ${previousContext.lastVisitDate}`);
  }
  
  if (previousContext.recentMotorsViewed?.length > 0) {
    parts.push(`Motors they've looked at: ${previousContext.recentMotorsViewed.slice(0, 3).join(', ')}`);
  }
  
  parts.push(`\nYou can greet them warmly like "Hey, good to hear from you again!" but don't announce that you remember them - just use the context naturally.`);
  
  return parts.join('\n');
}

// Build the dynamic system prompt - OPTIMIZED: no full inventory, uses tools instead
async function buildSystemPrompt(
  motorContext?: { model: string; hp: number; price?: number } | null,
  currentPage?: string | null,
  quoteContext?: any,
  previousSessionContext?: any,
  knowledge?: CustomerKnowledge,
) {
  const liveKnowledge = knowledge || await loadCustomerKnowledge(supabase);
  return composeVoiceSystemPrompt(liveKnowledge, [
    motorContext ? `Viewed motor: ${motorContext.model} (${motorContext.hp} HP). Verify current price and exact specification with the relevant tool.` : "",
    currentPage ? `Customer is on ${getPageDescription(currentPage)}.` : "",
    buildQuoteContextPrompt(quoteContext),
    buildReturningCustomerPrompt(previousSessionContext),
  ]);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse body first to check for warmup
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // No body or invalid JSON, that's fine
    }
    
    // WARMUP SHORTCUT: If this is just a warmup call, return immediately
    // This warms the Deno runtime without expensive DB/ElevenLabs calls
    if (body?.warmup === true) {
      console.log('[Token] Warmup request - returning early (function is warm)');
      return new Response(
        JSON.stringify({ ok: true, warmed: true, timestamp: Date.now() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const knowledge = await loadCustomerKnowledge(supabase);
    const knowledgeSnapshot = await buildCustomerKnowledgeSnapshot(knowledge);
    if (body?.knowledgeProbe === true) {
      return new Response(JSON.stringify({ surface: 'voice', ...knowledgeSnapshot }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cap real ElevenLabs token requests: 15 / 10 minutes per IP (warmups skipped above)
    const allowed = await checkRateLimit(req, {
      action: 'voice_token',
      maxAttempts: 15,
      windowMinutes: 10,
    });
    if (!allowed) return rateLimitedResponse(corsHeaders, 60);

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      console.error('ELEVENLABS_API_KEY is not set');
      throw new Error('ElevenLabs API key not configured');
    }

    // Extract context from body
    const motorContext = body?.motorContext || null;
    const currentPage = body?.currentPage || null;
    const quoteContext = body?.quoteContext || null;
    const previousSessionContext = body?.previousSessionContext || null;

    console.log('Building dynamic system prompt with context:', { motorContext, currentPage, hasQuoteContext: !!quoteContext, hasReturningContext: !!previousSessionContext });
    
    // Build the system prompt with real inventory data, page context, quote context, and returning customer context
    const systemPrompt = await buildSystemPrompt(motorContext, currentPage, quoteContext, previousSessionContext, knowledge);
    console.log('System prompt built, length:', systemPrompt.length);

    console.log('Requesting conversation token for agent:', ELEVENLABS_AGENT_ID);

    // Request a conversation token from ElevenLabs
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${ELEVENLABS_AGENT_ID}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Conversation token received successfully');

    // Return token AND system prompt for overrides
    return new Response(JSON.stringify({ 
      token: data.token,
      systemPrompt: systemPrompt,
      knowledgeVersion: knowledgeSnapshot.sourceVersion,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating conversation token:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
