import { useState, useCallback, useRef, useEffect } from 'react';
import { RealtimeVoiceChat } from '@/lib/RealtimeVoice';
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
      chatRef.current = new RealtimeVoiceChat(
        handleTranscript,
        handleSpeakingChange,
        handleError,
        handleConnectionChange
      );
      
      await chatRef.current.connect(motorContext, currentPage);
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect'
      }));
      chatRef.current = null;
    }
  }, [motorContext, currentPage, handleTranscript, handleSpeakingChange, handleError, handleConnectionChange]);

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
  };
}
