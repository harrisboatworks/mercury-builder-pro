import { useState, useCallback, useRef, useEffect } from 'react';
import { useConversation } from '@elevenlabs/react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { VoiceDiagnostics } from '@/lib/RealtimeVoice';

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

interface UseElevenLabsVoiceOptions {
  onTranscriptComplete?: (transcript: string) => void;
  motorContext?: {
    model: string;
    hp: number;
    price?: number;
  } | null;
  currentPage?: string;
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
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone permission granted');

      // Get conversation token AND system prompt from edge function
      console.log('Fetching ElevenLabs conversation token with dynamic prompt...');
      const { data, error } = await supabase.functions.invoke('elevenlabs-conversation-token', {
        body: { motorContext: options.motorContext }
      });
      
      if (error || !data?.token) {
        throw new Error(error?.message || 'Failed to get conversation token');
      }

      console.log('Starting ElevenLabs conversation with client tools...');
      
      // Start the conversation with WebRTC
      await conversation.startSession({
        conversationToken: data.token,
        connectionType: 'webrtc',
      });

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
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  }, [conversation, checkMicrophoneDevices, toast, options.motorContext]);

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
