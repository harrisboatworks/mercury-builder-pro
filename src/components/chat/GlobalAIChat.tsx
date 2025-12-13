import React, { useState, useRef, createContext, useContext } from 'react';
import { AIChatButton } from './AIChatButton';
import { EnhancedChatWidget, EnhancedChatWidgetHandle } from './EnhancedChatWidget';

interface AIChtatContextType {
  openChat: (initialMessage?: string) => void;
  closeChat: () => void;
  isOpen: boolean;
}

const AIChatContext = createContext<AIChtatContextType | null>(null);

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

  const openChat = (message?: string) => {
    setInitialMessage(message);
    setIsOpen(true);
  };

  const closeChat = () => {
    setIsOpen(false);
    setInitialMessage(undefined);
  };

  return (
    <AIChatContext.Provider value={{ openChat, closeChat, isOpen }}>
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
