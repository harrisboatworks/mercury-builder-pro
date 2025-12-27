import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useRealtimeVoice } from '@/hooks/useRealtimeVoice';
import { useQuote } from '@/contexts/QuoteContext';
import { MicrophonePermissionDialog } from '@/components/chat/MicrophonePermissionDialog';
import { NoMicrophoneDialog } from '@/components/chat/NoMicrophoneDialog';
import { AudioIssuePrompt } from '@/components/chat/AudioIssuePrompt';
import { VoiceDiagnosticsPanel } from '@/components/chat/VoiceDiagnosticsPanel';

interface VoiceContextType {
  isConnected: boolean;
  isConnecting: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  transcript: string;
  error: string | null;
  permissionState: 'granted' | 'denied' | 'prompt' | null;
  startVoiceChat: () => Promise<void>;
  endVoiceChat: () => void;
  sendTextMessage: (text: string) => void;
  updateContext: (motorContext?: { model: string; hp: number; price?: number } | null, currentPage?: string) => void;
}

const VoiceContext = createContext<VoiceContextType | null>(null);

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within VoiceProvider');
  }
  return context;
};

// Safe version that returns null if not in provider (for components that may be outside)
export const useVoiceSafe = () => {
  return useContext(VoiceContext);
};

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { state } = useQuote();
  const prevMotorIdRef = useRef<string | null>(null);
  const prevPathRef = useRef<string>(location.pathname);
  
  // Get the active motor (preview or selected)
  const activeMotor = state.previewMotor || state.motor;

  // Build motor context for voice (memoized to avoid re-render loops)
  const motorContext = useMemo(
    () =>
      activeMotor
        ? {
            model: activeMotor.model || '',
            hp: activeMotor.hp || 0,
            price: activeMotor.msrp || activeMotor.price || activeMotor.salePrice,
          }
        : null,
    [activeMotor?.model, activeMotor?.hp, activeMotor?.msrp, activeMotor?.price, activeMotor?.salePrice]
  );

  const voice = useRealtimeVoice({
    motorContext,
    currentPage: location.pathname,
  });

  // Auto-update context when motor or page changes during active session
  useEffect(() => {
    if (!voice.isConnected) return;
    
    const motorChanged = activeMotor?.id !== prevMotorIdRef.current;
    const pageChanged = location.pathname !== prevPathRef.current;
    
    if (motorChanged || pageChanged) {
      voice.updateContext(motorContext, location.pathname);
      prevMotorIdRef.current = activeMotor?.id || null;
      prevPathRef.current = location.pathname;
    }
  }, [voice.isConnected, activeMotor?.id, location.pathname, motorContext, voice]);

  // Create the context value without dialog-specific fields
  const contextValue: VoiceContextType = {
    isConnected: voice.isConnected,
    isConnecting: voice.isConnecting,
    isSpeaking: voice.isSpeaking,
    isListening: voice.isListening,
    transcript: voice.transcript,
    error: voice.error,
    permissionState: voice.permissionState,
    startVoiceChat: voice.startVoiceChat,
    endVoiceChat: voice.endVoiceChat,
    sendTextMessage: voice.sendTextMessage,
    updateContext: voice.updateContext,
  };

  return (
    <VoiceContext.Provider value={contextValue}>
      {children}

      {/* Diagnostics panel (Alt+Shift+D) */}
      <VoiceDiagnosticsPanel diagnostics={voice.diagnostics} />

      {/* No Microphone Dialog */}
      <NoMicrophoneDialog
        open={voice.showNoMicrophoneDialog}
        onClose={voice.closeNoMicrophoneDialog}
        onRetry={voice.startVoiceChat}
      />

      {/* Microphone Permission Dialog */}
      <MicrophonePermissionDialog
        open={voice.showPermissionDialog}
        onClose={voice.closePermissionDialog}
        permissionState={voice.permissionState === 'denied' ? 'denied' : 'prompt'}
        onRetry={voice.retryPermission}
      />

      {/* Audio Issue Prompt */}
      <AudioIssuePrompt
        show={voice.showAudioIssuePrompt}
        onEnableAudio={voice.retryAudioPlayback}
        onDismiss={voice.closeAudioIssuePrompt}
      />
    </VoiceContext.Provider>
  );
};
