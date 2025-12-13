import React, { useState, useRef, createContext, useContext, useCallback } from 'react';
import { AIChatButton } from './AIChatButton';
import { EnhancedChatWidget, EnhancedChatWidgetHandle } from './EnhancedChatWidget';

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
