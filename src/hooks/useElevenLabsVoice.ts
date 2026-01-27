import { useState, useCallback, useRef, useEffect } from 'react';
import { useConversation } from '@elevenlabs/react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { VoiceDiagnostics } from '@/lib/RealtimeVoice';
import { dispatchVoiceNavigation, navigateToMotorsWithFilter, type MotorForQuote } from '@/lib/voiceNavigation';
import { dispatchVoiceActivity, showTradeInEstimate, showCallbackConfirmation, showMotorComparison, showCurrentDeals, showLeadCaptureCard } from '@/lib/voiceActivityFeed';
import { useVoiceSessionPersistence } from './useVoiceSessionPersistence';
import { formatMotorsForVoice } from '@/lib/visibleMotorsStore';

// Timeout configuration (in milliseconds)
// Single graceful close after silence - triggers BEFORE ElevenLabs' turn timeout
const IDLE_TIMEOUT_MS = 18000; // 18 seconds - ensures graceful close happens before ElevenLabs prompts
const GRACEFUL_CLOSE_MESSAGE = "[SYSTEM: Natural pause in conversation. Say ONE brief, friendly sign-off like 'I'll let you browse - just tap the mic if you need me!' then stop talking. No questions, just a warm goodbye.]";

// Thinking watchdog - prompt agent to acknowledge if no response within this time after user speaks
// Increased to 2000ms to avoid interrupting legitimate tool operations
const THINKING_WATCHDOG_MS = 2000; // 2s (gives tools time to complete before nudging)
const THINKING_NUDGE_MESSAGE = "[SYSTEM: You haven't started responding yet. Give a VERY quick acknowledgement like 'Got it—' or 'Yep—' or 'Right—' - just 1-2 words - then continue with your answer. Do NOT say 'let me check' or mention inventory.]";

// Tool chain timeout - abort if tool operations take too long
const TOOL_CHAIN_TIMEOUT_MS = 5000; // 5 seconds max for tool chains

// Pre-warm edge functions to eliminate cold start on first question
// Export so VoiceButton can call it on hover/visibility
export async function prewarmEdgeFunctions() {
  console.log('[Voice] Pre-warming edge functions...');
  const startTime = Date.now();

  // Fire all warmup requests in parallel
  const warmups = [
    // Warm inventory lookup with a no-op ping (keeps this cheap + fast)
    supabase.functions
      .invoke('voice-inventory-lookup', { body: { action: 'ping', params: {} } })
      .then(() => console.log(`[Voice] Inventory function warmed in ${Date.now() - startTime}ms`))
      .catch(() => {}),

    // Warm conversation token endpoint (now short-circuits on warmup)
    supabase.functions
      .invoke('elevenlabs-conversation-token', { body: { warmup: true } })
      .then(() => console.log(`[Voice] Token function warmed in ${Date.now() - startTime}ms`))
      .catch(() => {}),
  ];

  return Promise.all(warmups);
}

// Turn timing for performance tracking
export interface TurnTiming {
  turnStart: number | null;        // When user started speaking (transcript received)
  transcriptAt: number | null;     // When transcript was processed
  toolStartAt: number | null;      // When tool call started  
  toolEndAt: number | null;        // When tool call finished
  agentStartAt: number | null;     // When agent started speaking
}

// Computed phase for UI display
export type VoicePhase = 'idle' | 'listening' | 'thinking' | 'searching' | 'speaking';

interface VoiceState {
  isConnected: boolean;
  isConnecting: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  isSearching: boolean;
  searchingMessage: string | null;
  isThinking: boolean;
  thinkingMessage: string | null;
  transcript: string;
  error: string | null;
  permissionState: 'granted' | 'denied' | 'prompt' | null;
  showPermissionDialog: boolean;
  showNoMicrophoneDialog: boolean;
  showAudioIssuePrompt: boolean;
  diagnostics: VoiceDiagnostics | null;
  textOnlyMode: boolean;
  audioFailCount: number;
  
  turnTiming: TurnTiming;
  currentPhase: VoicePhase;
}

export interface QuoteContext {
  boatInfo?: {
    type: string | null;
    length: string | null;
    make: string | null;
    currentHp: number | null;
  } | null;
  selectedMotor?: { model: string; hp: number } | null;
  packageSelection?: string | null;
  purchasePath?: string | null;
  tradeInValue?: number | null;
}

export interface UseElevenLabsVoiceOptions {
  onTranscriptComplete?: (transcript: string) => void;
  motorContext?: { model: string; hp: number; price?: number } | null;
  currentPage?: string;
  quoteContext?: QuoteContext | null;
}


// Client tool handler for inventory lookups
async function handleInventoryLookup(action: string, params: Record<string, unknown>): Promise<string> {
  console.log(`[ClientTool] ${action}`, params);
  
  try {
    const { data, error } = await supabase.functions.invoke('voice-inventory-lookup', {
      body: { action, params }
    });

    if (error) {
      console.error('[ClientTool] Error:', error);
      return JSON.stringify({ error: 'Failed to check inventory. Please try again.' });
    }

    console.log('[ClientTool] Result:', data);
    return JSON.stringify(data?.result || { error: 'No data returned' });
  } catch (err) {
    console.error('[ClientTool] Exception:', err);
    return JSON.stringify({ error: 'Inventory lookup failed' });
  }
}

// Client tool handler for adding motor to quote
async function handleAddMotorToQuote(
  params: { motor_model?: string; use_current_motor?: boolean },
  currentMotor: { model: string; hp: number; price?: number } | null
): Promise<string> {
  console.log('[ClientTool] add_motor_to_quote', params, 'currentMotor:', currentMotor);
  
  try {
    // If using current motor being viewed
    if (params.use_current_motor && currentMotor) {
      // Lookup full motor data from inventory
      const { data, error } = await supabase.functions.invoke('voice-inventory-lookup', {
        body: { action: 'get_motor_for_quote', params: { model: currentMotor.model } }
      });
      
      if (error) {
        console.error('[ClientTool] Motor lookup error:', error);
        return JSON.stringify({ error: 'Failed to find motor details.' });
      }
      
      if (data?.result?.motor) {
        const motor: MotorForQuote = data.result.motor;
        dispatchVoiceNavigation({ type: 'add_motor_to_quote', payload: { motor } });
        return JSON.stringify({ 
          success: true, 
          message: `Added ${motor.model} to your quote!`,
          motor: { model: motor.model, horsepower: motor.horsepower, price: motor.msrp }
        });
      }
      return JSON.stringify({ error: `Couldn't find motor: ${currentMotor.model}` });
    }
    
    // If specific motor requested by name
    if (params.motor_model) {
      const { data, error } = await supabase.functions.invoke('voice-inventory-lookup', {
        body: { action: 'get_motor_for_quote', params: { model: params.motor_model } }
      });
      
      if (error) {
        console.error('[ClientTool] Motor lookup error:', error);
        return JSON.stringify({ error: 'Failed to find motor details.' });
      }
      
      if (data?.result?.motor) {
        const motor: MotorForQuote = data.result.motor;
        dispatchVoiceNavigation({ type: 'add_motor_to_quote', payload: { motor } });
        return JSON.stringify({ 
          success: true, 
          message: `Added ${motor.model} to your quote!`,
          motor: { model: motor.model, horsepower: motor.horsepower, price: motor.msrp }
        });
      }
      return JSON.stringify({ error: `Couldn't find motor: ${params.motor_model}` });
    }
    
    return JSON.stringify({ 
      error: 'Please specify a motor or be viewing one to add it.',
      hint: 'Say "add this motor" when viewing a motor, or specify a model like "add the 115 ELPT"'
    });
  } catch (err) {
    console.error('[ClientTool] Add to quote exception:', err);
    return JSON.stringify({ error: 'Failed to add motor to quote' });
  }
}

// Client tool handler for sending follow-up SMS
async function handleSendFollowUpSMS(params: {
  customer_name: string;
  customer_phone: string;
  message_type: 'quote_interest' | 'inventory_alert' | 'service_reminder' | 'general';
  motor_model?: string;
  custom_note?: string;
}): Promise<string> {
  console.log('[ClientTool] send_follow_up_sms', params);
  
  try {
    const { data, error } = await supabase.functions.invoke('voice-send-follow-up', {
      body: params
    });

    if (error) {
      console.error('[ClientTool] SMS Error:', error);
      return JSON.stringify({ error: 'Failed to send text message. Please try again.' });
    }

    console.log('[ClientTool] SMS Result:', data);
    return JSON.stringify(data || { error: 'No response from SMS service' });
  } catch (err) {
    console.error('[ClientTool] SMS Exception:', err);
    return JSON.stringify({ error: 'Text message failed to send' });
  }
}

// Helper to trigger text chat search for complex queries
function triggerTextChatSearch(query: string) {
  console.log('[Voice→Chat] Dispatching search event:', query);
  window.dispatchEvent(new CustomEvent('voice-trigger-text-search', { 
    detail: { query } 
  }));
}

// Client tool handler for real-time parts inventory via Locally API
async function handleLocallyInventoryLookup(params: {
  part_number?: string;
  upc?: string;
  search_query?: string;
}): Promise<string> {
  console.log('[ClientTool] locally_inventory_lookup:', params);
  
  try {
    const { data, error } = await supabase.functions.invoke('locally-inventory', {
      body: { 
        query: params.search_query,
        upc: params.upc,
        part_number: params.part_number
      }
    });

    if (error) {
      console.error('[ClientTool] Locally API error:', error);
      return "I'm having trouble checking our parts inventory right now. Let me check with our parts department and get back to you.";
    }

    console.log('[ClientTool] Locally result:', data);
    
    if (data?.inventory?.products?.length > 0) {
      const product = data.inventory.products[0];
      const inStock = product.in_stock || product.quantity > 0;
      const price = product.price ? `$${product.price.toFixed(2)}` : '';
      const qty = product.quantity ? ` (${product.quantity} in stock)` : '';
      
      if (inStock) {
        return `Yes! We have ${product.name || params.search_query} in stock${qty}${price ? ` at ${price}` : ''}. Would you like me to add it to a quote or check for more details?`;
      } else {
        return `${product.name || params.search_query} is currently out of stock. I can check on availability or help you find an alternative. Would you like me to have our parts team follow up with you?`;
      }
    }
    
    // No specific product found - suggest text chat for deeper search
    return "I couldn't find that specific part in our system. Let me search for more details - check the chat on your screen in just a moment.";
  } catch (err) {
    console.error('[ClientTool] Locally exception:', err);
    return "I'm having trouble checking our inventory right now. Our parts team can help you find what you need.";
  }
}

