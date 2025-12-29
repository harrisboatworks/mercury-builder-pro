import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
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
            'absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50',
            className
          )}
        >
          {/* Coach mark card - premium minimal design */}
          <div className="relative bg-gray-900/95 backdrop-blur-sm text-white px-4 py-2.5 rounded-xl shadow-xl">
            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors"
              aria-label="Dismiss"
            >
              <X size={10} className="text-white" />
            </button>

            {/* Simple content - single line */}
            <div className="flex items-center gap-2 whitespace-nowrap pr-2">
              {/* Pulsing dot indicator */}
              <motion.div 
                className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <p className="text-xs font-medium">Ask Harris by voice</p>
            </div>

            {/* Arrow pointing down - centered */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-gray-900/95" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
