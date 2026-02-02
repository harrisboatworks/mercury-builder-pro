import React, { useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, MessageSquare, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoiceSafe } from '@/contexts/VoiceContext';
import { useQuote } from '@/contexts/QuoteContext';
import { useLocation } from 'react-router-dom';
import { useAIChat } from './GlobalAIChat';
import { prewarmEdgeFunctions } from '@/hooks/useElevenLabsVoice';

interface DesktopCommandBarProps {
  onOpenChat: () => void;
  isChatOpen: boolean;
}

export const DesktopCommandBar: React.FC<DesktopCommandBarProps> = ({ 
  onOpenChat, 
  isChatOpen 
}) => {
  const location = useLocation();
  const { state } = useQuote();
  const voice = useVoiceSafe();
  const { unreadCount, isLoading } = useAIChat();
  const hasPrewarmed = useRef(false);

  // Pre-warm edge functions on mount
  useEffect(() => {
    if (!hasPrewarmed.current) {
      hasPrewarmed.current = true;
      prewarmEdgeFunctions();
    }
  }, []);

  const handleVoiceClick = useCallback(() => {
    if (!voice) return;
    
    if (voice.textOnlyMode) {
      voice.exitTextOnlyMode();
      return;
    }
    
    if (voice.isConnected) {
      voice.endVoiceChat();
    } else {
      voice.startVoiceChat();
    }
  }, [voice]);

  const handleChatClick = useCallback(() => {
    onOpenChat();
  }, [onOpenChat]);

  // Context-aware text based on current page and motor
  const getContextualText = useCallback(() => {
    const path = location.pathname;
    const activeMotor = state.previewMotor || state.motor;
    
    if (voice?.isConnected) {
      if (voice.isThinking) return voice.thinkingMessage || 'Thinking...';
      if (voice.isSearching) return voice.searchingMessage || 'Searching...';
      if (voice.isSpeaking) return 'Harris is speaking...';
      if (voice.isListening) return 'Listening...';
      return 'Voice active';
    }
    
    if (voice?.isConnecting) return 'Connecting...';
    
    if (path.includes('/quote/motor-selection') && activeMotor) {
      return `Ask about ${activeMotor.hp}HP`;
    }
    if (path.includes('/quote/summary')) {
      return 'Questions about your quote?';
    }
    if (path.includes('/financing')) {
      return 'Financing questions?';
    }
    if (path.includes('/promotions')) {
      return 'Ask about promotions';
    }
    if (path.includes('/repower')) {
      return 'Ask about repowering';
    }
    
    return 'Mercury Expert';
  }, [location.pathname, state.previewMotor, state.motor, voice]);

  // Determine voice button state
  const getVoiceButtonState = useCallback(() => {
    if (!voice) return 'unavailable';
    if (voice.textOnlyMode) return 'text-only';
    if (voice.isConnecting) return 'connecting';
    if (voice.isSpeaking) return 'speaking';
    if (voice.isListening) return 'listening';
    if (voice.isConnected) return 'connected';
    return 'idle';
  }, [voice]);

  const voiceState = getVoiceButtonState();
  const isVoiceActive = voiceState === 'listening' || voiceState === 'speaking' || voiceState === 'connected';

  // Hide when chat is open - let the chat widget take over
  if (isChatOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="fixed bottom-6 right-4 z-40"
    >
      <div className="flex items-center gap-3 px-4 py-3 bg-background/95 backdrop-blur-lg rounded-2xl shadow-lg border border-border/50">
        {/* Voice Button (Left) */}
        <VoiceCommandButton 
          state={voiceState}
          onClick={handleVoiceClick}
          disabled={!voice}
        />

        {/* Center Context Area */}
        <div className="flex flex-col items-center min-w-[120px]">
          <motion.span 
            key={getContextualText()}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-medium text-foreground whitespace-nowrap"
          >
            {getContextualText()}
          </motion.span>
          {!isVoiceActive && (
            <span className="text-xs text-muted-foreground">Always here to help</span>
          )}
        </div>

        {/* Chat Button (Right) */}
        <ChatCommandButton 
          onClick={handleChatClick}
          unreadCount={unreadCount}
          isLoading={isLoading}
        />
      </div>
    </motion.div>
  );
};

