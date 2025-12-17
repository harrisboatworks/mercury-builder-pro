import React, { useState, useEffect } from 'react';
import { MessageSquare, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useQuote } from '@/contexts/QuoteContext';
import { useIsMobileOrTablet } from '@/hooks/use-mobile';
import { useAIChat } from './GlobalAIChat';
import { motion } from 'framer-motion';

interface AIChatButtonProps {
  onOpenChat: () => void;
  isOpen: boolean;
}

export const AIChatButton: React.FC<AIChatButtonProps> = ({ onOpenChat, isOpen }) => {
  const location = useLocation();
  const { state } = useQuote();
  const isMobileOrTablet = useIsMobileOrTablet();
  const { unreadCount, isLoading } = useAIChat();
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showPulse, setShowPulse] = useState(true);

  // Stop pulse after first interaction or after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowPulse(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hasInteracted) {
      setShowPulse(false);
    }
  }, [hasInteracted]);

  // Context-aware button text based on current page
  const getContextualText = () => {
    const path = location.pathname;
    
    // Prioritize preview motor (being viewed) over selected motor
    const activeMotor = state.previewMotor || state.motor;
    
    if (path.includes('/quote/motor-selection') && activeMotor) {
      return `Ask about ${activeMotor.hp}HP`;
    }
    if (path.includes('/quote/summary')) {
      return 'Questions about your quote?';
    }
    if (path.includes('/financing')) {
      return 'Financing questions?';
    }
    if (path.includes('/promotions')) {
      return 'Ask about promotions';
    }
    if (path.includes('/repower')) {
      return 'Ask about repowering';
    }
    return 'Ask Mercury Expert';
  };

  const handleClick = () => {
    setHasInteracted(true);
    onOpenChat();
  };

  // Hide on mobile/tablet (handled by UnifiedMobileBar) or when chat is open
  if (isMobileOrTablet || isOpen) return null;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onClick={handleClick}
      className="fixed bottom-24 right-4 z-40 flex items-center gap-2 px-4 py-3 bg-foreground text-background rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 group"
      aria-label="Open AI Chat Assistant"
    >
      {/* Pulse animation ring */}
      {showPulse && (
        <span className="absolute inset-0 rounded-full bg-foreground/30 animate-ping" />
      )}
      
      {/* Unread badge */}
      {unreadCount > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-lg z-10"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </motion.span>
      )}
      
      {/* Icon or Typing Indicator */}
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
      
      {/* Text - visible on desktop */}
      <span className="text-sm font-medium whitespace-nowrap">
        {isLoading ? 'AI is thinking...' : getContextualText()}
      </span>
    </motion.button>
  );
};
