import React, { useState, useRef, createContext, useContext, useCallback } from 'react';
import { AIChatButton } from './AIChatButton';
import { EnhancedChatWidget, EnhancedChatWidgetHandle } from './EnhancedChatWidget';
import { ProactiveChatNudge } from './ProactiveChatNudge';
import { useBehaviorTriggers } from '@/hooks/useBehaviorTriggers';

interface AIChatContextType {
  openChat: (initialMessage?: string) => void;
  closeChat: () => void;
  isOpen: boolean;
}

const AIChatContext = createContext<AIChatContextType | null>(null);

export const useAIChat = () => {
  const context = useContext(AIChatContext);
  if (!context) {
    throw new Error('useAIChat must be used within AIChatProvider');
  }
  return context;
};

export const GlobalAIChat: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState<string | undefined>();
  const chatRef = useRef<EnhancedChatWidgetHandle>(null);

  const openChat = useCallback((message?: string) => {
    setInitialMessage(message);
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setInitialMessage(undefined);
  }, []);

  // Proactive behavior triggers
  const { 
    shouldShowNudge, 
    nudgeMessage, 
    dismissNudge 
  } = useBehaviorTriggers(isOpen);

  const handleNudgeAccept = useCallback(() => {
    dismissNudge();
    openChat(nudgeMessage);
  }, [dismissNudge, openChat, nudgeMessage]);

  return (
    <AIChatContext.Provider value={{ openChat, closeChat, isOpen }}>
      {children}
      
      {/* Proactive Chat Nudge */}
      <ProactiveChatNudge
        isVisible={shouldShowNudge}
        message={nudgeMessage}
        onAccept={handleNudgeAccept}
        onDismiss={dismissNudge}
      />
      
      {/* Floating AI Button */}
      <AIChatButton 
        onOpenChat={() => openChat()} 
        isOpen={isOpen} 
      />
      
      {/* Chat Widget */}
      <EnhancedChatWidget
        ref={chatRef}
        isOpen={isOpen}
        onClose={closeChat}
        initialMessage={initialMessage}
      />
    </AIChatContext.Provider>
  );
};
