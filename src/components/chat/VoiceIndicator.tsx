import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Volume2, Phone, X, Settings2 } from 'lucide-react';
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
  const [showDebugHint, setShowDebugHint] = useState(false);

  // Don't render on mobile (uses unified bar) or if voice not available
  if (isMobileOrTablet || !voice) return null;

  const { isConnected, isSpeaking, isListening, isSearching, searchingMessage, isThinking, thinkingMessage, endVoiceChat } = voice;

  // Only show when voice is active AND chat is closed
  const shouldShow = isConnected && !isChatOpen;

  const toggleDiagnostics = () => {
    // Simulate keyboard shortcut - dispatch a custom event
    const event = new KeyboardEvent('keydown', {
      key: 'd',
      altKey: true,
      shiftKey: true,
      bubbles: true
    });
    window.dispatchEvent(event);
  };

  const statusText = isSearching
    ? (searchingMessage || 'Checking...')
    : isThinking
      ? (thinkingMessage || 'Hang on...')
      : isSpeaking
        ? 'Harris is speaking...'
        : 'Voice chat active';

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
          {/* Debug button */}
          <motion.button
            onClick={toggleDiagnostics}
            onMouseEnter={() => setShowDebugHint(true)}
            onMouseLeave={() => setShowDebugHint(false)}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full",
              "bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-700",
              "transition-colors shadow-md"
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Open voice diagnostics"
          >
            <Settings2 className="w-4 h-4" />
          </motion.button>
          
          {/* Debug hint tooltip */}
          <AnimatePresence>
            {showDebugHint && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="absolute right-full mr-2 px-2 py-1 bg-stone-800 text-white text-xs rounded whitespace-nowrap"
              >
                Voice diagnostics
              </motion.div>
            )}
          </AnimatePresence>

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
              {isSearching ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                >
                  <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full" />
                </motion.div>
              ) : isThinking ? (
                <motion.div
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                >
                  <Phone className="w-5 h-5 text-amber-600" />
                </motion.div>
              ) : isSpeaking ? (
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
              {!isSearching && !isThinking && (
                <motion.div
                  className={cn(
                    "absolute inset-0 rounded-full",
                    isSpeaking ? "bg-blue-400" : "bg-green-400"
                  )}
                  animate={{ scale: [1, 2], opacity: [0.4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              )}
            </div>

            {/* Status text */}
            <span className="text-sm font-medium text-stone-700">
              {statusText}
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