// Voice Button Sub-component
interface VoiceCommandButtonProps {
  state: 'idle' | 'connecting' | 'listening' | 'speaking' | 'connected' | 'text-only' | 'unavailable';
  onClick: () => void;
  disabled?: boolean;
}

const VoiceCommandButton: React.FC<VoiceCommandButtonProps> = ({ state, onClick, disabled }) => {
  const isActive = state === 'listening' || state === 'speaking' || state === 'connected';
  
  const getButtonClasses = () => {
    switch (state) {
      case 'speaking':
        return 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30';
      case 'listening':
      case 'connected':
        return 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30';
      case 'connecting':
        return 'bg-gradient-to-br from-amber-400 to-amber-500 text-white';
      case 'text-only':
        return 'bg-amber-100 text-amber-700';
      case 'unavailable':
        return 'bg-muted text-muted-foreground opacity-50';
      default:
        return 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 text-emerald-700 hover:from-emerald-500/30 hover:to-emerald-600/30 border border-emerald-500/30';
    }
  };

  const getIcon = () => {
    switch (state) {
      case 'speaking':
        return <Volume2 className="w-5 h-5" />;
      case 'connecting':
        return <Loader2 className="w-5 h-5 animate-spin" />;
      case 'text-only':
      case 'unavailable':
        return <MicOff className="w-5 h-5" />;
      default:
        return <Mic className="w-5 h-5" />;
    }
  };

  const getLabel = () => {
    if (state === 'text-only') return 'Retry';
    if (isActive) return 'LIVE';
    return 'Voice';
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || state === 'connecting'}
      className={cn(
        'relative flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all',
        getButtonClasses()
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onMouseEnter={() => prewarmEdgeFunctions()}
    >
      {/* Pulse animations */}
      <AnimatePresence>
        {state === 'listening' && (
          <motion.div
            className="absolute inset-0 rounded-xl bg-emerald-500"
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: 0, scale: 1.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        )}
        {state === 'speaking' && (
          <motion.div
            className="absolute inset-0 rounded-xl bg-emerald-500"
            initial={{ opacity: 0.4, scale: 1 }}
            animate={{ opacity: 0, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        )}
        {state === 'connecting' && (
          <motion.div
            className="absolute inset-0 rounded-xl bg-amber-400"
            initial={{ opacity: 0.3, scale: 1 }}
            animate={{ opacity: 0, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </AnimatePresence>

      {/* Breathing animation for idle state */}
      {state === 'idle' && (
        <motion.div
          className="absolute inset-0 rounded-xl bg-emerald-500/10"
          animate={{ 
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Icon and label */}
      <span className="relative z-10">{getIcon()}</span>
      <span className={cn(
        "relative z-10 text-[10px] font-semibold mt-0.5",
        isActive && "tracking-wider"
      )}>
        {getLabel()}
      </span>

      {/* LIVE badge */}
      {isActive && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 text-white text-[8px] font-bold rounded-full shadow-lg"
        >
          ●
        </motion.span>
      )}
    </motion.button>
  );
};

// Chat Button Sub-component
interface ChatCommandButtonProps {
  onClick: () => void;
  unreadCount: number;
  isLoading: boolean;
}

const ChatCommandButton: React.FC<ChatCommandButtonProps> = ({ onClick, unreadCount, isLoading }) => {
  return (
    <motion.button
      onClick={onClick}
      className="relative flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Unread badge */}
      {unreadCount > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-lg z-10"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </motion.span>
      )}

      {/* Icon or typing indicator */}
      <div className="relative flex items-center justify-center">
        {isLoading ? (
          <div className="flex gap-0.5 items-center">
            {[0, 1, 2].map(i => (
              <motion.span
                key={i}
                className="w-1 h-1 bg-current rounded-full"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
          </div>
        ) : (
          <>
            <MessageSquare className="w-5 h-5" />
            <Sparkles className="absolute -top-1 -right-1 w-2.5 h-2.5 text-amber-400" />
          </>
        )}
      </div>
      <span className="text-[10px] font-semibold mt-0.5">
        {isLoading ? 'Typing' : 'Chat'}
      </span>
    </motion.button>
  );
};
