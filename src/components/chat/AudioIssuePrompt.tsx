import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, X, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AudioIssuePromptProps {
  show: boolean;
  onEnableAudio: () => void;
  onDismiss: () => void;
  onSwitchToText?: () => void;
}

export const AudioIssuePrompt: React.FC<AudioIssuePromptProps> = ({
  show,
  onEnableAudio,
  onDismiss,
  onSwitchToText,
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-background rounded-xl shadow-xl border border-border p-4 max-w-sm w-[calc(100%-2rem)]"
        >
          <button
            onClick={onDismiss}
            className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <VolumeX className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground">Can't hear Harris?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your browser may be blocking audio playback. Tap the button below to enable sound.
              </p>
              
              <div className="flex flex-col gap-2 mt-4">
                <Button
                  onClick={onEnableAudio}
                  size="default"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
                >
                  <Volume2 className="w-4 h-4 mr-2" />
                  Tap to Enable Audio
                </Button>
                
                {onSwitchToText && (
                  <Button
                    onClick={onSwitchToText}
                    variant="outline"
                    size="default"
                    className="w-full"
                  >
                    Switch to Text Chat
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-2 mt-3">
                <a
                  href="/voice-test"
                  className="text-xs text-primary hover:underline"
                >
                  Run voice diagnostics →
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
