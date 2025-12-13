import React from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MessageReactionsProps {
  messageId: string;
  currentReaction: 'thumbs_up' | 'thumbs_down' | null;
  onReact: (messageId: string, reaction: 'thumbs_up' | 'thumbs_down' | null) => void;
}

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  messageId,
  currentReaction,
  onReact,
}) => {
  const handleReaction = (reaction: 'thumbs_up' | 'thumbs_down') => {
    // Toggle off if already selected, otherwise set new reaction
    const newReaction = currentReaction === reaction ? null : reaction;
    onReact(messageId, newReaction);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="flex items-center gap-1 mt-1.5"
    >
      <span className="text-[10px] text-gray-400 mr-1">Was this helpful?</span>
      
      <button
        onClick={() => handleReaction('thumbs_up')}
        className={`p-1.5 rounded-full transition-all duration-200 ${
          currentReaction === 'thumbs_up'
            ? 'bg-emerald-100 text-emerald-600'
            : 'text-gray-400 hover:text-emerald-500 hover:bg-emerald-50'
        }`}
        aria-label="Helpful"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentReaction === 'thumbs_up' ? 'filled' : 'empty'}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <ThumbsUp 
              className="w-3.5 h-3.5" 
              fill={currentReaction === 'thumbs_up' ? 'currentColor' : 'none'}
            />
          </motion.div>
        </AnimatePresence>
      </button>

      <button
        onClick={() => handleReaction('thumbs_down')}
        className={`p-1.5 rounded-full transition-all duration-200 ${
          currentReaction === 'thumbs_down'
            ? 'bg-red-100 text-red-500'
            : 'text-gray-400 hover:text-red-400 hover:bg-red-50'
        }`}
        aria-label="Not helpful"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentReaction === 'thumbs_down' ? 'filled' : 'empty'}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <ThumbsDown 
              className="w-3.5 h-3.5" 
              fill={currentReaction === 'thumbs_down' ? 'currentColor' : 'none'}
            />
          </motion.div>
        </AnimatePresence>
      </button>
    </motion.div>
  );
};
