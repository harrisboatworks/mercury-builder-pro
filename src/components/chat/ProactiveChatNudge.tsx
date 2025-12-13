import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProactiveChatNudgeProps {
  isVisible: boolean;
  message: string;
  onAccept: () => void;
  onDismiss: () => void;
}

const AUTO_DISMISS_DELAY = 12000; // 12 seconds

export const ProactiveChatNudge: React.FC<ProactiveChatNudgeProps> = ({
  isVisible,
  message,
  onAccept,
  onDismiss
}) => {
  const [progress, setProgress] = useState(100);

  // Auto-dismiss timer with progress
  useEffect(() => {
    if (!isVisible) {
      setProgress(100);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / AUTO_DISMISS_DELAY) * 100);
      setProgress(remaining);

      if (remaining === 0) {
        onDismiss();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isVisible, onDismiss]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="fixed bottom-24 right-4 sm:right-6 z-40 max-w-[320px]"
        >
          <div className="relative bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl overflow-hidden">
            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-muted">
              <motion.div 
                className="h-full bg-primary/40"
                initial={{ width: '100%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.05 }}
              />
            </div>

            <div className="p-4">
              {/* Header with dismiss */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">Harris Assistant</span>
                </div>
                <button
                  onClick={onDismiss}
                  className="p-1 rounded-full hover:bg-muted transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Message */}
              <p className="text-sm text-foreground mb-4 leading-relaxed">
                {message}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={onAccept}
                  size="sm"
                  className="flex-1 gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat Now
                </Button>
                <Button
                  onClick={onDismiss}
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground"
                >
                  Not now
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
