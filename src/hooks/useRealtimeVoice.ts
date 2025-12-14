import { useState, useCallback, useRef, useEffect } from 'react';
import { RealtimeVoiceChat, requestMicrophonePermission } from '@/lib/RealtimeVoice';
import { useToast } from '@/hooks/use-toast';

interface VoiceState {
  isConnected: boolean;
  isConnecting: boolean;
  isSpeaking: boolean; // AI is speaking
  isListening: boolean; // User mic is active
  transcript: string;
  error: string | null;
}

interface UseRealtimeVoiceOptions {
  onTranscriptComplete?: (transcript: string) => void;
  motorContext?: {
    model: string;
    hp: number;
    price?: number;
  } | null;
  currentPage?: string;
}

export function useRealtimeVoice(options: UseRealtimeVoiceOptions = {}) {
  const { onTranscriptComplete, motorContext, currentPage } = options;
  const { toast } = useToast();
  
  const [state, setState] = useState<VoiceState>({
    isConnected: false,
    isConnecting: false,
    isSpeaking: false,
    isListening: false,
    transcript: '',
    error: null,
  });
  
  const chatRef = useRef<RealtimeVoiceChat | null>(null);
  const transcriptRef = useRef<string>('');

  const handleTranscript = useCallback((text: string, isFinal: boolean) => {
    if (isFinal) {
      transcriptRef.current = text;
      setState(prev => ({ ...prev, transcript: text }));
      onTranscriptComplete?.(text);
    } else {
      // Accumulate delta transcripts
      transcriptRef.current += text;
      setState(prev => ({ ...prev, transcript: transcriptRef.current }));
    }
  }, [onTranscriptComplete]);

  const handleSpeakingChange = useCallback((isSpeaking: boolean) => {
    setState(prev => ({ ...prev, isSpeaking }));
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('Voice chat error:', error);
    setState(prev => ({ ...prev, error: error.message }));
    toast({
      title: "Voice chat error",
      description: error.message,
      variant: "destructive",
    });
  }, [toast]);

  const handleConnectionChange = useCallback((connected: boolean) => {
    setState(prev => ({ 
      ...prev, 
      isConnected: connected,
      isConnecting: false,
      isListening: connected,
    }));
    
    if (connected) {
      toast({
        title: "Voice chat connected",
        description: "Start speaking to chat with Harris",
      });
    }
  }, [toast]);

  const startVoiceChat = useCallback(async () => {
    if (chatRef.current) {
      return; // Already connected
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    transcriptRef.current = '';

    try {
      // CRITICAL: Request microphone permission FIRST, directly from user tap
      // This is required for iOS Safari - must happen before any async operations
      console.log('Requesting microphone permission...');
      const stream = await requestMicrophonePermission();
      console.log('Microphone permission granted, creating voice chat...');
      
      chatRef.current = new RealtimeVoiceChat(
        handleTranscript,
        handleSpeakingChange,
        handleError,
        handleConnectionChange
      );
      
      // Pass the already-acquired stream to connect
      await chatRef.current.connect(motorContext, currentPage, stream);
    } catch (error) {
      console.error('Voice chat start error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect';
      
      setState(prev => ({ 
        ...prev, 
        isConnecting: false,
        error: errorMessage
      }));
      
      // Show specific toast for permission errors
      toast({
        title: "Voice chat unavailable",
        description: errorMessage,
        variant: "destructive",
      });
      
      chatRef.current = null;
    }
  }, [motorContext, currentPage, handleTranscript, handleSpeakingChange, handleError, handleConnectionChange, toast]);

  const endVoiceChat = useCallback(() => {
    chatRef.current?.disconnect();
    chatRef.current = null;
    setState({
      isConnected: false,
      isConnecting: false,
      isSpeaking: false,
      isListening: false,
      transcript: '',
      error: null,
    });
  }, []);

  const sendTextMessage = useCallback((text: string) => {
    if (!chatRef.current) {
      throw new Error('Voice chat not connected');
    }
    chatRef.current.sendTextMessage(text);
  }, []);

  const updateContext = useCallback((
    newMotorContext?: { model: string; hp: number; price?: number } | null,
    newCurrentPage?: string
  ) => {
    chatRef.current?.updateContext(newMotorContext, newCurrentPage);
  }, []);

  // Auto-update context when motor or page changes during active session
  useEffect(() => {
    if (state.isConnected && (motorContext || currentPage)) {
      chatRef.current?.updateContext(motorContext, currentPage);
    }
  }, [state.isConnected, motorContext, currentPage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      chatRef.current?.disconnect();
    };
  }, []);

  return {
    ...state,
    startVoiceChat,
    endVoiceChat,
    sendTextMessage,
    updateContext,
  };
}
