import React, { useCallback } from 'react';
import { Mic, Loader2, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useVoiceSafe } from '@/contexts/VoiceContext';
import { useQuote } from '@/contexts/QuoteContext';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { supabase } from '@/integrations/supabase/client';
import type { Motor } from '@/lib/motor-helpers';

interface VoiceChatButtonProps {
  motor: Motor;
  className?: string;
  size?: 'sm' | 'md';
  showCoachMark?: boolean;
  onInteraction?: () => void;
}

// Pre-warm edge functions on hover
const preWarmFunctions = () => {
  supabase.functions.invoke('elevenlabs-conversation-token', {
    body: { prefetch: true }
  }).catch(() => {});
};

export function VoiceChatButton({ 
  motor, 
  className,
  size = 'sm',
  showCoachMark = false,
  onInteraction
}: VoiceChatButtonProps) {
  const voice = useVoiceSafe();
  const { dispatch } = useQuote();
  const { triggerHaptic } = useHapticFeedback();

  const isConnected = voice?.isConnected ?? false;
  const isConnecting = voice?.isConnecting ?? false;
  const isSpeaking = voice?.isSpeaking ?? false;
  const isListening = voice?.isListening ?? false;

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    onInteraction?.();

    // Set motor context first using MotorForQuote format
    dispatch({ 
      type: 'SET_PREVIEW_MOTOR', 
      payload: {
        id: motor.id,
        model: (motor as any).model_display || motor.model,
        horsepower: motor.hp ?? 0,
        msrp: motor.msrp ?? undefined,
        salePrice: motor.price ?? undefined,
        inStock: motor.in_stock ?? undefined
      } as any
    });

    // Start voice chat if not already connected
    if (!isConnected && !isConnecting && voice?.startVoiceChat) {
      voice.startVoiceChat();
    }
  }, [motor, dispatch, triggerHaptic, onInteraction, isConnected, isConnecting, voice]);

  const iconSize = size === 'sm' ? 16 : 20;
  const buttonSize = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';

  // Determine visual state
  const getStateStyles = () => {
    if (isConnecting) {
      return 'bg-amber-50 text-amber-600 border-amber-200';
    }
    if (isSpeaking) {
      return 'bg-green-50 text-green-600 border-green-200';
    }
    if (isListening) {
      return 'bg-red-50 text-red-600 border-red-200';
    }
    if (isConnected) {
      return 'bg-blue-50 text-blue-600 border-blue-200';
    }
    return 'bg-white/90 backdrop-blur-sm text-gray-600 hover:bg-gray-100 border border-gray-200';
  };

  const getTooltipText = () => {
    if (isConnecting) return 'Connecting...';
    if (isSpeaking) return 'Harris is speaking...';
    if (isListening) return 'Listening...';
    if (isConnected) return 'Voice chat active';
    return 'Ask Harris about this motor';
  };

  const getIcon = () => {
    if (isConnecting) {
      return <Loader2 size={iconSize} className="animate-spin" />;
    }
    if (isSpeaking) {
      return <Volume2 size={iconSize} />;
    }
    return <Mic size={iconSize} />;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            onClick={handleClick}
            onMouseEnter={preWarmFunctions}
            className={cn(
              buttonSize,
              'relative rounded-full flex items-center justify-center transition-all duration-200',
              getStateStyles(),
              'active:scale-90',
              className
            )}
            aria-label={getTooltipText()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Pulse ring for active states */}
            <AnimatePresence>
              {(isListening || isSpeaking || isConnecting) && (
                <motion.div
                  className={cn(
                    'absolute inset-0 rounded-full',
                    isListening && 'bg-red-400',
                    isSpeaking && 'bg-green-400',
                    isConnecting && 'bg-amber-400'
                  )}
                  initial={{ opacity: 0.6, scale: 1 }}
                  animate={{ 
                    opacity: [0.6, 0.2, 0.6], 
                    scale: [1, 1.4, 1] 
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                />
              )}
            </AnimatePresence>
            
            {/* Icon */}
            <span className="relative z-10">
              {getIcon()}
            </span>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {getTooltipText()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
