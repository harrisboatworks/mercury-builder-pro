import React, { useState, useEffect } from 'react';
import { MessageSquare, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAIChat } from './GlobalAIChat';
import { motion } from 'framer-motion';
import { getMobileLauncherBottom } from './chatLayout';

interface AIChatButtonProps {
  onOpenChat: () => void;
  isOpen: boolean;
}

export const AIChatButton: React.FC<AIChatButtonProps> = ({ onOpenChat, isOpen }) => {
  const location = useLocation();
  const isPhone = useIsMobile();
  const { unreadCount, isLoading } = useAIChat();
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showPulse, setShowPulse] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowPulse(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hasInteracted) setShowPulse(false);
  }, [hasInteracted]);

  const handleClick = () => {
    setHasInteracted(true);
    onOpenChat();
  };

  if (isOpen) return null;

  const positionClass = isPhone ? 'left-4' : 'right-4';
  const bottom = isPhone
    ? getMobileLauncherBottom(location.pathname)
    : '1rem';

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onClick={handleClick}
      style={{ bottom }}
      className={`fixed ${positionClass} z-40 flex items-center justify-center h-12 w-12 bg-foreground text-background rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 group`}
      aria-label="Open Mercury Expert chat"
    >
      {showPulse && (
        <span className="absolute inset-0 rounded-full bg-foreground/30 animate-ping" />
      )}

      {unreadCount > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-lg z-10"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </motion.span>
      )}

      <div className="relative flex items-center justify-center w-6 h-6">
        {isLoading ? (
          <div className="flex gap-0.5 items-center">
            {[0, 1, 2].map(i => (
              <motion.span
                key={i}
                className="w-1.5 h-1.5 bg-background rounded-full"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
          </div>
        ) : (
          <>
            <MessageSquare className="w-5 h-5 transition-transform group-hover:scale-110" />
            <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-amber-400" />
          </>
        )}
      </div>
    </motion.button>
  );
};
