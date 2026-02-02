import React, { useState, useRef, createContext, useContext, useCallback, useEffect } from 'react';
import { EnhancedChatWidget, EnhancedChatWidgetHandle } from './EnhancedChatWidget';
import { InlineChatDrawer } from './InlineChatDrawer';
import { VoiceIndicator } from './VoiceIndicator';
import { VoiceProvider } from '@/contexts/VoiceContext';
import { useIsMobileOrTablet } from '@/hooks/use-mobile';
import { DesktopCommandBar } from './DesktopCommandBar';

interface AIChatContextType {
  openChat: (initialMessage?: string) => void;
  closeChat: () => void;
  isOpen: boolean;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  unreadCount: number;
  incrementUnread: () => void;
  clearUnread: () => void;
  chatMinimizedAt: number | null;
  notifyChatMinimized: () => void;
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
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatMinimizedAt, setChatMinimizedAt] = useState<number | null>(null);
  const chatRef = useRef<EnhancedChatWidgetHandle>(null);
  const minimizedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMobileOrTablet = useIsMobileOrTablet();

  const openChat = useCallback((message?: string) => {
    setInitialMessage(message);
    setIsOpen(true);
    setUnreadCount(0); // Clear unread when opening
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setInitialMessage(undefined);
  }, []);

  const incrementUnread = useCallback(() => {
    if (!isOpen) {
      setUnreadCount(prev => prev + 1);
    }
  }, [isOpen]);

  const clearUnread = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const notifyChatMinimized = useCallback(() => {
    // Clear any existing timer
    if (minimizedTimerRef.current) {
      clearTimeout(minimizedTimerRef.current);
    }
    setChatMinimizedAt(Date.now());
    // Auto-clear after 30 seconds
    minimizedTimerRef.current = setTimeout(() => {
      setChatMinimizedAt(null);
    }, 30000);
  }, []);

  // Listen for voice agent requests to trigger text chat search
  useEffect(() => {
    const handleVoiceSearch = (e: CustomEvent<{ query: string }>) => {
      console.log('[Voice→Chat] Received search trigger:', e.detail.query);
      openChat(e.detail.query);
    };
    
    window.addEventListener('voice-trigger-text-search', handleVoiceSearch as EventListener);
    return () => window.removeEventListener('voice-trigger-text-search', handleVoiceSearch as EventListener);
  }, [openChat]);

  return (
    <VoiceProvider>
      <AIChatContext.Provider value={{ openChat, closeChat, isOpen, isLoading, setIsLoading, unreadCount, incrementUnread, clearUnread, chatMinimizedAt, notifyChatMinimized }}>
        {children}
        
        {/* Desktop Command Bar - Only show on desktop (mobile uses unified bar) */}
        {!isMobileOrTablet && (
          <DesktopCommandBar 
            onOpenChat={() => openChat()} 
            isChatOpen={isOpen} 
          />
        )}
        
        {/* Voice Indicator - Shows when voice active but chat minimized */}
        <VoiceIndicator isChatOpen={isOpen} onOpenChat={() => openChat()} />
        
        {/* Chat Widget - Inline drawer on mobile, floating widget on desktop */}
        {isMobileOrTablet ? (
          <InlineChatDrawer
            isOpen={isOpen}
            onClose={closeChat}
            initialMessage={initialMessage}
            onLoadingChange={setIsLoading}
            onAIResponse={incrementUnread}
          />
        ) : (
          <EnhancedChatWidget
            ref={chatRef}
            isOpen={isOpen}
            onClose={closeChat}
            initialMessage={initialMessage}
            onLoadingChange={setIsLoading}
            onAIResponse={incrementUnread}
          />
        )}
      </AIChatContext.Provider>
    </VoiceProvider>
  );
};
