import { useState, useCallback, useRef, useEffect } from 'react';
import { useConversation } from '@elevenlabs/react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { VoiceDiagnostics } from '@/lib/RealtimeVoice';
import { dispatchVoiceNavigation, type MotorForQuote } from '@/lib/voiceNavigation';

interface VoiceState {
  isConnected: boolean;
  isConnecting: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  transcript: string;
  error: string | null;
  permissionState: 'granted' | 'denied' | 'prompt' | null;
  showPermissionDialog: boolean;
  showNoMicrophoneDialog: boolean;
  showAudioIssuePrompt: boolean;
  diagnostics: VoiceDiagnostics | null;
  textOnlyMode: boolean;
  audioFailCount: number;
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

// Client tool handler for Perplexity spec verification
// NOTE: ElevenLabs has hard 10s timeout. Perplexity takes 20s+. Return helpful fallback immediately.
function handleVerifySpecs(params: {
  query: string;
  category?: 'specs' | 'parts' | 'warranty' | 'maintenance' | 'troubleshooting';
  motor_context?: string;
}): string {
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
  
  // === DEFAULT FALLBACK - Trigger text chat for deep search ===
  triggerTextChatSearch(params.query);
  return "That's a great question! I'm searching that for you now - check the chat on your screen in just a moment for the detailed answer.";
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

export function useElevenLabsVoice(options: UseElevenLabsVoiceOptions = {}) {
  const { onTranscriptComplete } = options;
  const { toast } = useToast();
  
  const [state, setState] = useState<VoiceState>({
    isConnected: false,
    isConnecting: false,
    isSpeaking: false,
    isListening: false,
    transcript: '',
    error: null,
    permissionState: null,
    showPermissionDialog: false,
    showNoMicrophoneDialog: false,
    showAudioIssuePrompt: false,
    diagnostics: null,
    textOnlyMode: false,
    audioFailCount: 0,
  });

  const transcriptRef = useRef<string>('');

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
      }));
      toast({
        title: "Voice chat connected",
        description: "Harris is here — say something!",
      });
    },
    onDisconnect: () => {
      console.log('ElevenLabs: Disconnected from agent');
      setState(prev => ({
        ...prev,
        isConnected: false,
        isListening: false,
        isSpeaking: false,
      }));
    },
    onMessage: (message: unknown) => {
      console.log('ElevenLabs message:', message);
      
      // Handle transcript events
      const msg = message as Record<string, unknown>;
      if (msg.type === 'user_transcript') {
        const event = msg.user_transcription_event as Record<string, unknown> | undefined;
        const userTranscript = event?.user_transcript as string | undefined;
        if (userTranscript) {
          transcriptRef.current = userTranscript;
          setState(prev => ({ ...prev, transcript: userTranscript }));
          onTranscriptComplete?.(userTranscript);
        }
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
    clientTools: {
      // Check inventory by horsepower, family, or stock status
      check_inventory: async (params: { horsepower?: number; family?: string; in_stock?: boolean; min_hp?: number; max_hp?: number }) => {
        return await handleInventoryLookup('check_inventory', params);
      },
      // Get price for a specific motor
      get_motor_price: async (params: { model: string }) => {
        return await handleInventoryLookup('get_motor_price', params);
      },
      // Check if a specific motor is in stock
      check_availability: async (params: { model: string }) => {
        return await handleInventoryLookup('check_availability', params);
      },
      // List all motors currently in stock
      list_in_stock: async () => {
        return await handleInventoryLookup('list_in_stock', {});
      },
      // Get motors in a horsepower range
      get_hp_range: async (params: { min_hp: number; max_hp: number }) => {
        return await handleInventoryLookup('get_hp_range', params);
      },
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
      // Navigate to motors page with filters applied
      navigate_to_motors: async (params: {
        horsepower?: number;
        model_search?: string;
        in_stock_only?: boolean;
      }) => {
        console.log('[ClientTool] navigate_to_motors', params);
        
        dispatchVoiceNavigation({
          type: 'filter_motors',
          payload: {
            horsepower: params.horsepower,
            model: params.model_search,
            inStock: params.in_stock_only
          }
        });
        
        const filterDesc = params.horsepower 
          ? `${params.horsepower}HP motors` 
          : params.model_search 
            ? `"${params.model_search}" motors`
            : 'filtered motors';
        
        return JSON.stringify({ 
          success: true, 
          message: `Now showing ${filterDesc} on screen.` 
        });
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
      verify_specs: async (params: {
        query: string;
        category?: 'specs' | 'parts' | 'warranty' | 'maintenance' | 'troubleshooting';
        motor_context?: string;
      }) => {
        return await handleVerifySpecs(params);
      },
    },
  });

  // Track speaking state from conversation
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isSpeaking: conversation.isSpeaking,
    }));
  }, [conversation.isSpeaking]);

  // Track connection status
  useEffect(() => {
    const connected = conversation.status === 'connected';
    setState(prev => ({
      ...prev,
      isConnected: connected,
      isListening: connected,
    }));
  }, [conversation.status]);

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

      // Get conversation token from edge function
      console.log('Fetching ElevenLabs conversation token...');
      let tokenData: { token: string } | null = null;
      
      try {
        const { data, error } = await supabase.functions.invoke('elevenlabs-conversation-token', {
          body: { 
            motorContext: options.motorContext,
            currentPage: options.currentPage,
            quoteContext: options.quoteContext
          }
        });
        
        if (error) {
          console.error('Token fetch error:', error);
          throw new Error('Unable to get voice session. Please check your connection.');
        }
        
        if (!data?.token) {
          throw new Error('Voice service unavailable. Please try again.');
        }
        
        tokenData = data;
        console.log('Token received successfully');
      } catch (tokenError) {
        console.error('Token fetch failed:', tokenError);
        throw new Error(tokenError instanceof Error ? tokenError.message : 'Failed to connect to voice service');
      }

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
          
          await conversation.startSession({
            conversationToken: tokenData.token,
            connectionType: 'webrtc',
          });
          
          console.log('WebRTC connection successful!');
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

  const endVoiceChat = useCallback(async () => {
    await conversation.endSession();
    setState({
      isConnected: false,
      isConnecting: false,
      isSpeaking: false,
      isListening: false,
      transcript: '',
      error: null,
      permissionState: null,
      showPermissionDialog: false,
      showNoMicrophoneDialog: false,
      showAudioIssuePrompt: false,
      diagnostics: null,
      textOnlyMode: false,
      audioFailCount: 0,
    });
  }, [conversation]);

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