// Helper to detect spec category for Perplexity
function detectSpecCategory(query: string): string {
  const q = query.toLowerCase();
  if (/part\s*number|part\s*#|filter|plug|impeller|gasket|seal/.test(q)) return 'parts';
  if (/weight|dimension|fuel|displacement|bore|stroke|rpm|compression/.test(q)) return 'specs';
  if (/warranty|coverage|extended|protection/.test(q)) return 'warranty';
  if (/maintenance|service|interval|oil\s*change|winteriz|flush/.test(q)) return 'maintenance';
  if (/problem|issue|won't|doesn't|error|alarm|overheat|stall/.test(q)) return 'troubleshooting';
  return 'general';
}

// Client tool handler for Perplexity spec verification
// Uses hardcoded answers for common questions, falls back to Perplexity for unknown ones
async function handleVerifySpecs(params: {
  query: string;
  category?: 'specs' | 'parts' | 'warranty' | 'maintenance' | 'troubleshooting';
  motor_context?: string;
}): Promise<string> {
  console.log('[ClientTool] verify_specs called with:', params);
  
  const query = params.query.toLowerCase();
  const motor = params.motor_context || '';
  
  // Common part number responses based on query patterns
  
  // === OIL & FILTERS ===
  if (query.includes('oil filter')) {
    return "For Mercury FourStroke outboards, the most common oil filter part number is 35-877769K01. This fits most 25 to 115 horsepower models. I'd recommend confirming with our parts department or checking the Mercury Marine website for your specific engine serial number.";
  }
  
  if (query.includes('fuel filter') || query.includes('gas filter')) {
    return "Mercury outboards use inline fuel filters. The common part numbers are 35-879885Q for the in-line filter and 35-8M0122423 for the water separating fuel filter. For larger motors, the 35-802893Q01 is often used. Check your model's specifications for the correct filter.";
  }
  
  if (query.includes('lower unit') && (query.includes('oil') || query.includes('lube') || query.includes('gear'))) {
    return "Mercury recommends using Quicksilver High Performance Gear Lube, part number 92-858064Q01, for lower unit service. Most outboards need about 21 to 26 ounces depending on the size. The lower unit should be serviced at least once a year or every 100 hours.";
  }
  
  if (query.includes('oil') && (query.includes('type') || query.includes('recommend') || query.includes('use'))) {
    return "Mercury recommends using Mercury or Quicksilver 4-Stroke Marine Engine Oil, 25W-40 synthetic blend for most FourStroke outboards. Always check your owner's manual for the specific oil capacity and type for your model.";
  }
  
  if (query.includes('oil capacity') || query.includes('how much oil')) {
    return "Oil capacity varies by model. For example, 40 to 60 horsepower models typically hold about 3 quarts, while 75 to 115 horsepower hold around 4 to 5 quarts. Check your owner's manual or dipstick for the exact capacity on your motor.";
  }
  
  // === IGNITION & ELECTRICAL ===
  if (query.includes('spark plug')) {
    return "Mercury FourStroke outboards typically use NGK spark plugs. The common part numbers are IZFR6F11 for most models or BKR6E for some applications. Check your owner's manual or give our parts team a call to confirm the right plugs for your motor.";
  }
  
  if (query.includes('battery') && (query.includes('size') || query.includes('type') || query.includes('recommend'))) {
    return "Most Mercury outboards require a Group 24 or Group 27 marine starting battery with at least 625 cold cranking amps. For larger motors, a Group 31 battery may be recommended. Always use a marine-rated battery designed for the marine environment.";
  }
  
  if (query.includes('fuse') || query.includes('circuit breaker')) {
    return "Mercury outboards use various fuses and circuit breakers depending on the model. Common fuse ratings are 20 amp for accessories and 30 amp for the main circuit. Check your owner's manual for the fuse location and correct amperage for your specific motor.";
  }
  
  // === COOLING & WATER SYSTEM ===
  if (query.includes('impeller') || query.includes('water pump')) {
    return "Water pump impellers should be replaced every 2 to 3 years or 300 hours, whichever comes first. Common impeller kit part numbers are 47-43026Q06 for smaller motors and 47-8M0100526 for larger FourStrokes. This is a critical maintenance item to prevent overheating.";
  }
  
  if (query.includes('thermostat')) {
    return "Mercury outboard thermostats typically open at 140 to 143 degrees Fahrenheit. Common part numbers include 885599001 for many FourStroke models. If your motor is running hot or cold, the thermostat should be checked. Our service team can diagnose temperature issues.";
  }
  
  if (query.includes('overheat') || query.includes('running hot') || query.includes('temperature')) {
    return "If your motor is overheating, first check that water is flowing from the tell-tale. Common causes include a worn impeller, clogged water intake, or thermostat issues. Reduce speed immediately if overheating and have it inspected. Don't run an overheating motor as it can cause serious damage.";
  }
  
  // === CORROSION PROTECTION ===
  if (query.includes('anode') || query.includes('zinc') || query.includes('sacrificial')) {
    return "Anodes protect your motor from corrosion and should be replaced when 50% worn. Common anode part numbers are 97-826134Q for the trim tab anode and 97-42121Q02 for transom bracket anodes. In saltwater, check anodes every 3 to 4 months. In freshwater, annually is usually sufficient.";
  }
  
  if (query.includes('corrosion') || query.includes('salt')) {
    return "To prevent corrosion, flush your motor with fresh water after every saltwater use. Use Mercury Corrosion Guard spray on electrical connections and check anodes regularly. For storage, apply fogging oil and use a quality engine cover.";
  }
  
  // === PROPELLER ===
  if (query.includes('propeller') || query.includes('prop')) {
    return "Propeller selection depends on your boat, motor, and how you use it. Mercury offers various pitches and diameters. A general rule: lower pitch for better acceleration and pulling power, higher pitch for top speed. I'd recommend speaking with our service team who can help you find the perfect prop for your setup.";
  }
  
  if (query.includes('prop hub') || query.includes('hub kit')) {
    return "Mercury Flo-Torq hub kits absorb shock and protect your lower unit. The part number depends on your motor size - common ones are 835257Q1 for smaller motors and 835271Q1 for larger ones. If your prop is slipping, you may need a new hub kit.";
  }
  
  // === FUEL SYSTEM ===
  if (query.includes('fuel line') || query.includes('fuel hose')) {
    return "Mercury recommends using EPA-compliant fuel lines designed for marine use. Common sizes are 5/16 inch for smaller motors and 3/8 inch for larger ones. Replace fuel lines if they become stiff, cracked, or swollen. Quicksilver fuel line is part number 32-8M0062928.";
  }
  
  if (query.includes('fuel pump') || query.includes('primer')) {
    return "Electronic fuel injection motors have high-pressure fuel pumps that are part of the vapor separator tank assembly. If you're having fuel delivery issues, our service team can diagnose whether it's the pump, filter, or another component.";
  }
  
  if (query.includes('ethanol') || query.includes('e10') || query.includes('fuel stabilizer')) {
    return "Mercury recommends using fresh, 87 octane fuel with no more than 10% ethanol. Always use a fuel stabilizer like Quicksilver Quickstor when storing the motor for more than a few weeks. Avoid E15 or higher ethanol blends as they can damage fuel system components.";
  }
  
  // === MAINTENANCE INTERVALS ===
  if (query.includes('service') && (query.includes('interval') || query.includes('schedule') || query.includes('when'))) {
    return "Mercury recommends a 100-hour or annual service, whichever comes first. This includes oil and filter change, gear lube, spark plugs, and general inspection. Water pump impeller replacement is recommended every 300 hours or 3 years.";
  }
  
  if (query.includes('break in') || query.includes('break-in') || query.includes('new motor')) {
    return "For the first 10 hours, vary your speed and avoid full throttle for extended periods. At 20 hours, you can operate normally but avoid prolonged wide-open throttle. The first oil change should be done at 20 hours to remove any break-in particles.";
  }
  
  if (query.includes('winterize') || query.includes('winter storage') || query.includes('store')) {
    return "To winterize your Mercury outboard: run fuel stabilizer through the system, fog the engine with Quicksilver Storage Seal, change the gear lube, and disconnect the battery. Store in an upright position if possible. Our service team can do a full winterization for you.";
  }
  
  // === WARRANTY & COVERAGE ===
  if (query.includes('warranty')) {
    return "Mercury outboards come with a 3-year factory warranty that covers defects in materials and workmanship. Extended warranty options are available for additional coverage up to 6 years. Our team can provide full warranty details for your specific motor.";
  }
  
  if (query.includes('recall') || query.includes('service bulletin')) {
    return "Mercury issues service bulletins and recalls as needed for safety or reliability improvements. To check if your motor has any outstanding recalls, contact our service department with your engine serial number and we can look it up for you.";
  }
  
  // === TROUBLESHOOTING ===
  if (query.includes('won\'t start') || query.includes('no start') || query.includes('starting problem')) {
    return "Common no-start causes include dead battery, faulty kill switch or lanyard, fuel issues, or a flooded engine. First check that the kill switch lanyard is attached, the battery has charge, and there's fresh fuel. If it still won't start, our service team can diagnose the issue.";
  }
  
  if (query.includes('stall') || query.includes('dies') || query.includes('cuts out')) {
    return "Stalling can be caused by fuel issues, dirty spark plugs, water in fuel, or electrical problems. Check your fuel filter and water separator first. If the problem persists, our service team can run diagnostics to identify the cause.";
  }
  
  if (query.includes('vibration') || query.includes('shaking') || query.includes('rough')) {
    return "Excessive vibration often indicates a damaged prop, worn motor mounts, or engine issues. Check your propeller for dings, bends, or fishing line wrapped around the hub. If the prop looks good, have our service team inspect the motor mounts and internal components.";
  }
  
  if (query.includes('smoke') || query.includes('smoking')) {
    return "Blue or white smoke usually indicates oil burning, which can be normal during break-in or cold starts. Black smoke suggests running rich. Excessive smoke after warm-up should be checked by our service team to prevent engine damage.";
  }
  
  // === CONTROLS & RIGGING ===
  if (query.includes('control cable') || query.includes('throttle cable') || query.includes('shift cable')) {
    return "Mercury control cables come in various lengths. Measure your existing cable or the distance from your helm to the motor. Our parts team can help you select the correct cable length and type for your setup. Cables should be replaced if they feel stiff or sticky.";
  }
  
  if (query.includes('steering') && (query.includes('fluid') || query.includes('oil'))) {
    return "Mercury hydraulic steering systems use Mercury or Quicksilver Power Steering Fluid. Check the level in the helm pump reservoir periodically. If you notice hard steering or leaks, have the system inspected. Low fluid can damage the pump.";
  }
  
  // === WEIGHT ===
  if (query.includes('weight') || query.includes('how heavy') || query.includes('weigh') || query.includes('pounds') || query.includes('lbs')) {
    // Extract HP from query or motor context
    const hpMatch = query.match(/(\d+)/);
    const hp = hpMatch ? parseInt(hpMatch[1]) : (motor.match(/(\d+)/) ? parseInt(motor.match(/(\d+)/)![1]) : 0);
    
    if (hp > 0) {
      // Approximate weights for Mercury FourStroke outboards (based on real specs)
      let weight: number;
      let description: string;
      
      if (hp <= 6) {
        weight = Math.round(hp * 5 + 45); // 2.5HP ~57lbs, 6HP ~75lbs
        description = `Around ${weight} pounds - super light and easy to carry. Great for car-topping.`;
      } else if (hp <= 15) {
        weight = Math.round(hp * 5.5 + 35); // 9.9HP ~90lbs, 15HP ~118lbs
        description = `About ${weight} pounds. One person can manage it, but two makes it easier.`;
      } else if (hp <= 30) {
        weight = Math.round(hp * 5 + 100); // 20HP ~200lbs, 30HP ~250lbs
        description = `Roughly ${weight} pounds. Definitely a two-person lift.`;
      } else if (hp <= 60) {
        weight = Math.round(hp * 4.5 + 150); // 40HP ~330lbs, 60HP ~420lbs
        description = `Around ${weight} pounds. You'll want a hoist or extra hands for this one.`;
      } else if (hp <= 115) {
        weight = Math.round(hp * 3.8 + 180); // 75HP ~465lbs, 115HP ~617lbs
        description = `Approximately ${weight} pounds. These need proper lifting equipment.`;
      } else {
        weight = Math.round(hp * 3 + 280); // 150HP ~730lbs, 300HP ~1180lbs
        description = `These big boys run about ${weight} pounds. Definitely need a hoist.`;
      }
      
      const motorRef = motor || `${hp} horsepower motor`;
      return `The ${motorRef} weighs ${description}`;
    }
    
    return "Motor weight varies by horsepower. What HP are you looking at? For example, a 20 HP runs about 200 pounds, and a 115 HP is around 400 pounds.";
  }

  // === DEFAULT FALLBACK - CALL PERPLEXITY ===
  // No hardcoded answer found - search Perplexity for technical info
  console.log('[verify_specs] No hardcoded answer, calling Perplexity...');
  
  try {
    // Race against 7s timeout (ElevenLabs has ~10s limit)
    const perplexityPromise = supabase.functions.invoke('voice-perplexity-lookup', {
      body: {
        query: params.query,
        category: params.category || detectSpecCategory(query),
        motor_context: motor || undefined
      }
    });
    
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('timeout')), 7000)
    );
    
    const { data, error } = await Promise.race([perplexityPromise, timeoutPromise]) as { data: any; error: any };
    
    if (error) {
      console.error('[verify_specs] Perplexity error:', error);
      throw error;
    }
    
    if (data?.success && data?.answer) {
      console.log('[verify_specs] Perplexity success:', data.answer.substring(0, 100));
      return data.answer;
    }
    
    throw new Error('No answer from Perplexity');
    
  } catch (err) {
    console.warn('[verify_specs] Perplexity failed/timeout:', err);
    
    // Graceful fallback - offer human assistance
    return "I couldn't pull up that specific information right now. " +
           "Our service team would know for sure - want me to have someone give you a call?";
  }
}

