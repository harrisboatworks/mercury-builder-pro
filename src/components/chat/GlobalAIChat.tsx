import React, { useState, useRef, createContext, useContext, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AIChatButton } from './AIChatButton';
import { EnhancedChatWidget, EnhancedChatWidgetHandle } from './EnhancedChatWidget';
import { ProactiveChatNudge } from './ProactiveChatNudge';
import { useBehaviorTriggers } from '@/hooks/useBehaviorTriggers';
import { useNudgeExperiment } from '@/hooks/useNudgeExperiment';

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
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState<string | undefined>();
  const chatRef = useRef<EnhancedChatWidgetHandle>(null);
  const hasTrackedImpressionRef = useRef(false);

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
    triggerType,
    variants,
    timeOnPage,
    scrollDepth,
    dismissNudge 
  } = useBehaviorTriggers(isOpen);

  // A/B testing experiment hook
  const {
    variantId,
    message: experimentMessage,
    isGraduatedWinner,
    explorationMode,
    trackImpression,
    trackAccept,
    trackDismiss,
    trackAutoDismiss,
    isReady
  } = useNudgeExperiment(location.pathname, triggerType, variants);

  // Track impression when nudge becomes visible
  useEffect(() => {
    if (shouldShowNudge && isReady && !hasTrackedImpressionRef.current) {
      hasTrackedImpressionRef.current = true;
      trackImpression(timeOnPage, scrollDepth);
    }
  }, [shouldShowNudge, isReady, trackImpression, timeOnPage, scrollDepth]);

  // Reset impression tracking when trigger changes
  useEffect(() => {
    hasTrackedImpressionRef.current = false;
  }, [triggerType]);

  const handleNudgeAccept = useCallback(async () => {
    await trackAccept();
    dismissNudge();
    openChat(experimentMessage);
  }, [trackAccept, dismissNudge, openChat, experimentMessage]);

  const handleNudgeDismiss = useCallback(async () => {
    await trackDismiss();
    dismissNudge();
  }, [trackDismiss, dismissNudge]);

  const handleNudgeAutoDismiss = useCallback(async () => {
    await trackAutoDismiss();
    dismissNudge();
  }, [trackAutoDismiss, dismissNudge]);

  return (
    <AIChatContext.Provider value={{ openChat, closeChat, isOpen }}>
      {children}
      
      {/* Proactive Chat Nudge with A/B tested message */}
      <ProactiveChatNudge
        isVisible={shouldShowNudge && isReady}
        message={experimentMessage}
        variantId={variantId}
        onAccept={handleNudgeAccept}
        onDismiss={handleNudgeDismiss}
        onAutoDismiss={handleNudgeAutoDismiss}
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
