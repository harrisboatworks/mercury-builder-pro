import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  RealtimeVoiceChat, 
  requestMicrophonePermission, 
  checkMicrophonePermission,
  checkAudioInputDevices,
  unlockAudioOutput,
  VoiceDiagnostics
} from '@/lib/RealtimeVoice';
import { useToast } from '@/hooks/use-toast';

interface VoiceState {
  isConnected: boolean;
  isConnecting: boolean;
  isSpeaking: boolean; // AI is speaking
  isListening: boolean; // User mic is active
  transcript: string;
  error: string | null;
  permissionState: 'granted' | 'denied' | 'prompt' | null;
  showPermissionDialog: boolean;
  showNoMicrophoneDialog: boolean;
  showAudioIssuePrompt: boolean;
  diagnostics: VoiceDiagnostics | null;
  // Text-only fallback mode
  textOnlyMode: boolean;
  audioFailCount: number;
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
    permissionState: null,
    showPermissionDialog: false,
    showNoMicrophoneDialog: false,
    showAudioIssuePrompt: false,
    diagnostics: null,
    textOnlyMode: false,
    audioFailCount: 0,
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
        description: "Harris is here — say something!",
      });
    }
  }, [toast]);

  const handleDiagnosticsChange = useCallback((diagnostics: VoiceDiagnostics) => {
    setState(prev => ({ ...prev, diagnostics }));
  }, []);

  const handleAudioIssue = useCallback(() => {
    console.log('Audio issue detected - prompting user');
    setState(prev => {
      const newFailCount = prev.audioFailCount + 1;
      
      // If we've failed twice, switch to text-only mode
      if (newFailCount >= 2) {
        console.log('Audio failed twice, switching to text-only mode');
        toast({
          title: "Switched to text mode",
          description: "Voice audio isn't working. You can still chat by typing.",
          duration: 5000,
        });
        return { 
          ...prev, 
          audioFailCount: newFailCount,
          textOnlyMode: true,
          showAudioIssuePrompt: false,
        };
      }
      
      return { 
        ...prev, 
        audioFailCount: newFailCount,
        showAudioIssuePrompt: true,
      };
    });
    
    // Only show toast for first failure
    if (state.audioFailCount === 0) {
      toast({
        title: "Can't hear Harris?",
        description: "Tap 'Enable Audio' or try using Chrome browser.",
        duration: 10000,
      });
    }
  }, [toast, state.audioFailCount]);

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
    console.log('User triggered audio retry');
    await chatRef.current?.retryAudioPlayback();
    setState(prev => ({ ...prev, showAudioIssuePrompt: false }));
    toast({
      title: "Audio enabled",
      description: "You should hear Harris now.",
    });
  }, [toast]);

  const attemptConnection = useCallback(async () => {
    if (chatRef.current) return;

    setState(prev => ({ 
      ...prev, 
      isConnecting: true, 
      error: null, 
      showPermissionDialog: false,
      showAudioIssuePrompt: false,
    }));
    transcriptRef.current = '';

    try {
      console.log('Requesting microphone permission...');
      const stream = await requestMicrophonePermission();
      console.log('Microphone permission granted, creating voice chat...');
      
      chatRef.current = new RealtimeVoiceChat(
        handleTranscript,
        handleSpeakingChange,
        handleError,
        handleConnectionChange,
        handleDiagnosticsChange,
        handleAudioIssue
      );
      
      await chatRef.current.connect(motorContext, currentPage, stream);
    } catch (error) {
      console.error('Voice chat start error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect';
      const isDenied = errorMessage.includes('denied') || errorMessage.includes('blocked');
      
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
      
      chatRef.current = null;
    }
  }, [motorContext, currentPage, handleTranscript, handleSpeakingChange, handleError, handleConnectionChange, handleDiagnosticsChange, handleAudioIssue, toast]);

  const startVoiceChat = useCallback(async () => {
    if (chatRef.current) return;

    // CRITICAL: Unlock audio output FIRST, directly in user gesture context
    // This must happen before ANY async operations (permission check, token fetch, etc.)
    console.log('🔓 Unlocking audio output on user gesture...');
    try {
      await unlockAudioOutput();
      console.log('🔓 Audio output unlocked successfully');
    } catch (e) {
      console.warn('Audio unlock failed:', e);
    }

    // Check if any audio input devices exist
    const { hasDevices, deviceCount } = await checkAudioInputDevices();
    console.log('Audio input devices check:', hasDevices, deviceCount);
    
    if (!hasDevices) {
      setState(prev => ({ 
        ...prev, 
        showNoMicrophoneDialog: true,
        error: 'No microphone found'
      }));
      toast({
        title: "No microphone detected",
        description: "Please connect a microphone to use voice chat.",
        variant: "destructive",
      });
      return;
    }

    // Now check permission state
    const permState = await checkMicrophonePermission();
    console.log('Microphone permission state:', permState);
    
    if (permState === 'denied') {
      setState(prev => ({ 
        ...prev, 
        permissionState: 'denied',
        showPermissionDialog: true 
      }));
      return;
    }
    
    // Permission is 'granted' or 'prompt' - proceed with connection
    await attemptConnection();
  }, [attemptConnection, toast]);

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
      permissionState: null,
      showPermissionDialog: false,
      showNoMicrophoneDialog: false,
      showAudioIssuePrompt: false,
      diagnostics: null,
      textOnlyMode: false,
      audioFailCount: 0,
    });
  }, []);

  const exitTextOnlyMode = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      textOnlyMode: false, 
      audioFailCount: 0,
      showAudioIssuePrompt: false,
    }));
    // Retry audio playback
    chatRef.current?.retryAudioPlayback();
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
  const prevContextKeyRef = useRef<string>('');

  useEffect(() => {
    if (!state.isConnected) return;

    const key = JSON.stringify({
      motorContext: motorContext
        ? { model: motorContext.model, hp: motorContext.hp, price: motorContext.price }
        : null,
      currentPage: currentPage || null,
    });

    if (key === prevContextKeyRef.current) return;
    prevContextKeyRef.current = key;

    chatRef.current?.updateContext(motorContext, currentPage);
  }, [state.isConnected, motorContext?.model, motorContext?.hp, motorContext?.price, currentPage]);

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
    closePermissionDialog,
    closeNoMicrophoneDialog,
    retryPermission: attemptConnection,
    closeAudioIssuePrompt,
    retryAudioPlayback,
    exitTextOnlyMode,
    switchToTextMode,
  };
}
