import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useElevenLabsVoice } from '@/hooks/useElevenLabsVoice';
import { useQuote } from '@/contexts/QuoteContext';
import { MicrophonePermissionDialog } from '@/components/chat/MicrophonePermissionDialog';
import { NoMicrophoneDialog } from '@/components/chat/NoMicrophoneDialog';
import { AudioIssuePrompt } from '@/components/chat/AudioIssuePrompt';
import { VoiceDiagnosticsPanel } from '@/components/chat/VoiceDiagnosticsPanel';
import { VOICE_NAVIGATION_EVENT, type MotorForQuote } from '@/lib/voiceNavigation';
import { useToast } from '@/hooks/use-toast';

interface VoiceContextType {
  isConnected: boolean;
  isConnecting: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  transcript: string;
  error: string | null;
  permissionState: 'granted' | 'denied' | 'prompt' | null;
  textOnlyMode: boolean;
  startVoiceChat: () => Promise<void>;
  endVoiceChat: () => void;
  sendTextMessage: (text: string) => void;
  updateContext: (motorContext?: { model: string; hp: number; price?: number } | null, currentPage?: string) => void;
  exitTextOnlyMode: () => void;
  switchToTextMode: () => void;
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
  const { state, dispatch } = useQuote();
  const { toast } = useToast();
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

  // Build quote context for voice (boat info, quote progress)
  const quoteContext = useMemo(() => {
    const hasBoatInfo = state.boatInfo && (state.boatInfo.type || state.boatInfo.length);
    const hasQuoteProgress = state.motor || state.selectedPackage || state.purchasePath;
    
    if (!hasBoatInfo && !hasQuoteProgress) return null;
    
    return {
      boatInfo: hasBoatInfo ? {
        type: state.boatInfo?.type || null,
        length: state.boatInfo?.length || null,
        make: state.boatInfo?.make || null,
        currentHp: state.boatInfo?.currentHp || null,
      } : null,
      selectedMotor: state.motor ? {
        model: state.motor.model || '',
        hp: state.motor.hp || 0,
      } : null,
      packageSelection: state.selectedPackage?.label || null,
      purchasePath: state.purchasePath || null,
      tradeInValue: state.tradeInInfo?.estimatedValue || null,
    };
  }, [
    state.boatInfo?.type, state.boatInfo?.length, state.boatInfo?.make, state.boatInfo?.currentHp,
    state.motor?.model, state.motor?.hp,
    state.selectedPackage?.label, state.purchasePath, state.tradeInInfo?.estimatedValue
  ]);

  const voice = useElevenLabsVoice({
    motorContext,
    currentPage: location.pathname,
    quoteContext,
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

  // Listen for voice navigation events (add motor to quote)
  useEffect(() => {
    const handleVoiceNav = (e: CustomEvent<{ type: string; payload: { motor: MotorForQuote } }>) => {
      if (e.detail.type === 'add_motor_to_quote' && e.detail.payload?.motor) {
        const motor = e.detail.payload.motor;
        console.log('[VoiceContext] Adding motor to quote:', motor);
        
        // Determine category based on HP
        const hp = motor.horsepower || 0;
        let category: 'portable' | 'mid-range' | 'high-performance' | 'v8-racing' = 'mid-range';
        if (hp <= 30) category = 'portable';
        else if (hp >= 200 && hp < 300) category = 'high-performance';
        else if (hp >= 300) category = 'v8-racing';
        
        // Dispatch SET_MOTOR action to QuoteContext with full Motor structure
        dispatch({ 
          type: 'SET_MOTOR', 
          payload: {
            id: motor.id,
            model: motor.model,
            year: new Date().getFullYear(),
            hp: motor.horsepower,
            price: motor.salePrice || motor.msrp || 0,
            image: '',
            stockStatus: motor.inStock ? 'In Stock' : 'On Order',
            in_stock: motor.inStock,
            category,
            type: 'Outboard',
            specs: `${motor.horsepower} HP`,
            msrp: motor.msrp,
            salePrice: motor.salePrice,
          }
        });
        
        toast({
          title: "Motor added to quote",
          description: `${motor.model} has been added to your quote!`,
        });
      }
    };
    
    window.addEventListener(VOICE_NAVIGATION_EVENT, handleVoiceNav as EventListener);
    return () => window.removeEventListener(VOICE_NAVIGATION_EVENT, handleVoiceNav as EventListener);
  }, [dispatch, toast]);

  // Create the context value without dialog-specific fields
  const contextValue: VoiceContextType = {
    isConnected: voice.isConnected,
    isConnecting: voice.isConnecting,
    isSpeaking: voice.isSpeaking,
    isListening: voice.isListening,
    transcript: voice.transcript,
    error: voice.error,
    permissionState: voice.permissionState,
    textOnlyMode: voice.textOnlyMode,
    startVoiceChat: voice.startVoiceChat,
    endVoiceChat: voice.endVoiceChat,
    sendTextMessage: voice.sendTextMessage,
    updateContext: voice.updateContext,
    exitTextOnlyMode: voice.exitTextOnlyMode,
    switchToTextMode: voice.switchToTextMode,
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
        onSwitchToText={voice.switchToTextMode}
      />
    </VoiceContext.Provider>
  );
};