// Client tool handler for non-Mercury accessories/boat parts via catalogue search
async function handleAccessoriesCatalogueSearch(params: {
  query: string;
  auto_search?: boolean;
}): Promise<string> {
  console.log('[ClientTool] search_accessories_catalogue:', params);
  
  const query = params.query.toLowerCase();
  
  // Determine catalogue section for better context
  let section = 'general accessories';
  if (/trolling|minn kota|motorguide/.test(query)) section = 'trolling motors';
  else if (/fish finder|depth|gps|chartplotter|garmin|lowrance|humminbird/.test(query)) section = 'electronics';
  else if (/rod holder|tackle|livewell|fishing/.test(query)) section = 'fishing accessories';
  else if (/trailer|hitch|winch|tire|bearing|coupler/.test(query)) section = 'trailer parts';
  else if (/life jacket|pfd|flare|fire extinguisher|safety/.test(query)) section = 'safety equipment';
  else if (/seat|pedestal|captain chair|cushion/.test(query)) section = 'seating';
  else if (/anchor|dock|mooring|cleat|rope|fender/.test(query)) section = 'anchoring and docking';
  else if (/bilge|pump|switch|fuse|wire|light|led/.test(query)) section = 'electrical';
  else if (/fuel tank|fuel line|vent|primer/.test(query)) section = 'fuel systems';
  else if (/cover|bimini|canvas|enclosure/.test(query)) section = 'covers and canvas';
  
  // DON'T auto-open chat for simple accessory questions - voice can handle most
  // Only open chat if user explicitly asks for links or product details
  if (params.auto_search === true) {
    // User explicitly asked to see something in chat
    triggerTextChatSearch(`accessories: ${params.query}`);
    
    return `Great question! I'm searching our marine accessories catalogue for ${params.query} right now. ` +
           `Check the chat on your screen - you'll see results with links and pricing from our ${section} section in just a moment.`;
  }
  
  // If explicit permission needed
  return `I can search our accessories catalogue for ${params.query}. ` +
         `Would you like me to look that up? You'll see the results in the chat with links to browse.`;
}

// Client tool handler for setting purchase path
function handleSetPurchasePath(params: { 
  purchase_type: string 
}): string {
  console.log('[ClientTool] set_purchase_path', params);
  
  // Normalize the input to our two valid values
  let normalizedPath: 'loose' | 'installed';
  const type = (params.purchase_type || '').toLowerCase();
  
  if (['loose', 'take_home', 'pickup', 'myself', 'diy', 'self'].some(t => type.includes(t))) {
    normalizedPath = 'loose';
  } else if (['install', 'professional', 'full', 'dealer', 'rigging', 'rig'].some(t => type.includes(t))) {
    normalizedPath = 'installed';
  } else {
    return JSON.stringify({ 
      error: 'Please clarify: would you like to take the motor home (loose motor) or have professional installation?' 
    });
  }
  
  dispatchVoiceNavigation({ type: 'set_purchase_path', payload: { path: normalizedPath } });
  
  const message = normalizedPath === 'loose' 
    ? "I've set you up for a loose motor - you can take it home and install it yourself or at your preferred shop."
    : "I've set you up for professional installation - we'll handle everything including rigging and sea trial.";
    
  return JSON.stringify({ success: true, path: normalizedPath, message });
}

// Client tool handler for scheduling callbacks
async function handleScheduleCallback(params: {
  customer_name: string;
  customer_phone: string;
  preferred_time?: string;
  notes?: string;
  motor_interest?: string;
  motor_context?: { model: string; hp: number } | null;
}): Promise<string> {
  console.log('[ClientTool] schedule_callback', params);
  
  try {
    const { data, error } = await supabase.functions.invoke('voice-schedule-callback', {
      body: params
    });
    
    if (error) {
      console.error('[ClientTool] Schedule callback error:', error);
      return JSON.stringify({ error: 'Failed to schedule callback. Please try again.' });
    }
    
    // Dispatch activity card to show confirmation in chat
    if (data?.success) {
      showCallbackConfirmation({
        customerName: params.customer_name,
        preferredTime: data.scheduledDescription || params.preferred_time || 'soon',
        phone: params.customer_phone,
        motorInterest: params.motor_interest,
      });
    }
    
    return JSON.stringify(data);
  } catch (err) {
    console.error('[ClientTool] Schedule callback exception:', err);
    return JSON.stringify({ error: 'Unable to schedule callback right now.' });
  }
}

// Client tool handler for creating reminders
async function handleCreateReminder(params: {
  customer_phone: string;
  customer_name?: string;
  reminder_type: 'motor' | 'promotion' | 'service' | 'custom';
  when: string;
  reminder_content?: Record<string, unknown>;
  custom_note?: string;
}): Promise<string> {
  console.log('[ClientTool] set_reminder', params);
  
  try {
    const { data, error } = await supabase.functions.invoke('voice-create-reminder', {
      body: params
    });
    
    if (error) {
      console.error('[ClientTool] Create reminder error:', error);
      return JSON.stringify({ error: 'Failed to create reminder. Please try again.' });
    }
    
    return JSON.stringify(data);
  } catch (err) {
    console.error('[ClientTool] Create reminder exception:', err);
    return JSON.stringify({ error: 'Unable to set reminder right now.' });
  }
}

// Client tool handler for service cost estimates
function handleServiceEstimate(params: {
  service_type: string;
  motor_hp?: number;
  motor_model?: string;
}): string {
  console.log('[ClientTool] estimate_service_cost', params);
  
  const serviceType = (params.service_type || '').toLowerCase().replace(/\s+/g, '_');
  const hp = params.motor_hp || 100; // Default to medium HP
  
  // Service type mapping
  const serviceMap: Record<string, { minPrice: number; maxPrice: number; includes: string }> = {
    '100_hour': { minPrice: 400, maxPrice: 600, includes: 'oil change, filter, gear lube, spark plugs, and full inspection' },
    'annual': { minPrice: 400, maxPrice: 600, includes: 'oil change, filter, gear lube, spark plugs, and full inspection' },
    'winterization': { minPrice: 250, maxPrice: 400, includes: 'fuel stabilizer, fogging oil, gear lube, and anti-freeze flush' },
    'winterize': { minPrice: 250, maxPrice: 400, includes: 'fuel stabilizer, fogging oil, gear lube, and anti-freeze flush' },
    'spring': { minPrice: 300, maxPrice: 450, includes: 'de-winterization, fresh fuel, battery service, and test run' },
    'commissioning': { minPrice: 300, maxPrice: 450, includes: 'de-winterization, fresh fuel, battery service, and test run' },
    'impeller': { minPrice: 350, maxPrice: 500, includes: 'impeller kit, gaskets, and test run' },
    'water_pump': { minPrice: 350, maxPrice: 500, includes: 'impeller kit, gaskets, and test run' },
    'lower_unit': { minPrice: 150, maxPrice: 250, includes: 'gear lube drain and refill, seal inspection' },
    'gear_lube': { minPrice: 150, maxPrice: 250, includes: 'gear lube drain and refill, seal inspection' },
    'prop': { minPrice: 75, maxPrice: 125, includes: 'prop removal, hub inspection, and installation' },
  };
  
  // Adjust for HP
  const hpMultiplier = hp <= 30 ? 0.7 : hp <= 115 ? 1.0 : hp <= 300 ? 1.3 : 1.6;
  
  // Find matching service
  let serviceKey = Object.keys(serviceMap).find(key => serviceType.includes(key));
  if (!serviceKey) {
    // Try partial match
    if (serviceType.includes('oil') || serviceType.includes('100')) serviceKey = '100_hour';
    else if (serviceType.includes('winter')) serviceKey = 'winterization';
    else if (serviceType.includes('spring') || serviceType.includes('commission')) serviceKey = 'spring';
    else if (serviceType.includes('impeller') || serviceType.includes('water') || serviceType.includes('pump')) serviceKey = 'impeller';
    else if (serviceType.includes('lower') || serviceType.includes('gear')) serviceKey = 'lower_unit';
    else if (serviceType.includes('prop')) serviceKey = 'prop';
  }
  
  if (!serviceKey) {
    return JSON.stringify({
      error: "I don't have pricing for that specific service. Our service team can give you an exact quote."
    });
  }
  
  const service = serviceMap[serviceKey];
  const minPrice = Math.round(service.minPrice * hpMultiplier / 25) * 25;
  const maxPrice = Math.round(service.maxPrice * hpMultiplier / 25) * 25;
  
  const motorRef = params.motor_model || (params.motor_hp ? `${params.motor_hp} horsepower motor` : 'your motor');
  
  return JSON.stringify({
    success: true,
    estimate: { minPrice, maxPrice },
    message: `For ${serviceKey.replace(/_/g, ' ')} on ${motorRef}, you're looking at about $${minPrice} to $${maxPrice}. That includes ${service.includes}. Want me to have our service team reach out to schedule?`
  });
}

// Client tool handler for trade-in estimates
function handleTradeInEstimate(params: {
  brand: string;
  year: number;
  horsepower: number;
  condition?: 'excellent' | 'good' | 'fair' | 'rough';
}): string {
  console.log('[ClientTool] estimate_trade_value', params);
  
  const currentYear = new Date().getFullYear();
  const age = currentYear - params.year;
  const condition = params.condition || 'good';
  
  // Brand multipliers
  const brandMultipliers: Record<string, number> = {
    mercury: 1.0, yamaha: 0.95, honda: 0.90, suzuki: 0.85,
    evinrude: 0.70, johnson: 0.60, tohatsu: 0.75
  };
  const brandMult = brandMultipliers[params.brand.toLowerCase()] || 0.65;
  
  // Condition multipliers
  const condMult = { excellent: 1.15, good: 1.0, fair: 0.80, rough: 0.55 }[condition];
  
  // Base value by HP
  let baseValue: number;
  if (params.horsepower <= 10) baseValue = params.horsepower * 400;
  else if (params.horsepower <= 30) baseValue = params.horsepower * 350;
  else if (params.horsepower <= 75) baseValue = params.horsepower * 250;
  else if (params.horsepower <= 150) baseValue = params.horsepower * 180;
  else baseValue = params.horsepower * 140;
  
  // Depreciation
  let depreciation: number;
  if (age <= 1) depreciation = 0.80;
  else if (age <= 3) depreciation = 0.65;
  else if (age <= 5) depreciation = 0.50;
  else if (age <= 10) depreciation = 0.35;
  else depreciation = 0.25;
  
  const estimatedValue = baseValue * brandMult * condMult * depreciation;
  const lowValue = Math.round(estimatedValue * 0.85 / 100) * 100;
  const highValue = Math.round(estimatedValue * 1.15 / 100) * 100;
  const midValue = Math.round((lowValue + highValue) / 2 / 100) * 100;
  
  // Show activity card in chat with "Apply to Quote" button
  showTradeInEstimate({
    brand: params.brand,
    year: params.year,
    horsepower: params.horsepower,
    condition,
    estimatedValue: Math.max(midValue, 350),
    valueRange: { low: Math.max(lowValue, 200), high: Math.max(highValue, 500) },
  });
  
  return JSON.stringify({
    success: true,
    estimate: { lowValue: Math.max(lowValue, 200), highValue: Math.max(highValue, 500) },
    message: `A ${params.year} ${params.brand} ${params.horsepower} horsepower in ${condition} condition typically trades around $${Math.max(lowValue, 200).toLocaleString()} to $${Math.max(highValue, 500).toLocaleString()}. I've added a card to your chat where you can apply that to your quote with one tap.`
  });
}

// Client tool handler for motor recommendations
async function handleRecommendMotor(params: {
  boat_length?: number;
  boat_type?: 'aluminum' | 'fiberglass' | 'pontoon' | 'inflatable';
  usage?: 'fishing' | 'cruising' | 'watersports' | 'commercial';
  priority?: 'speed' | 'fuel_economy' | 'price' | 'reliability';
  max_budget?: number;
}): Promise<string> {
  console.log('[ClientTool] recommend_motor', params);
  
  // Calculate recommended HP range
  const boatLength = params.boat_length || 16;
  const boatType = params.boat_type || 'aluminum';
  
  // HP multiplier by boat type
  const typeMultipliers: Record<string, number> = {
    inflatable: 2, aluminum: 3, fiberglass: 4, pontoon: 4.5
  };
  const mult = typeMultipliers[boatType] || 3;
  
  const minHp = Math.round(boatLength * mult * 0.6);
  const maxHp = Math.round(boatLength * mult * 1.2);
  
  try {
    const { data, error } = await supabase.functions.invoke('voice-inventory-lookup', {
      body: { 
        action: 'check_inventory', 
        params: { 
          min_hp: minHp, 
          max_hp: maxHp, 
          in_stock: true 
        } 
      }
    });
    
    if (error || !data?.result?.found) {
      return JSON.stringify({
        success: true,
        recommendedRange: { minHp, maxHp },
        message: `For a ${boatLength}-foot ${boatType}, you'd want something in the ${minHp} to ${maxHp} horsepower range. Let me check what we have in stock...`
      });
    }
    
    const motors = data.result.motors.slice(0, 3);
    const motorList = motors.map((m: { model: string; horsepower: number; price: number }) => 
      `${m.model} at $${m.price?.toLocaleString() || 'call for price'}`
    ).join(', ');
    
    return JSON.stringify({
      success: true,
      recommendedRange: { minHp, maxHp },
      topPicks: motors,
      message: `For a ${boatLength}-foot ${boatType}, you'd do great with ${minHp} to ${maxHp} horsepower. I'd look at the ${motorList}. ${params.usage === 'fishing' ? 'The FourStrokes are super quiet for fishing.' : ''} Want me to compare any of these?`
    });
  } catch (err) {
    return JSON.stringify({
      success: true,
      recommendedRange: { minHp, maxHp },
      message: `For a ${boatLength}-foot ${boatType}, you'd want ${minHp} to ${maxHp} horsepower. I can show you what we have in that range.`
    });
  }
}

