import React, { useState, useRef, createContext, useContext, useCallback } from 'react';
import { AIChatButton } from './AIChatButton';
import { EnhancedChatWidget, EnhancedChatWidgetHandle } from './EnhancedChatWidget';
import { InlineChatDrawer } from './InlineChatDrawer';
import { useIsMobileOrTablet } from '@/hooks/use-mobile';

interface AIChatContextType {
  openChat: (initialMessage?: string) => void;
  closeChat: () => void;
  isOpen: boolean;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
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
  const [isLoading, setIsLoading] = useState(false);
  const [initialMessage, setInitialMessage] = useState<string | undefined>();
  const chatRef = useRef<EnhancedChatWidgetHandle>(null);
  const isMobileOrTablet = useIsMobileOrTablet();

  const openChat = useCallback((message?: string) => {
    setInitialMessage(message);
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setInitialMessage(undefined);
  }, []);

  return (
    <AIChatContext.Provider value={{ openChat, closeChat, isOpen, isLoading, setIsLoading }}>
      {children}
      
      {/* Floating AI Button - Only show on desktop (mobile uses unified bar) */}
      {!isMobileOrTablet && (
        <AIChatButton 
          onOpenChat={() => openChat()} 
          isOpen={isOpen} 
        />
      )}
      
      {/* Chat Widget - Inline drawer on mobile, floating widget on desktop */}
      {isMobileOrTablet ? (
        <InlineChatDrawer
          isOpen={isOpen}
          onClose={closeChat}
          initialMessage={initialMessage}
          onLoadingChange={setIsLoading}
        />
      ) : (
        <EnhancedChatWidget
          ref={chatRef}
          isOpen={isOpen}
          onClose={closeChat}
          initialMessage={initialMessage}
          onLoadingChange={setIsLoading}
        />
      )}
    </AIChatContext.Provider>
  );
};
