import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Volume2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VoiceHeaderButtonProps {
  isConnected: boolean;
  isConnecting: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  onStart: () => void;
  onEnd: () => void;
}

export const VoiceHeaderButton: React.FC<VoiceHeaderButtonProps> = ({
  isConnected,
  isConnecting,
  isSpeaking,
  isListening,
  onStart,
  onEnd,
}) => {
  const handleClick = () => {
    if (isConnected) {
      onEnd();
    } else {
      onStart();
    }
  };

  const getLabel = () => {
    if (isConnecting) return 'Connecting...';
    if (isSpeaking) return 'LIVE';
    if (isListening) return 'LIVE';
    return 'Voice';
  };

  const getIcon = () => {
    if (isConnecting) {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }
    if (isSpeaking) {
      return <Volume2 className="w-4 h-4" />;
    }
    return <Mic className="w-4 h-4" />;
  };

  const isActive = isConnected && (isSpeaking || isListening);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            onClick={handleClick}
            disabled={isConnecting}
            className={cn(
              'relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
              isConnecting
                ? 'bg-amber-100 text-amber-700'
                : isActive
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm hover:shadow-md'
            )}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {/* Active pulse animation */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-emerald-400"
                  initial={{ opacity: 0.5, scale: 1 }}
                  animate={{ opacity: 0, scale: 1.3 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </AnimatePresence>

            {/* Icon */}
            <span className="relative z-10">{getIcon()}</span>
            
            {/* Label */}
            <span className="relative z-10">{getLabel()}</span>

            {/* Live indicator dot */}
            {isActive && (
              <motion.span
                className="relative z-10 w-2 h-2 rounded-full bg-red-500"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{isConnected ? 'End voice chat' : 'Talk to Harris'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