// Client tool handler for motor comparison
async function handleCompareMotors(params: {
  motor1: string;
  motor2: string;
}): Promise<string> {
  console.log('[ClientTool] compare_motors', params);
  
  try {
    // Fetch both motors
    const [result1, result2] = await Promise.all([
      supabase.functions.invoke('voice-inventory-lookup', {
        body: { action: 'get_motor_price', params: { model: params.motor1 } }
      }),
      supabase.functions.invoke('voice-inventory-lookup', {
        body: { action: 'get_motor_price', params: { model: params.motor2 } }
      })
    ]);
    
    const motor1 = result1.data?.result;
    const motor2 = result2.data?.result;
    
    if (!motor1?.found || !motor2?.found) {
      return JSON.stringify({
        error: "I couldn't find both of those motors. Could you be more specific about the models?"
      });
    }
    
    const hpDiff = Math.abs(motor1.horsepower - motor2.horsepower);
    const priceDiff = Math.abs((motor1.msrp || 0) - (motor2.msrp || 0));
    
    let comparison = `Comparing the ${motor1.model} and ${motor2.model}: `;
    
    if (hpDiff > 0) {
      const moreHp = motor1.horsepower > motor2.horsepower ? motor1.model : motor2.model;
      comparison += `The ${moreHp} has ${hpDiff} more horsepower. `;
    }
    
    if (priceDiff > 0) {
      const cheaper = (motor1.msrp || 0) < (motor2.msrp || 0) ? motor1.model : motor2.model;
      comparison += `The ${cheaper} is about $${priceDiff.toLocaleString()} less. `;
    }
    
    // Add recommendations based on differences
    if (motor1.horsepower > motor2.horsepower) {
      comparison += `Go with the ${motor1.model} if you want more power for bigger water or heavier loads.`;
    } else if (motor2.horsepower > motor1.horsepower) {
      comparison += `Go with the ${motor2.model} if you want more power for bigger water or heavier loads.`;
    } else {
      comparison += `They're pretty similar - comes down to preference and budget.`;
    }
    
    return JSON.stringify({
      success: true,
      motor1: { model: motor1.model, hp: motor1.horsepower, price: motor1.msrp },
      motor2: { model: motor2.model, hp: motor2.horsepower, price: motor2.msrp },
      message: comparison
    });
  } catch (err) {
    console.error('[ClientTool] Compare motors error:', err);
    return JSON.stringify({ error: 'Unable to compare those motors right now.' });
  }
}

// Client tool handler for sending motor photos via SMS
async function handleSendMotorPhotos(params: {
  customer_phone: string;
  motor_model?: string;
}, currentMotor: { model: string; hp: number } | null): Promise<string> {
  console.log('[ClientTool] send_motor_photos', params);
  
  const motorModel = params.motor_model || currentMotor?.model;
  if (!motorModel) {
    return JSON.stringify({ error: "Which motor would you like photos of?" });
  }
  
  const cleanPhone = (params.customer_phone || '').replace(/\D/g, '');
  if (cleanPhone.length < 10) {
    return JSON.stringify({ error: "I'll need your phone number to send those photos." });
  }
  
  try {
    const { data, error } = await supabase.functions.invoke('voice-send-follow-up', {
      body: {
        customer_phone: cleanPhone,
        customer_name: 'Voice Customer',
        message_type: 'general',
        motor_model: motorModel,
        custom_note: `Here's the link to view photos and details of the ${motorModel}:`
      }
    });
    
    if (error) {
      return JSON.stringify({ error: 'Unable to send photos right now.' });
    }
    
    return JSON.stringify({
      success: true,
      message: `I've texted you a link to see all the photos and specs for the ${motorModel}. Check your phone!`
    });
  } catch (err) {
    return JSON.stringify({ error: 'Unable to send photos right now.' });
  }
}

// Client tool handler for getting current deals - includes full "Choose One" promo details
async function handleCheckCurrentDeals(params: {
  motor_model?: string;
  hp_range?: string;
}): Promise<string> {
  console.log('[ClientTool] check_current_deals', params);
  
  try {
    const { data, error } = await supabase
      .from('promotions')
      .select('name, discount_percentage, discount_fixed_amount, bonus_title, bonus_description, warranty_extra_years, end_date, promo_options')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(5);
    
    if (error || !data || data.length === 0) {
      return JSON.stringify({
        success: true,
        message: "I don't see any specific promotions running right now, but we're always competitive on pricing. Want me to build you a quote?"
      });
    }
    
    const mainPromo = data[0];
    let message = `We've got the ${mainPromo.name} running right now!`;
    
    // Include warranty bonus
    if (mainPromo.warranty_extra_years) {
      message += ` That's ${3 + mainPromo.warranty_extra_years} years of factory coverage!`;
    }
    
    // Include Choose One options if available
    // promo_options is an object with an "options" array, not an array itself
    const promoOptionsData = mainPromo.promo_options as any;
    const promoOptions = promoOptionsData?.options;
    if (promoOptions && Array.isArray(promoOptions) && promoOptions.length > 0) {
      message += ` Plus you get to choose one bonus: `;
      const optionTitles = promoOptions.map((o: any) => o.title || 'bonus option').filter(Boolean);
      message += optionTitles.join(', or ');
      message += `. Want me to explain any of these options, or show you the promotions page?`;
    } else if (mainPromo.bonus_title) {
      message += ` Plus ${mainPromo.bonus_title}.`;
    }
    
    if (mainPromo.end_date) {
      const endDate = new Date(mainPromo.end_date);
      const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysLeft > 0 && daysLeft <= 30) {
        message += ` Ends in ${daysLeft} days!`;
      }
    }
    
    return JSON.stringify({
      success: true,
      promotions: data,
      hasChooseOne: !!(promoOptions && promoOptions.length > 0),
      chooseOneOptions: promoOptions || [],
      message
    });
  } catch (err) {
    return JSON.stringify({ error: 'Unable to check promotions right now.' });
  }
}

