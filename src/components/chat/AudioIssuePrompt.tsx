import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AudioIssuePromptProps {
  show: boolean;
  onEnableAudio: () => void;
  onDismiss: () => void;
}

export const AudioIssuePrompt: React.FC<AudioIssuePromptProps> = ({
  show,
  onEnableAudio,
  onDismiss,
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-4 max-w-sm w-[calc(100%-2rem)]"
        >
          <button
            onClick={onDismiss}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-amber-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 text-sm">Can't hear Harris?</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Your browser may be blocking audio. Tap below to enable.
              </p>
              
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={onEnableAudio}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Volume2 className="w-4 h-4 mr-1.5" />
                  Enable Audio
                </Button>
                
                <Button
                  onClick={onDismiss}
                  size="sm"
                  variant="ghost"
                  className="text-gray-500"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
