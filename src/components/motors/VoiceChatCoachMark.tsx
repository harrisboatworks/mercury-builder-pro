import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceChatCoachMarkProps {
  show: boolean;
  onDismiss: () => void;
  className?: string;
}

export function VoiceChatCoachMark({ 
  show, 
  onDismiss,
  className 
}: VoiceChatCoachMarkProps) {
  const [visible, setVisible] = useState(false);

  // Delay appearance
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => setVisible(true), 2500);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [show]);

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.95 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className={cn(
            'absolute left-0 bottom-full mb-2 z-50',
            className
          )}
        >
          {/* Coach mark card */}
          <div className="relative bg-gray-900/95 backdrop-blur-sm text-white px-4 py-3 rounded-xl shadow-xl max-w-[200px]">
            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="absolute -top-2 -right-2 w-5 h-5 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors"
              aria-label="Dismiss"
            >
              <X size={10} className="text-white" />
            </button>

            {/* Content */}
            <div className="flex items-start gap-3">
              {/* Animated mic icon */}
              <motion.div 
                className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Mic size={14} className="text-blue-400" />
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium leading-relaxed">
                  Tap to talk to Harris about this motor
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  Voice-powered AI assistant
                </p>
              </div>
            </div>

            {/* Arrow pointing down */}
            <div className="absolute left-4 -bottom-2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-gray-900/95" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