export function useElevenLabsVoice(options: UseElevenLabsVoiceOptions = {}) {
  const { onTranscriptComplete } = options;
  const { toast } = useToast();
  
  // Voice session persistence
  const voiceSession = useVoiceSessionPersistence();
  
  // Initial turn timing
  const initialTurnTiming: TurnTiming = {
    turnStart: null,
    transcriptAt: null,
    toolStartAt: null,
    toolEndAt: null,
    agentStartAt: null,
  };

  const [state, setState] = useState<VoiceState>({
    isConnected: false,
    isConnecting: false,
    isSpeaking: false,
    isListening: false,
    isSearching: false,
    searchingMessage: null,
    isThinking: false,
    thinkingMessage: null,
    transcript: '',
    error: null,
    permissionState: null,
    showPermissionDialog: false,
    showNoMicrophoneDialog: false,
    showAudioIssuePrompt: false,
    diagnostics: null,
    textOnlyMode: false,
    audioFailCount: 0,
    turnTiming: initialTurnTiming,
    currentPhase: 'idle',
  });

  const transcriptRef = useRef<string>('');
  
  // Ref to allow client tools to update state
  const setStateRef = useRef(setState);
  setStateRef.current = setState;
  
  // Inactivity timeout ref (single timer for graceful close)
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const conversationRef = useRef<ReturnType<typeof useConversation> | null>(null);
  
  // Thinking watchdog refs - detect when agent is slow to respond
  const thinkingWatchdogRef = useRef<NodeJS.Timeout | null>(null);
  const agentRespondedRef = useRef<boolean>(false);
  const thinkingNudgeSentRef = useRef<boolean>(false);
  
  // Tool chain tracking refs - prevent redundant operations and fallback conflicts
  const activeToolsRef = useRef<Set<string>>(new Set());
  const lastToolChainStartRef = useRef<number>(0);
  const lastNavigationRef = useRef<{ hp: number; timestamp: number } | null>(null);
  
  // Wrap a tool handler to show searching state and play instant feedback
  // ENHANCED: Now tracks active tools to prevent navigate-first fallback conflicts
  const withSearchingFeedback = useCallback(<T extends unknown[], R>(
    toolName: string,
    handler: (...args: T) => Promise<R> | R,
    searchMessage: string = 'Checking...'
  ) => {
    return async (...args: T): Promise<R> => {
      const startTime = performance.now();
      
      // ========== TOOL CHAIN TRACKING ==========
      // Track this tool as active to prevent navigate-first fallback from firing
      activeToolsRef.current.add(toolName);
      if (activeToolsRef.current.size === 1) {
        lastToolChainStartRef.current = Date.now();
        console.log('%c🔗 TOOL CHAIN STARTED', 'background: #9C27B0; color: white; padding: 2px 6px; border-radius: 4px;');
      }
      console.log(`%c📍 Active tools: [${Array.from(activeToolsRef.current).join(', ')}]`, 'color: #9C27B0;');
      // ==========================================
      
      // ========== ENHANCED TOOL CALL LOGGING ==========
      console.log('%c🔧 ELEVENLABS CLIENT TOOL TRIGGERED', 'background: #4CAF50; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px;');
      console.log(`%c Tool: ${toolName}`, 'color: #4CAF50; font-weight: bold; font-size: 12px;');
      console.log('%c Parameters:', 'color: #2196F3; font-weight: bold;', args);
      console.log('%c Timestamp:', 'color: #9E9E9E;', new Date().toISOString());
      // ================================================
      
      // Set searching state and record tool start time
      setStateRef.current(prev => ({ 
        ...prev, 
        isSearching: true, 
        searchingMessage: searchMessage,
        currentPhase: 'searching',
        turnTiming: {
          ...prev.turnTiming,
          toolStartAt: startTime,
        },
      }));
      
      try {
        const result = await handler(...args);
        const endTime = performance.now();
        
        // ========== ENHANCED TOOL COMPLETION LOGGING ==========
        console.log('%c✅ TOOL COMPLETED', 'background: #2196F3; color: white; font-size: 12px; padding: 2px 6px; border-radius: 4px;');
        console.log(`%c Tool: ${toolName} | Duration: ${(endTime - startTime).toFixed(0)}ms`, 'color: #2196F3;');
        console.log('%c Result:', 'color: #4CAF50;', result);
        // ======================================================
        
        return result;
      } catch (error) {
        // ========== ENHANCED ERROR LOGGING ==========
        console.log('%c❌ TOOL ERROR', 'background: #f44336; color: white; font-size: 12px; padding: 2px 6px; border-radius: 4px;');
        console.log(`%c Tool: ${toolName}`, 'color: #f44336;');
        console.error('Error details:', error);
        // ============================================
        throw error;
      } finally {
        // Remove from active tools set
        activeToolsRef.current.delete(toolName);
        console.log(`%c📍 Tool ${toolName} done. Remaining: [${Array.from(activeToolsRef.current).join(', ') || 'none'}]`, 'color: #9C27B0;');
        
        if (activeToolsRef.current.size === 0) {
          console.log('%c🔗 TOOL CHAIN COMPLETE', 'background: #4CAF50; color: white; padding: 2px 6px; border-radius: 4px;');
        }
        
        // Clear searching state and record tool end time
        const toolEndTime = performance.now();
        setStateRef.current(prev => ({ 
          ...prev, 
          isSearching: false, 
          searchingMessage: null,
          currentPhase: prev.isSpeaking ? 'speaking' : 'thinking',
          turnTiming: {
            ...prev.turnTiming,
            toolEndAt: toolEndTime,
          },
        }));
      }
    };
  }, []);

  // Clear inactivity timer
  const clearInactivityTimers = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  // State ref for checking isSpeaking in triggerGracefulClose
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  
  // Handle graceful goodbye and auto-disconnect after idle timeout
  const triggerGracefulClose = useCallback(async () => {
    console.log('[Voice] Triggering graceful close after idle timeout');
    
    // If agent is currently speaking, wait for it to finish before disconnecting
    if (stateRef.current.isSpeaking) {
      console.log('[Voice] Agent is speaking - waiting 3s before retry');
      await new Promise(resolve => setTimeout(resolve, 3000));
      // Check again - if still speaking, give up and disconnect anyway
      if (stateRef.current.isSpeaking) {
        console.log('[Voice] Agent still speaking after wait - disconnecting anyway');
      }
    }
    
    // Send graceful close message to agent
    if (conversationRef.current?.status === 'connected') {
      try {
        conversationRef.current.sendUserMessage(GRACEFUL_CLOSE_MESSAGE);
        // Give agent 3.5 seconds to say its brief goodbye
        await new Promise(resolve => setTimeout(resolve, 3500));
      } catch (e) {
        console.log('[Voice] Could not send graceful close message:', e);
      }
    }
    
    // End session with goodbye reason
    await voiceSession.endSession('goodbye');
    
    // Disconnect
    if (conversationRef.current) {
      await conversationRef.current.endSession();
    }
    
    setState({
      isConnected: false,
      isConnecting: false,
      isSpeaking: false,
      isListening: false,
      isSearching: false,
      searchingMessage: null,
      isThinking: false,
      thinkingMessage: null,
      transcript: '',
      error: null,
      permissionState: null,
      showPermissionDialog: false,
      showNoMicrophoneDialog: false,
      showAudioIssuePrompt: false,
      diagnostics: null,
      textOnlyMode: false,
      audioFailCount: 0,
      turnTiming: initialTurnTiming,
      currentPhase: 'idle',
    });
  }, [voiceSession]);

  // Start or reset the inactivity timer - single graceful close after 25s silence
  const resetInactivityTimer = useCallback(() => {
    clearInactivityTimers();
    
    // Only set timer if connected
    if (conversationRef.current?.status !== 'connected') return;
    
    // Set single idle timeout (25s) - no warning, just graceful close
    inactivityTimerRef.current = setTimeout(() => {
      console.log('[Voice] Idle timeout reached - triggering graceful close');
      triggerGracefulClose();
    }, IDLE_TIMEOUT_MS);
  }, [clearInactivityTimers, triggerGracefulClose]);

  // Clear the thinking watchdog timer
  const clearThinkingWatchdog = useCallback(() => {
    if (thinkingWatchdogRef.current) {
      clearTimeout(thinkingWatchdogRef.current);
      thinkingWatchdogRef.current = null;
    }
  }, []);

  // Start the thinking watchdog after user finishes speaking
  // If agent doesn't respond within THINKING_WATCHDOG_MS, nudge it to acknowledge
  const startThinkingWatchdog = useCallback(() => {
    // Clear any existing watchdog
    clearThinkingWatchdog();
    
    // Reset flags
    agentRespondedRef.current = false;
    thinkingNudgeSentRef.current = false;
    
    console.log('[Voice] Starting thinking watchdog timer...');
    
    thinkingWatchdogRef.current = setTimeout(() => {
      // Only nudge if agent hasn't responded and we haven't already nudged
      if (!agentRespondedRef.current && !thinkingNudgeSentRef.current) {
        console.log('[Voice] Thinking watchdog triggered - agent slow to respond, sending nudge');
        thinkingNudgeSentRef.current = true;
        
        if (conversationRef.current?.status === 'connected') {
          try {
            conversationRef.current.sendUserMessage(THINKING_NUDGE_MESSAGE);
          } catch (e) {
            console.log('[Voice] Could not send thinking nudge:', e);
          }
        }
      }
    }, THINKING_WATCHDOG_MS);
  }, [clearThinkingWatchdog]);

  // Mark that the agent has responded (either started speaking or sent a response)
  const markAgentResponded = useCallback(() => {
    if (!agentRespondedRef.current) {
      const now = performance.now();
      console.log('[Voice] Agent responded - clearing thinking watchdog');
      agentRespondedRef.current = true;
      clearThinkingWatchdog();

      // Clear "thinking" UI immediately and record agent start time
      setStateRef.current(prev => ({
        ...prev,
        isThinking: false,
        thinkingMessage: null,
        currentPhase: 'speaking',
        turnTiming: {
          ...prev.turnTiming,
          agentStartAt: now,
        },
      }));
    }
  }, [clearThinkingWatchdog]);

  // Helper to create ElevenLabs-compatible diagnostics
  const createDiagnostics = (connected: boolean, error: string | null = null): VoiceDiagnostics => ({
    micPermission: true,
    tokenReceived: connected,
    sessionCreatedReceived: connected,
    sdpExchanged: connected,
    webrtcState: connected ? 'connected' : 'disconnected',
    dataChannelOpen: connected,
    remoteTrackReceived: connected,
    audioPlaying: connected,
    inboundAudioBytes: 0,
    lastError: error,
    micInputLevel: 0,
    micPeakLevel: 0,
    audioContextState: connected ? 'running' : 'suspended',
    webAudioRouted: connected,
    audioElementPlaying: connected,
    outputAudioLevel: 0,
  });

  // ElevenLabs useConversation hook with client tools for real-time inventory access
  const conversation = useConversation({
    onConnect: () => {
      console.log('ElevenLabs: Connected to agent');
      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        isListening: true,
        diagnostics: createDiagnostics(true),
        currentPhase: 'listening',
        turnTiming: initialTurnTiming,
      }));
      // Start inactivity timer when connected
      resetInactivityTimer();
      toast({
        title: "Voice chat connected",
        description: "Harris is here — say something!",
      });
    },
    onDisconnect: () => {
      console.log('ElevenLabs: Disconnected from agent');
      clearInactivityTimers();
      clearThinkingWatchdog();
      setState(prev => ({
        ...prev,
        isConnected: false,
        isListening: false,
        isSpeaking: false,
        currentPhase: 'idle',
      }));
    },
    onMessage: (message: unknown) => {
      // ========== ENHANCED MESSAGE LOGGING ==========
      const msg = message as Record<string, unknown>;
      const msgType = msg.type as string || 'unknown';
      
      // Highlight tool-related messages specially
      if (msgType.includes('tool') || msgType.includes('function') || msgType.includes('client_tool')) {
        console.log('%c🔧 ELEVENLABS TOOL MESSAGE RECEIVED', 'background: #FF9800; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px;');
        console.log('%c Full message:', 'color: #FF9800; font-weight: bold;', message);
      } else {
        // Skip noisy VAD score messages for cleaner logs
        if (msgType !== 'vad_score') {
          console.log(`[ElevenLabs] ${msgType}:`, message);
        }
      }
      // ===============================================
      
      // IMPORTANT: Only reset inactivity timer on MEANINGFUL user activity
      // NOT on every message (VAD, keepalives, etc.) - that prevents auto-close from ever triggering
      
      // Handle transcript events - support multiple message formats from ElevenLabs
      let userTranscript: string | undefined;
      
      if (msg.type === 'user_transcript') {
        // Format 1: Standard ElevenLabs transcript event
        const event = msg.user_transcription_event as Record<string, unknown> | undefined;
        userTranscript = event?.user_transcript as string | undefined;
      } else if (msg.source === 'user' && msg.message) {
        // Format 2: Alternative format with source/message
        userTranscript = msg.message as string;
      } else if (msg.type === 'transcript' && typeof msg.text === 'string') {
        // Format 3: Simple transcript type with text field
        userTranscript = msg.text;
      } else if (typeof msg.transcript === 'string') {
        // Format 4: Direct transcript field
        userTranscript = msg.transcript;
      } else if (msg.transcript_event && typeof (msg.transcript_event as Record<string, unknown>).transcript === 'string') {
        // Format 5: Nested transcript_event object
        userTranscript = (msg.transcript_event as Record<string, unknown>).transcript as string;
      }
      
      // Debug: log all message types to help identify formats
      if (msgType !== 'vad_score' && !userTranscript && msg.type !== 'agent_response' && msg.type !== 'response.audio.delta') {
        console.log('[Transcript Debug] Unhandled message format:', msgType, msg);
      }
      
      if (userTranscript) {
          const now = performance.now();
          console.log('%c🎤 User said:', 'color: #9C27B0; font-weight: bold;', userTranscript);
          transcriptRef.current = userTranscript;
          
          // Reset inactivity timer ONLY when user actually speaks (not on every message)
          resetInactivityTimer();

          // === NAVIGATE-FIRST SAFETY NET (AGGRESSIVE) ===
          // Detect HP intent and auto-navigate BEFORE the agent responds
          // This ensures the screen changes even if the agent forgets to call navigate_to_motors
          
          // Pattern 1: Numeric HP like "20 HP", "20hp", "20 horsepower"
          const hpMatch = userTranscript.match(/(\d+(?:\.\d+)?)\s*(?:hp|horse\s*power|horsepower)/i);
          // Pattern 2: Just a number followed by optional HP context in same sentence
          const looseHpMatch = userTranscript.match(/\b(2\.5|3\.5|4|5|6|8|9\.9|10|15|20|25|30|40|50|60|75|90|100|115|150|175|200|225|250|300)\b/);
          
          // Expanded spoken HP patterns for voice recognition
          const spokenHpPatterns: Record<string, number> = {
            'twenty hp': 20, 'twenty horsepower': 20, '20 hp': 20, '20hp': 20,
            'twenty-five hp': 25, 'twenty five hp': 25, 'twenty-five': 25,
            'thirty hp': 30, 'thirty': 30, 'forty hp': 40, 'forty': 40,
            'fifty hp': 50, 'fifty': 50, 'sixty hp': 60, 'sixty': 60,
            'seventy-five hp': 75, 'seventy five hp': 75, 'seventy five': 75,
            'hundred hp': 100, 'one hundred': 100,
            'one-fifteen hp': 115, 'one fifteen hp': 115, 'one fifteen': 115, 'one-fifteen': 115,
            'one-fifty hp': 150, 'one fifty hp': 150, 'one fifty': 150, 'one-fifty': 150,
            'twenny': 20, 'twenny hp': 20, // Common mispronunciation
          };
          
          let detectedHp: number | null = null;
          
          // Priority 1: Exact numeric match with HP suffix
          if (hpMatch) {
            detectedHp = parseFloat(hpMatch[1]);
            console.log('[Navigate-First] Detected HP via numeric pattern:', detectedHp);
          } 
          // Priority 2: Spoken word patterns
          else {
            const lowerTranscript = userTranscript.toLowerCase();
            for (const [pattern, hp] of Object.entries(spokenHpPatterns)) {
              if (lowerTranscript.includes(pattern)) {
                detectedHp = hp;
                console.log('[Navigate-First] Detected HP via spoken pattern:', pattern, '→', hp);
                break;
              }
            }
          }
          
          // Priority 3: Loose number in motor-related context (more aggressive)
          if (!detectedHp && looseHpMatch) {
            const looseHp = parseFloat(looseHpMatch[1]);
            // Only use loose match if there's motor context in the sentence
            const hasMotorContext = /motor|outboard|have|got|stock|show|looking|need|do you|any|sell|carry|available|want|interest|hp|horsepower/i.test(userTranscript);
            if (hasMotorContext) {
              detectedHp = looseHp;
              console.log('[Navigate-First] Detected HP via loose match with motor context:', looseHp);
            }
          }
          
          // AGGRESSIVE: Auto-navigate on ANY HP detection in a motor-related conversation
          // Voice conversation implies motor shopping context, so be liberal with navigation
          if (detectedHp) {
            // === GUARD: Skip if tools are already actively processing ===
            if (activeToolsRef.current.size > 0) {
              console.log('%c⏸️ NAVIGATE-FIRST SKIPPED: Tools already active', 'background: #FF9800; color: white; padding: 2px 6px; border-radius: 4px;');
              console.log(`[Navigate-First] Active tools: [${Array.from(activeToolsRef.current).join(', ')}]`);
              return; // Don't interfere with active tool chain
            }
            
            console.log(`%c🚀 NAVIGATE-FIRST: Detected ${detectedHp}HP - auto-navigating NOW`, 'background: #4CAF50; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px;');
            console.log('[Navigate-First] Full transcript:', userTranscript);
            navigateToMotorsWithFilter({ horsepower: detectedHp });
            
            // FALLBACK: After navigation + filter, automatically send visible motors to agent
            // This ensures agent gets data even if it doesn't call get_visible_motors tool
            setTimeout(() => {
              // === TOOL CHAIN TIMEOUT CHECK ===
              // If tools have been running for > 5 seconds, abort and provide fallback
              if (activeToolsRef.current.size > 0 && 
                  Date.now() - lastToolChainStartRef.current > TOOL_CHAIN_TIMEOUT_MS) {
                console.warn('%c⏱️ TOOL CHAIN TIMEOUT - clearing and providing fallback', 'background: #f44336; color: white; padding: 2px 6px; border-radius: 4px;');
                activeToolsRef.current.clear();
                // Send recovery context to agent
                if (conversationRef.current?.status === 'connected') {
                  try {
                    const recoveryMsg = "[SYSTEM: Tool lookup is taking long. Just describe what you know about this HP range based on what's showing on screen, and offer to answer specific questions.]";
                    conversationRef.current.sendUserMessage(recoveryMsg);
                    console.log('[Fallback] Sent recovery message to agent');
                  } catch (e) {
                    console.warn('[Fallback] Could not send recovery message:', e);
                  }
                }
                return; // Don't send another context update
              }
              
              // Skip if tools are now active (agent started its own tool calls)
              if (activeToolsRef.current.size > 0) {
                console.log('%c⏸️ FALLBACK SKIPPED: Tools became active', 'background: #FF9800; color: white; padding: 2px 6px; border-radius: 4px;');
                return;
              }
              
              const summary = formatMotorsForVoice(8);
              console.log('%c📤 FALLBACK: Auto-sending visible motors to agent', 'background: #2196F3; color: white; padding: 2px 6px; border-radius: 4px;');
              console.log('[Fallback] Visible motors summary:', summary);
              
              // Send as contextual update so agent knows what's on screen
              if (conversationRef.current?.status === 'connected') {
                try {
                  const contextMsg = `[SCREEN UPDATE] Now showing ${detectedHp}HP motors: ${summary}. Briefly describe these options (count, configurations, price range) and ask about their preferences.`;
                  if (typeof (conversationRef.current as any).sendContextualUpdate === 'function') {
                    (conversationRef.current as any).sendContextualUpdate(contextMsg);
                  } else {
                    conversationRef.current.sendUserMessage(contextMsg);
                  }
                  console.log('[Fallback] Context sent to agent successfully');
                } catch (e) {
                  console.warn('[Fallback] Could not send context to agent:', e);
                }
              }
            }, 600); // Wait for navigation + filter + store update
          }
          // === END NAVIGATE-FIRST SAFETY NET ===

          // === SPEC QUESTION GUARDRAIL ===
          // Detect questions about the CURRENT motor's specs (electric start, tiller, etc.)
          // and inject the decoded answer so the agent doesn't fumble
          const lowerTranscript = userTranscript.toLowerCase();
          const isSpecQuestion = /electric\s*start|pull\s*start|manual\s*start|e-?start|tiller|remote|shaft|long\s*shaft|short\s*shaft|power\s*trim|does\s*(this|it)\s*have|is\s*(this|it)\s*(a|an)?/i.test(lowerTranscript);
          
          if (isSpecQuestion && options.motorContext?.model) {
            const model = options.motorContext.model.toUpperCase();
            console.log('%c🔍 SPEC QUESTION DETECTED - injecting decoded answer', 'background: #9C27B0; color: white; padding: 2px 6px; border-radius: 4px;');
            console.log('[Spec Guard] Question:', userTranscript, '| Motor:', model);
            
            // Decode the model suffix
            const hasElectricStart = /\bE[SLFX]|\bELPT|\bEXLPT|\bEL\b/i.test(model) && !/\bM[SLFHX]/i.test(model);
            const hasManualStart = /\bM[SLFHX]|\bMH\b|\bMLH\b/i.test(model);
            const hasTiller = /H\b|TILLER/i.test(model);
            const hasLongShaft = /\bL\b|LONG/i.test(model) && !/\bXL\b/i.test(model);
            const hasXLShaft = /\bXL\b|EXTRA.?LONG/i.test(model);
            const hasPowerTrim = /PT\b|POWER.?TRIM/i.test(model);
            
            // Build the decoded specs string
            const specs: string[] = [];
            if (hasElectricStart) specs.push('ELECTRIC start');
            if (hasManualStart) specs.push('MANUAL/pull start (NO electric)');
            if (hasTiller) specs.push('TILLER handle');
            if (!hasTiller && !hasManualStart) specs.push('REMOTE steering');
            if (hasLongShaft) specs.push('LONG shaft (20")');
            if (hasXLShaft) specs.push('XL shaft (25")');
            if (hasPowerTrim) specs.push('POWER TRIM');
            
            const specsString = specs.join(', ') || 'standard configuration';
            
            // Inject contextual update to agent with the answer
            setTimeout(() => {
              if (conversationRef.current?.status === 'connected') {
                try {
                  const specContext = `[SPEC ANSWER - USE THIS] The ${options.motorContext?.model} has: ${specsString}. Answer the customer directly using this info. Do NOT say "let me check" - the answer is right here. Keep it to 1 sentence.`;
                  if (typeof (conversationRef.current as any).sendContextualUpdate === 'function') {
                    (conversationRef.current as any).sendContextualUpdate(specContext);
                  }
                  console.log('[Spec Guard] Injected spec answer:', specContext);
                } catch (e) {
                  console.warn('[Spec Guard] Could not inject spec answer:', e);
                }
              }
            }, 100); // Inject quickly before agent starts thinking
          }
          // === END SPEC QUESTION GUARDRAIL ===

          // === FAREWELL DETECTION (Conversational End-Call) ===
          // Detect when user says goodbye and trigger graceful close
          const farewellPatterns = [
            /^(bye|goodbye|see ya|later|that['']?s all|that['']?s it|i['']?m good|all set|thanks,?\s*bye)$/i,
            /^(thank you,?\s*(bye|goodbye)?|thanks,?\s*(that['']?s all|bye)?)$/i,
            /^(ok,?\s*(bye|thanks|goodbye)|alright,?\s*(bye|thanks|goodbye))$/i,
            /^(have a good (one|day)|take care|talk to you later)$/i,
          ];
          
          const lowerText = lowerTranscript.trim();
          const isFarewell = farewellPatterns.some(pattern => pattern.test(lowerText)) || 
            lowerText === 'bye' || lowerText === 'goodbye' || lowerText === 'thanks bye';
          
          if (isFarewell) {
            console.log('%c👋 FAREWELL DETECTED - triggering graceful close', 'background: #FF9800; color: white; padding: 2px 6px; border-radius: 4px;');
            
            // Send a contextual update to trigger a graceful goodbye
            if (conversationRef.current?.status === 'connected') {
              try {
                const goodbyeContext = "[User said goodbye. Respond with a brief, warm farewell (1 sentence max) then end naturally. Example: 'Take care - give us a shout anytime you need anything!']";
                if (typeof (conversationRef.current as any).sendContextualUpdate === 'function') {
                  (conversationRef.current as any).sendContextualUpdate(goodbyeContext);
                }
              } catch (e) {
                console.warn('[Farewell] Could not send goodbye context:', e);
              }
            }
            
            // Set a short timer to end the call after agent says goodbye
            setTimeout(async () => {
              if (conversationRef.current?.status === 'connected') {
                console.log('[Farewell] Auto-ending session after goodbye');
                await voiceSession.endSession('goodbye');
                await conversationRef.current.endSession();
                setState(prev => ({
                  ...prev,
                  isConnected: false,
                  isListening: false,
                  isSpeaking: false,
                  currentPhase: 'idle',
                }));
              }
            }, 4000); // Give agent 4s to say goodbye
          }
          // === END FAREWELL DETECTION ===

          // Also start new turn timing
          setState(prev => ({
            ...prev,
            transcript: userTranscript,
            isThinking: true,
            thinkingMessage: "Hang on — checking…",
            currentPhase: 'thinking',
            turnTiming: {
              turnStart: now,
              transcriptAt: now,
              toolStartAt: null,
              toolEndAt: null,
              agentStartAt: null,
            },
          }));

          onTranscriptComplete?.(userTranscript);

          // Track message for session persistence
          voiceSession.incrementMessageCount();

          // Start the thinking watchdog - if agent doesn't respond quickly, nudge it
          startThinkingWatchdog();
        }
      
      // Agent response received - mark as responded and clear watchdog
      if (msg.type === 'agent_response') {
        console.log('%c🤖 Agent response received', 'color: #4CAF50; font-weight: bold;');
        markAgentResponded();
        voiceSession.incrementMessageCount();
      }
      
      // Also clear watchdog on audio delta (agent started speaking)
      if (msg.type === 'response.audio.delta' || msg.type === 'audio') {
        markAgentResponded();
      }
    },
    onError: (error: unknown) => {
      console.error('ElevenLabs error:', error);
      const errorMessage = typeof error === 'string' 
        ? error 
        : (error as Error)?.message || 'Voice chat error';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isConnecting: false,
      }));
      toast({
        title: "Voice chat error",
        description: errorMessage,
        variant: "destructive",
      });
    },
    // Client tools for real-time inventory access
    // These must be configured in the ElevenLabs agent dashboard with matching names
    // Wrapped with withSearchingFeedback for instant audio acknowledgement
    clientTools: {
      // Check inventory by horsepower, family, or stock status
      // ENHANCED: Deduplicates redundant calls after recent navigation
      check_inventory: withSearchingFeedback(
        'check_inventory',
        async (params: { horsepower?: number; family?: string; in_stock?: boolean; min_hp?: number; max_hp?: number }) => {
          // === DEDUPLICATION: Skip if we just navigated to same HP within 3 seconds ===
          const recentNav = lastNavigationRef.current;
          if (recentNav && 
              params.horsepower && 
              recentNav.hp === params.horsepower && 
              Date.now() - recentNav.timestamp < 3000) {
            console.log('%c⏭️ check_inventory SKIPPED: Recent navigation already covered this HP', 'background: #FF9800; color: white; padding: 2px 6px; border-radius: 4px;');
            return JSON.stringify({ 
              message: "Already showing these motors on screen.",
              hint: "Call get_visible_motors to describe what's displayed",
              skipped: true
            });
          }
          return await handleInventoryLookup('check_inventory', params);
        },
        'Checking inventory...'
      ),
      // Get price for a specific motor
      get_motor_price: withSearchingFeedback(
        'get_motor_price',
        async (params: { model: string }) => {
          return await handleInventoryLookup('get_motor_price', params);
        },
        'Looking up price...'
      ),
      // Check if a specific motor is in stock
      check_availability: withSearchingFeedback(
        'check_availability',
        async (params: { model: string }) => {
          return await handleInventoryLookup('check_availability', params);
        },
        'Checking availability...'
      ),
      // List all motors currently in stock
      list_in_stock: withSearchingFeedback(
        'list_in_stock',
        async () => {
          return await handleInventoryLookup('list_in_stock', {});
        },
        'Checking stock...'
      ),
      // Get motors in a horsepower range
      get_hp_range: withSearchingFeedback(
        'get_hp_range',
        async (params: { min_hp: number; max_hp: number }) => {
          return await handleInventoryLookup('get_hp_range', params);
        },
        'Finding motors...'
      ),
      // Send follow-up SMS to customer (requires customer consent)
      send_follow_up_sms: async (params: {
        customer_name: string;
        customer_phone: string;
        message_type: 'quote_interest' | 'inventory_alert' | 'service_reminder' | 'general';
        motor_model?: string;
        custom_note?: string;
      }) => {
        return await handleSendFollowUpSMS(params);
      },
      // Navigate to motors page with filters applied (SILENT - screen changes, no chat card)
      navigate_to_motors: async (params: {
        horsepower?: number | string | boolean;
        model_search?: string;
        in_stock_only?: boolean;
        start_type?: string;
        control_type?: string;
        shaft_length?: string;
      }) => {
        // === ENHANCED DEBUG LOGGING ===
        console.log('%c🔍 navigate_to_motors RAW PARAMS', 'background: #673AB7; color: white; padding: 2px 6px; border-radius: 4px;');
        console.log('  horsepower:', params.horsepower, '(type:', typeof params.horsepower, ')');
        console.log('  start_type:', params.start_type, '(type:', typeof params.start_type, ')');
        console.log('  control_type:', params.control_type, '(type:', typeof params.control_type, ')');
        console.log('  shaft_length:', params.shaft_length, '(type:', typeof params.shaft_length, ')');
        console.log('  Full params:', JSON.stringify(params));
        
        // ROBUST PARAM HANDLING: ElevenLabs may send horsepower as wrong type
        let hpValue: number | undefined = undefined;
        let modelSearch = params.model_search;
        
        if (typeof params.horsepower === 'string') {
          // Check if it's actually a family name misrouted to horsepower
          if (/^(FourStroke|Verado|Pro\s*XS|SeaPro|ProKicker)$/i.test(params.horsepower)) {
            console.warn('[ClientTool] navigate_to_motors: horsepower was family name, using as model_search');
            modelSearch = params.horsepower;
          } else {
            // Try to parse as number
            const parsed = parseInt(params.horsepower, 10);
            if (!isNaN(parsed)) {
              hpValue = parsed;
              console.log(`[ClientTool] navigate_to_motors: Parsed string HP to ${hpValue}`);
            }
          }
        } else if (typeof params.horsepower === 'number') {
          hpValue = params.horsepower;
        } else if (typeof params.horsepower === 'boolean') {
          // Boolean means ElevenLabs misinterpreted - can't recover HP here
          console.warn('[ClientTool] navigate_to_motors: horsepower was boolean, ignoring');
        }
        
        // === NORMALIZE start_type (handle ALL ElevenLabs variations) ===
        let startType: 'electric' | 'manual' | undefined = undefined;
        if (params.start_type && typeof params.start_type === 'string') {
          const normalized = params.start_type.toLowerCase().trim().replace(/[_\-\s]+/g, '');
          // Electric variations
          if (normalized === 'electric' || normalized === 'e' || normalized === 'electricstart' || 
              normalized === 'estart' || normalized === 'key' || normalized === 'keystart' ||
              normalized.includes('electric')) {
            startType = 'electric';
          }
          // Manual variations
          else if (normalized === 'manual' || normalized === 'm' || normalized === 'pull' || 
                   normalized === 'pullstart' || normalized === 'rope' || normalized === 'ropestart' ||
                   normalized === 'hand' || normalized === 'handstart' || normalized.includes('pull') || 
                   normalized.includes('manual')) {
            startType = 'manual';
          }
          console.log(`[ClientTool] start_type normalized: "${params.start_type}" → "${startType}"`);
        }
        
        // === NORMALIZE control_type (handle ALL ElevenLabs variations) ===
        let controlType: 'tiller' | 'remote' | undefined = undefined;
        if (params.control_type && typeof params.control_type === 'string') {
          const normalized = params.control_type.toLowerCase().trim().replace(/[_\-\s]+/g, '');
          // Tiller variations
          if (normalized === 'tiller' || normalized === 'tillerhandle' || normalized === 'tillersteering' || 
              normalized === 'handle' || normalized.includes('tiller')) {
            controlType = 'tiller';
          }
          // Remote variations
          else if (normalized === 'remote' || normalized === 'remotesteering' || normalized === 'console' || 
                   normalized === 'steeringwheel' || normalized === 'wheel' || normalized.includes('remote')) {
            controlType = 'remote';
          }
          console.log(`[ClientTool] control_type normalized: "${params.control_type}" → "${controlType}"`);
        }
        
        // === NORMALIZE shaft_length (handle ALL ElevenLabs variations) ===
        let shaftLength: 'short' | 'long' | 'xl' | 'xxl' | undefined = undefined;
        if (params.shaft_length && typeof params.shaft_length === 'string') {
          const normalized = params.shaft_length.toLowerCase().trim().replace(/[_\-\s]+/g, '');
          // Short variations (15")
          if (normalized === 'short' || normalized === 's' || normalized === '15' || 
              normalized === '15inch' || normalized === '15in' || normalized === '15"' ||
              normalized === 'shortshaft' || normalized.includes('short')) {
            shaftLength = 'short';
          }
          // Long variations (20")
          else if (normalized === 'long' || normalized === 'l' || normalized === '20' || 
                   normalized === '20inch' || normalized === '20in' || normalized === '20"' ||
                   normalized === 'longshaft' || (normalized.includes('long') && !normalized.includes('extra'))) {
            shaftLength = 'long';
          }
          // XL variations (25")
          else if (normalized === 'xl' || normalized === 'extralong' || normalized === 'extralongshaft' ||
                   normalized === '25' || normalized === '25inch' || normalized === '25in' || normalized === '25"' ||
                   normalized.includes('extra') || normalized.includes('xl')) {
            shaftLength = 'xl';
          }
          // XXL variations (30")
          else if (normalized === 'xxl' || normalized === '30' || normalized === '30inch' || 
                   normalized === '30in' || normalized === '30"') {
            shaftLength = 'xxl';
          }
          console.log(`[ClientTool] shaft_length normalized: "${params.shaft_length}" → "${shaftLength}"`);
        }
        
        // === LOG FINAL NORMALIZED VALUES ===
        console.log('%c✅ NORMALIZED FILTER VALUES', 'background: #4CAF50; color: white; padding: 2px 6px; border-radius: 4px;');
        console.log('  HP:', hpValue, '| Start:', startType, '| Control:', controlType, '| Shaft:', shaftLength);
        
        // Build filter description based on what's being applied
        const filterParts: string[] = [];
        if (hpValue) filterParts.push(`${hpValue}HP`);
        if (startType) filterParts.push(startType === 'electric' ? 'electric start' : 'pull-start');
        if (shaftLength) filterParts.push(`${shaftLength} shaft`);
        if (controlType) filterParts.push(controlType);
        
        // Actually navigate to the page AND apply filters (including config options)
        navigateToMotorsWithFilter({
          horsepower: hpValue,
          model: modelSearch,
          inStock: params.in_stock_only,
          startType: startType,
          controlType: controlType,
          shaftLength: shaftLength,
        });
        
        // === TRACK NAVIGATION FOR DEDUPLICATION ===
        // Record this navigation so check_inventory can skip redundant lookups
        if (hpValue) {
          lastNavigationRef.current = { hp: hpValue, timestamp: Date.now() };
          console.log(`%c📍 Navigation tracked: ${hpValue}HP`, 'color: #9C27B0;');
        }
        
        const filterDesc = filterParts.length > 0 
          ? filterParts.join(', ') + ' motors'
          : modelSearch 
            ? `"${modelSearch}" motors`
            : 'all motors';
        
        // No toast - screen navigation IS the feedback
        return JSON.stringify({ 
          success: true, 
          message: `Screen now showing ${filterDesc}. Call get_visible_motors to see what's displayed.`,
          navigated: true,
          activeFilters: { 
            hp: hpValue || null, 
            startType: startType || null, 
            controlType: controlType || null, 
            shaftLength: shaftLength || null,
            inStock: params.in_stock_only || false
          },
          hint: "Now call get_visible_motors() to describe the motors on screen"
        });
      },
      // Clear all filters and show all motors
      clear_filters: () => {
        console.log('[ClientTool] clear_filters - resetting all filters');
        dispatchVoiceNavigation({ type: 'clear_filters', payload: {} });
        return JSON.stringify({ 
          success: true, 
          message: "All filters cleared. Screen now showing all motors.",
          hint: "Call get_visible_motors() to see the full inventory"
        });
      },
      // Get the motors currently visible on screen (INSTANT - reads from frontend state)
      get_visible_motors: () => {
        console.log('[ClientTool] get_visible_motors - reading from frontend state');
        const result = formatMotorsForVoice(8);
        console.log('[ClientTool] get_visible_motors result:', result);
        return result;
      },
      // Add motor to customer's quote
      add_motor_to_quote: async (params: { motor_model?: string; use_current_motor?: boolean }) => {
        return await handleAddMotorToQuote(params, options.motorContext ?? null);
      },
      // Set purchase path (loose vs professional installation)
      set_purchase_path: (params: { purchase_type: string }) => {
        return handleSetPurchasePath(params);
      },
      // Verify technical specs, part numbers, or unknown info via Perplexity
      verify_specs: withSearchingFeedback(
        'verify_specs',
        async (params: {
          query: string;
          category?: 'specs' | 'parts' | 'warranty' | 'maintenance' | 'troubleshooting';
          motor_context?: string;
        }) => {
          return await handleVerifySpecs(params);
        },
        'Looking that up...'
      ),
      // Check parts and accessories inventory via Locally API
      check_parts_inventory: withSearchingFeedback(
        'check_parts_inventory',
        async (params: {
          part_number?: string;
          upc?: string;
          search_query?: string;
        }) => {
          return await handleLocallyInventoryLookup(params);
        },
        'Checking parts...'
      ),
      // Search marine accessories catalogue for non-Mercury boat accessories
      search_accessories_catalogue: withSearchingFeedback(
        'search_accessories_catalogue',
        async (params: {
          query: string;
          auto_search?: boolean;
        }) => {
          return await handleAccessoriesCatalogueSearch(params);
        },
        'Searching catalogue...'
      ),
      // Schedule a callback request
      schedule_callback: async (params: {
        customer_name: string;
        customer_phone: string;
        preferred_time?: string;
        notes?: string;
      }) => {
        return await handleScheduleCallback({
          ...params,
          motor_interest: options.motorContext?.model,
          motor_context: options.motorContext
        });
      },
      // Set a reminder to follow up
      set_reminder: async (params: {
        customer_phone: string;
        customer_name?: string;
        reminder_type: 'motor' | 'promotion' | 'service' | 'custom';
        when: string;
        custom_note?: string;
      }) => {
        return await handleCreateReminder({
          ...params,
          reminder_content: options.motorContext ? { motor_model: options.motorContext.model, motor_hp: options.motorContext.hp } : undefined
        });
      },
      // Estimate service costs
      estimate_service_cost: (params: {
        service_type: string;
        motor_hp?: number;
        motor_model?: string;
      }) => {
        return handleServiceEstimate({
          ...params,
          motor_hp: params.motor_hp || options.motorContext?.hp,
          motor_model: params.motor_model || options.motorContext?.model
        });
      },
      // Estimate trade-in value
      estimate_trade_value: (params: {
        brand: string;
        year: number;
        horsepower: number;
        condition?: 'excellent' | 'good' | 'fair' | 'rough';
      }) => {
        return handleTradeInEstimate(params);
      },
      // Recommend a motor based on boat/usage
      recommend_motor: withSearchingFeedback(
        'recommend_motor',
        async (params: {
          boat_length?: number;
          boat_type?: 'aluminum' | 'fiberglass' | 'pontoon' | 'inflatable';
          usage?: 'fishing' | 'cruising' | 'watersports' | 'commercial';
          priority?: 'speed' | 'fuel_economy' | 'price' | 'reliability';
          max_budget?: number;
        }) => {
          return await handleRecommendMotor(params);
        },
        'Finding recommendations...'
      ),
      // Compare two motors
      compare_motors: async (params: { motor1: string; motor2: string }) => {
        return await handleCompareMotors(params);
      },
      // Send motor photos via SMS
      send_motor_photos: async (params: { customer_phone: string; motor_model?: string }) => {
        return await handleSendMotorPhotos(params, options.motorContext ?? null);
      },
      // Check current deals and promotions
      check_current_deals: async (params: { motor_model?: string; hp_range?: string }) => {
        return await handleCheckCurrentDeals(params);
      },
      // Navigate to promotions page
      navigate_to_promotions: () => {
        console.log('[ClientTool] navigate_to_promotions');
        dispatchVoiceNavigation({ type: 'navigate', payload: { path: '/promotions' } });
        
        return JSON.stringify({
          success: true,
          message: "I've opened the promotions page for you. Take a look at the details and let me know if you have questions!",
          navigated: true
        });
      },
      // Show a specific motor's details (opens modal/detail view)
      show_motor: async (params: { motor_model: string }) => {
        console.log('[ClientTool] show_motor', params);
        
        try {
          // Lookup the motor by model name
          const { data, error } = await supabase.functions.invoke('voice-inventory-lookup', {
            body: { action: 'get_motor_for_quote', params: { model: params.motor_model } }
          });
          
          if (error || !data?.result?.motor) {
            return JSON.stringify({ error: `Couldn't find motor: ${params.motor_model}` });
          }
          
          const motor = data.result.motor;
          dispatchVoiceNavigation({ type: 'show_motor', payload: { motorId: motor.id } });
          
          return JSON.stringify({
            success: true,
            message: `Showing the ${motor.model}. Take a look at the details on your screen!`,
            motor: { model: motor.model, hp: motor.horsepower, price: motor.msrp }
          });
        } catch (err) {
          console.error('[ClientTool] show_motor error:', err);
          return JSON.stringify({ error: 'Unable to show motor details.' });
        }
      },
      // Navigate to a specific quote step
      go_to_quote_step: (params: { step: 'motor' | 'path' | 'boat' | 'trade-in' | 'promo' | 'summary' }) => {
        console.log('[ClientTool] go_to_quote_step', params);
        
        const stepPaths: Record<string, string> = {
          'motor': '/quote/motor-selection',
          'path': '/quote/purchase-path',
          'boat': '/quote/boat-info',
          'trade-in': '/quote/trade-in',
          'promo': '/quote/promo-selection',
          'summary': '/quote/summary',
        };
        
        const path = stepPaths[params.step];
        if (!path) {
          return JSON.stringify({ error: `Unknown step: ${params.step}` });
        }
        
        dispatchVoiceNavigation({ type: 'navigate', payload: { path } });
        
        return JSON.stringify({
          success: true,
          message: `Taking you to the ${params.step} step.`,
          navigated: true
        });
      },
    },
  });

  // Keep conversationRef updated
  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  // Track speaking state from conversation - also update phase
  useEffect(() => {
    setState(prev => {
      // Only update if value actually changed
      if (prev.isSpeaking === conversation.isSpeaking) return prev;
      
      // Update phase based on speaking state
      let newPhase = prev.currentPhase;
      if (conversation.isSpeaking) {
        newPhase = 'speaking';
      } else if (prev.isSpeaking && !conversation.isSpeaking) {
        // Just finished speaking - go back to listening
        newPhase = 'listening';
      }
      
      return { 
        ...prev, 
        isSpeaking: conversation.isSpeaking,
        currentPhase: newPhase,
      };
    });
  }, [conversation.isSpeaking]);
  
  // Manage inactivity timer based on agent speaking state
  // Timer should start AFTER agent finishes speaking, not when it starts
  const isSpeakingRef = useRef(conversation.isSpeaking);
  useEffect(() => {
    if (conversation.isSpeaking && !isSpeakingRef.current) {
      // Agent just STARTED speaking - clear thinking watchdog but DON'T reset idle timer
      console.log('[Voice] Agent started speaking - clearing thinking watchdog only');
      markAgentResponded();
      // Clear idle timer while agent is speaking (we'll restart it when they stop)
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    } else if (!conversation.isSpeaking && isSpeakingRef.current) {
      // Agent just STOPPED speaking - NOW start the idle timer
      console.log('[Voice] Agent finished speaking - starting inactivity timer');
      resetInactivityTimer();
    }
    isSpeakingRef.current = conversation.isSpeaking;
  }, [conversation.isSpeaking, resetInactivityTimer, markAgentResponded]);

  // Track connection status
  useEffect(() => {
    const connected = conversation.status === 'connected';
    setState(prev => {
      // Only update if values actually changed
      if (prev.isConnected === connected && prev.isListening === connected) return prev;
      return { 
        ...prev, 
        isConnected: connected, 
        isListening: connected,
        currentPhase: connected ? 'listening' : 'idle',
      };
    });
  }, [conversation.status]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, []);

  const checkMicrophoneDevices = useCallback(async (): Promise<boolean> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(d => d.kind === 'audioinput');
      return audioInputs.length > 0;
    } catch {
      return false;
    }
  }, []);

  const startVoiceChat = useCallback(async () => {
    if (conversation.status === 'connected') return;

    setState(prev => ({ 
      ...prev, 
      isConnecting: true, 
      error: null,
      showPermissionDialog: false,
      showAudioIssuePrompt: false,
    }));
    transcriptRef.current = '';

    try {
      // Check for microphone devices
      const hasDevices = await checkMicrophoneDevices();
      if (!hasDevices) {
        setState(prev => ({
          ...prev,
          isConnecting: false,
          showNoMicrophoneDialog: true,
          error: 'No microphone found',
        }));
        toast({
          title: "No microphone detected",
          description: "Please connect a microphone to use voice chat.",
          variant: "destructive",
        });
        return;
      }

      // Request microphone permission
      console.log('Requesting microphone permission...');
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Microphone permission granted');
      } catch (micError) {
        const micErrorMessage = micError instanceof Error ? micError.message : 'Permission denied';
        console.error('Microphone permission error:', micError);
        setState(prev => ({
          ...prev,
          isConnecting: false,
          error: 'Microphone access denied',
          permissionState: 'denied',
          showPermissionDialog: true,
        }));
        return;
      }

      // PARALLELIZED: Load previous context, get token, AND prewarm edge functions simultaneously
      console.log('Fetching ElevenLabs conversation token...');
      let tokenData: { token: string } | null = null;
      let previousContext: any = null;
      
      try {
        // Run ALL in parallel for fastest startup
        const [prevContextResult, tokenResult] = await Promise.all([
          voiceSession.loadPreviousSessionContext().catch(err => {
            console.warn('[Voice] Failed to load previous context:', err);
            return null;
          }),
          supabase.functions.invoke('elevenlabs-conversation-token', {
            body: { 
              motorContext: options.motorContext,
              currentPage: options.currentPage,
              quoteContext: options.quoteContext,
              // Note: previousSessionContext added after we get it
            }
          }),
          // Pre-warm inventory function while we wait for token
          prewarmEdgeFunctions().catch(() => {}),
        ]);
        
        previousContext = prevContextResult;
        if (previousContext?.totalPreviousChats > 0) {
          console.log('[Voice] Returning customer:', previousContext.totalPreviousChats, 'previous chats');
        }
        
        if (tokenResult.error) {
          console.error('Token fetch error:', tokenResult.error);
          throw new Error('Unable to get voice session. Please check your connection.');
        }
        
        if (!tokenResult.data?.token) {
          throw new Error('Voice service unavailable. Please try again.');
        }
        
        tokenData = tokenResult.data;
        console.log('Token received successfully');
      } catch (tokenError) {
        console.error('Token fetch failed:', tokenError);
        throw new Error(tokenError instanceof Error ? tokenError.message : 'Failed to connect to voice service');
      }

      // Start voice session in database (fire-and-forget, don't block)
      voiceSession.startSession(
        options.motorContext,
        options.currentPage,
        undefined
      ).catch(err => console.warn('[Voice] Session start failed:', err));

      // Retry WebRTC connection with exponential backoff
      const MAX_RETRIES = 3;
      let lastError: Error | null = null;
      
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          console.log(`WebRTC connection attempt ${attempt}/${MAX_RETRIES}...`);
          
          if (attempt > 1) {
            toast({
              title: "Retrying connection...",
              description: `Attempt ${attempt} of ${MAX_RETRIES}`,
            });
          }
          
          // Start session - client_events must be configured in ElevenLabs dashboard, not here
          await conversation.startSession({
            conversationToken: tokenData.token,
            connectionType: 'webrtc',
          });
          
          console.log('WebRTC connection successful!');
          
          // Pre-warm edge functions to eliminate cold start on first question
          prewarmEdgeFunctions();
          
          return; // Success - exit the function
          
        } catch (rtcError) {
          lastError = rtcError instanceof Error ? rtcError : new Error('WebRTC connection failed');
          console.warn(`WebRTC attempt ${attempt} failed:`, rtcError);
          
          if (attempt < MAX_RETRIES) {
            // Exponential backoff: 1s, 2s, 4s
            const delay = Math.pow(2, attempt - 1) * 1000;
            console.log(`Waiting ${delay}ms before retry...`);
            await new Promise(r => setTimeout(r, delay));
          }
        }
      }
      
      // All retries failed
      console.error('All WebRTC connection attempts failed');
      throw new Error('Unable to connect to voice server. Please check your network and try again.');

    } catch (error) {
      console.error('Voice chat start error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect';
      const isDenied = errorMessage.includes('denied') || errorMessage.includes('NotAllowedError');

      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: errorMessage,
        permissionState: isDenied ? 'denied' : prev.permissionState,
        showPermissionDialog: isDenied,
      }));

      if (!isDenied) {
        toast({
          title: "Voice chat unavailable",
          description: `${errorMessage}. Tap the mic to retry.`,
          variant: "destructive",
        });
      }
    }
  }, [conversation, checkMicrophoneDevices, toast, options.motorContext, options.currentPage, options.quoteContext]);

  const endVoiceChat = useCallback(async (endReason: 'user_ended' | 'timeout' | 'goodbye' | 'error' = 'user_ended') => {
    // Clear all timers
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (thinkingWatchdogRef.current) {
      clearTimeout(thinkingWatchdogRef.current);
      thinkingWatchdogRef.current = null;
    }
    
    // End the voice session in database
    await voiceSession.endSession(endReason);
    
    await conversation.endSession();
    setState({
      isConnected: false,
      isConnecting: false,
      isSpeaking: false,
      isListening: false,
      isSearching: false,
      searchingMessage: null,
      isThinking: false,
      thinkingMessage: null,
      transcript: '',
      error: null,
      permissionState: null,
      showPermissionDialog: false,
      showNoMicrophoneDialog: false,
      showAudioIssuePrompt: false,
      diagnostics: null,
      textOnlyMode: false,
      audioFailCount: 0,
      turnTiming: initialTurnTiming,
      currentPhase: 'idle',
    });
  }, [conversation, voiceSession]);

  const sendTextMessage = useCallback((text: string) => {
    if (conversation.status !== 'connected') {
      throw new Error('Voice chat not connected');
    }
    conversation.sendUserMessage(text);
  }, [conversation]);

  // Send contextual update to the agent during an active session
  const updateContext = useCallback((
    newMotorContext?: { model: string; hp: number; price?: number } | null,
    newCurrentPage?: string
  ) => {
    if (conversation.status !== 'connected') {
      console.log('Cannot update context - not connected');
      return;
    }
    
    // Use sendContextualUpdate to inform the agent without triggering a response
    if (newMotorContext) {
      const priceInfo = newMotorContext.price ? ` priced at $${newMotorContext.price.toLocaleString()} CAD` : '';
      const contextMessage = `[Context: User is now viewing the ${newMotorContext.model} (${newMotorContext.hp}HP)${priceInfo}]`;
      console.log('Sending contextual update:', contextMessage);
      
      // Note: sendContextualUpdate is not available in all SDK versions
      // Fall back to just logging for now - the initial prompt has the context
      try {
        // @ts-ignore - sendContextualUpdate may not be typed
        if (typeof conversation.sendContextualUpdate === 'function') {
          conversation.sendContextualUpdate(contextMessage);
        }
      } catch (e) {
        console.log('sendContextualUpdate not available, context was set at session start');
      }
    }
    
    if (newCurrentPage) {
      console.log('Page context update:', newCurrentPage);
    }
  }, [conversation]);

  const closePermissionDialog = useCallback(() => {
    setState(prev => ({ ...prev, showPermissionDialog: false }));
  }, []);

  const closeNoMicrophoneDialog = useCallback(() => {
    setState(prev => ({ ...prev, showNoMicrophoneDialog: false }));
  }, []);

  const closeAudioIssuePrompt = useCallback(() => {
    setState(prev => ({ ...prev, showAudioIssuePrompt: false }));
  }, []);

  const retryAudioPlayback = useCallback(async () => {
    // ElevenLabs SDK handles audio automatically
    setState(prev => ({ ...prev, showAudioIssuePrompt: false }));
    toast({
      title: "Audio enabled",
      description: "You should hear Harris now.",
    });
  }, [toast]);

  const exitTextOnlyMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      textOnlyMode: false,
      audioFailCount: 0,
      showAudioIssuePrompt: false,
    }));
    toast({
      title: "Retrying voice audio",
      description: "Let's try that again...",
    });
  }, [toast]);

  const switchToTextMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      textOnlyMode: true,
      showAudioIssuePrompt: false,
    }));
    toast({
      title: "Text mode enabled",
      description: "You can continue chatting by typing.",
    });
  }, [toast]);

  return {
    ...state,
    startVoiceChat,
    endVoiceChat,
    sendTextMessage,
    updateContext,
    closePermissionDialog,
    closeNoMicrophoneDialog,
    retryPermission: startVoiceChat,
    closeAudioIssuePrompt,
    retryAudioPlayback,
    exitTextOnlyMode,
    switchToTextMode,
  };
}
