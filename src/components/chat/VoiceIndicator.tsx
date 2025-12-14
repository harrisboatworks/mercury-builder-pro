import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Volume2, Phone, X } from 'lucide-react';
import { useVoiceSafe } from '@/contexts/VoiceContext';
import { useIsMobileOrTablet } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface VoiceIndicatorProps {
  isChatOpen: boolean;
  onOpenChat: () => void;
}

export const VoiceIndicator: React.FC<VoiceIndicatorProps> = ({ 
  isChatOpen, 
  onOpenChat 
}) => {
  const voice = useVoiceSafe();
  const isMobileOrTablet = useIsMobileOrTablet();

  // Don't render on mobile (uses unified bar) or if voice not available
  if (isMobileOrTablet || !voice) return null;

  const { isConnected, isSpeaking, isListening, endVoiceChat } = voice;

  // Only show when voice is active AND chat is closed
  const shouldShow = isConnected && !isChatOpen;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-24 right-4 z-50 flex items-center gap-2"
        >
          {/* Main indicator pill */}
          <motion.button
            onClick={onOpenChat}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-full",
              "bg-white/95 backdrop-blur-md border shadow-lg",
              "hover:shadow-xl transition-shadow cursor-pointer",
              isSpeaking ? "border-blue-400" : "border-stone-200"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Animated icon */}
            <div className="relative">
              {isSpeaking ? (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <Volume2 className="w-5 h-5 text-blue-500" />
                </motion.div>
              ) : isListening ? (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <Mic className="w-5 h-5 text-green-500" />
                </motion.div>
              ) : (
                <Phone className="w-5 h-5 text-stone-500" />
              )}
              
              {/* Pulse ring */}
              <motion.div
                className={cn(
                  "absolute inset-0 rounded-full",
                  isSpeaking ? "bg-blue-400" : "bg-green-400"
                )}
                animate={{ scale: [1, 2], opacity: [0.4, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            </div>

            {/* Status text */}
            <span className="text-sm font-medium text-stone-700">
              {isSpeaking ? 'Harris is speaking...' : 'Voice chat active'}
            </span>
          </motion.button>

          {/* End call button */}
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              endVoiceChat();
            }}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full",
              "bg-red-500 hover:bg-red-600 text-white shadow-lg",
              "transition-colors"
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="End voice chat"
          >
            <X className="w-4 h-4" />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
