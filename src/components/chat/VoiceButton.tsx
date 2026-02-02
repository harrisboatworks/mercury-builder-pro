import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { prewarmEdgeFunctions } from '@/hooks/useElevenLabsVoice';

interface VoiceButtonProps {
  isConnected: boolean;
  isConnecting: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  textOnlyMode?: boolean;
  onStart: () => void;
  onEnd: () => void;
  onExitTextMode?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  isConnected,
  isConnecting,
  isSpeaking,
  isListening,
  textOnlyMode = false,
  onStart,
  onEnd,
  onExitTextMode,
  className,
  size = 'md',
}) => {
  const hasPrewarmed = useRef(false);
  
  // Pre-warm edge functions on mount (once only)
  useEffect(() => {
    if (!hasPrewarmed.current) {
      hasPrewarmed.current = true;
      console.log('[VoiceButton] Pre-warming on mount...');
      prewarmEdgeFunctions();
    }
  }, []);
  
  // Also prewarm on hover for extra assurance
  const handleMouseEnter = () => {
    prewarmEdgeFunctions();
  };
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleClick = () => {
    if (textOnlyMode && onExitTextMode) {
      onExitTextMode();
      return;
    }
    if (isConnected) {
      onEnd();
    } else {
      onStart();
    }
  };

  // Determine state for visuals
  const getStateColor = () => {
    if (textOnlyMode) return 'bg-amber-100 text-amber-600 hover:bg-amber-200';
    if (isConnecting) return 'bg-amber-100 text-amber-600';
    if (isSpeaking) return 'bg-emerald-500 text-white';
    if (isListening) return 'bg-red-500 text-white';
    return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200';
  };

  const getIcon = () => {
    if (textOnlyMode) {
      return <MicOff className={iconSizes[size]} />;
    }
    if (isConnecting) {
      return <Loader2 className={cn(iconSizes[size], 'animate-spin')} />;
    }
    if (isSpeaking) {
      return <Volume2 className={iconSizes[size]} />;
    }
    if (isListening) {
      return <Mic className={iconSizes[size]} />;
    }
    return <Mic className={iconSizes[size]} />;
  };

  return (
    <motion.button
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      disabled={isConnecting}
      className={cn(
        'relative rounded-full flex items-center justify-center transition-colors',
        sizeClasses[size],
        getStateColor(),
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Pulse animation when listening */}
      <AnimatePresence>
        {isListening && !isSpeaking && (
          <motion.div
            className="absolute inset-0 rounded-full bg-red-500"
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: 0, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </AnimatePresence>

      {/* Speaking wave animation */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            className="absolute inset-0 rounded-full bg-emerald-500"
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: 0, scale: 1.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        )}
      </AnimatePresence>

      {/* Connecting pulse */}
      <AnimatePresence>
        {isConnecting && (
          <motion.div
            className="absolute inset-0 rounded-full bg-amber-400"
            initial={{ opacity: 0.3, scale: 1 }}
            animate={{ opacity: 0, scale: 1.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        )}
      </AnimatePresence>

      {/* Icon */}
      <span className="relative z-10">{getIcon()}</span>
    </motion.button>
  );
};

// Compact inline version for chat input area
export const VoiceButtonInline: React.FC<VoiceButtonProps & { label?: string }> = ({
  isConnected,
  isConnecting,
  isSpeaking,
  isListening,
  textOnlyMode = false,
  onStart,
  onEnd,
  onExitTextMode,
  label,
  className,
}) => {
  const handleClick = () => {
    if (textOnlyMode && onExitTextMode) {
      onExitTextMode();
      return;
    }
    if (isConnected) {
      onEnd();
    } else {
      onStart();
    }
  };

  const getLabel = () => {
    if (textOnlyMode) return 'Voice unavailable – tap to retry';
    if (isConnecting) return 'Connecting...';
    if (isSpeaking) return 'Harris is speaking...';
    if (isListening) return 'Listening...';
    return label || 'Voice chat';
  };

  const getIcon = () => {
    if (textOnlyMode) return <MicOff className="w-4 h-4" />;
    if (isConnecting) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (isSpeaking) return <Volume2 className="w-4 h-4" />;
    if (isListening) return <MicOff className="w-4 h-4" />;
    return <Mic className="w-4 h-4" />;
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={isConnecting}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors',
        textOnlyMode
          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
          : isConnecting
            ? 'bg-amber-100 text-amber-700'
            : isConnected
              ? isSpeaking
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {getIcon()}
      <span className="font-light">{getLabel()}</span>
    </motion.button>
  );
};
