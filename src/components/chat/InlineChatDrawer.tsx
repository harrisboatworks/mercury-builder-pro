import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Send, RefreshCw, ChevronDown, Sparkles, Check } from 'lucide-react';
import { parseMessageText, ParsedSegment } from '@/lib/textParser';
import harrisLogo from '@/assets/harris-logo.png';
import mercuryLogo from '@/assets/mercury-logo.png';
import { useLocation } from 'react-router-dom';
import { useQuote } from '@/contexts/QuoteContext';
import { useMotorViewSafe } from '@/contexts/MotorViewContext';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { streamChat, detectComparisonQuery } from '@/lib/streamParser';
import { getContextualPrompts } from './getContextualPrompts';
import { getMotorSpecificPrompts, refreshMotorPrompts, getMotorContextLabel } from './getMotorSpecificPrompts';
import { MotorComparisonCard } from './MotorComparisonCard';

import { useChatPersistence, PersistedMessage } from '@/hooks/useChatPersistence';
import { useCrossChannelContext, VoiceContextForText } from '@/hooks/useCrossChannelContext';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useRotatingPrompts } from '@/hooks/useRotatingPrompts';
import { cn } from '@/lib/utils';
import { VoiceButton } from './VoiceButton';
import { useVoice } from '@/contexts/VoiceContext';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isStreaming?: boolean;
  reaction?: 'thumbs_up' | 'thumbs_down' | null;
  comparisonData?: {
    motor1: { model: string; hp: number; price: number };
    motor2: { model: string; hp: number; price: number };
    recommendation?: string;
  };
}

interface InlineChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
  onLoadingChange?: (loading: boolean) => void;
  onAIResponse?: () => void;
}

// Typing indicator with bouncing dots
const TypingIndicator = () => (
  <div className="flex items-center gap-1 px-2 py-1">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="w-2 h-2 bg-gray-400 rounded-full"
        animate={{ y: [0, -6, 0] }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          delay: i * 0.15,
          ease: "easeInOut"
        }}
      />
    ))}
  </div>
);

export const InlineChatDrawer: React.FC<InlineChatDrawerProps> = ({
  isOpen,
  onClose,
  initialMessage,
  onLoadingChange,
  onAIResponse
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [sendState, setSendState] = useState<'idle' | 'sending' | 'success'>('idle');
  
  // Track which motor the user has already interacted with (asked questions about)
  const [interactedMotorId, setInteractedMotorId] = useState<string | null>(null);
  
  // Track if a prompt was selected (to auto-hide prompts after selection)
  const [promptSelected, setPromptSelected] = useState(false);
  
  // Track motor banner visibility with auto-hide
  const [showMotorBanner, setShowMotorBanner] = useState(false);
  const bannerTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const setIsLoading = useCallback((loading: boolean) => {
    setIsLoadingLocal(loading);
    onLoadingChange?.(loading);
  }, [onLoadingChange]);
  
  const isLoading = isLoadingLocal;
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [showHistoryBanner, setShowHistoryBanner] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Keyboard-aware positioning for iOS
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    
    const handleResize = () => {
      // Keyboard is likely open if viewport height is significantly less than window height
      const isKeyboard = viewport.height < window.innerHeight * 0.75;
      setKeyboardVisible(isKeyboard);
    };
    
    viewport.addEventListener('resize', handleResize);
    viewport.addEventListener('scroll', handleResize);
    return () => {
      viewport.removeEventListener('resize', handleResize);
      viewport.removeEventListener('scroll', handleResize);
    };
  }, []);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messageIdMap = useRef<Map<string, string>>(new Map());
  
  const location = useLocation();
  const { state } = useQuote();
  const motorViewContext = useMotorViewSafe();
  const setShowQuiz = motorViewContext?.setShowQuiz;
  const { triggerHaptic } = useHapticFeedback();
  const prevIsOpenRef = useRef(isOpen);
  
  const {
    isLoading: isPersistenceLoading,
    hasHistory,
    loadMessages,
    saveMessage,
    updateReaction,
    clearConversation,
  } = useChatPersistence();

  // Cross-channel context for voice-text handoff
  const { loadVoiceContextForText } = useCrossChannelContext();
  const [voiceContext, setVoiceContext] = useState<VoiceContextForText | null>(null);

  // Voice chat integration - use global context for persistence
  const voice = useVoice();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Scroll to bottom when chat opens to show latest messages
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => scrollToBottom(), 150);
    }
  }, [isOpen]);

  // Haptic feedback on open/close transitions
  useEffect(() => {
    if (prevIsOpenRef.current !== isOpen) {
      if (isOpen) {
        triggerHaptic('medium'); // Engaging open feedback
      } else {
        triggerHaptic('light'); // Subtle close feedback
      }
      prevIsOpenRef.current = isOpen;
    }
  }, [isOpen, triggerHaptic]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Slight delay to allow drawer animation
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Get contextual prompts based on motor and page
  const contextualPrompts = useMemo(() => {
    // Use preview motor (currently viewing) or selected motor
    const activeMotor = state.previewMotor || state.motor;
    const motor = activeMotor ? {
      model: activeMotor.model || '',
      hp: activeMotor.hp || 0
    } : null;
    
    return getContextualPrompts(motor, state.boatInfo, location.pathname);
  }, [state.previewMotor, state.motor, state.boatInfo, location.pathname]);

  // Get contextual welcome message - friendly and conversational
  const getWelcomeMessage = (): string => {
    const path = location.pathname;
    const activeMotor = state.previewMotor || state.motor;
    
    // If they're looking at a specific motor
    if (activeMotor) {
      const hp = activeMotor.hp || 0;
      const family = activeMotor.model?.toLowerCase().includes('verado') ? 'Verado' :
                     activeMotor.model?.toLowerCase().includes('pro xs') ? 'Pro XS' :
                     'FourStroke';
      return `Hey! Checking out the ${hp}HP ${family}? Solid choice — what do you want to know about it?`;
    }
    
    // Page-specific greetings
    if (path.includes('/quote/options')) {
      return "Hey! Need help picking a package? I can break down what's in each one.";
    }
    if (path.includes('/quote/purchase-path')) {
      return "Hey! Deciding between pro install or DIY? I can walk you through the options.";
    }
    if (path.includes('/quote/boat-info')) {
      return "Hey! Got questions about compatibility or controls? I'm here to help.";
    }
    if (path.includes('/quote/trade-in')) {
      return "Hey! Got something to trade? Tell me what you've got and I'll give you a ballpark.";
    }
    if (path.includes('/quote/summary')) {
      return "Hey! Looking over your quote? Let me know if you have any questions about pricing or next steps.";
    }
    if (path.includes('/financing')) {
      return "Hey! Curious about financing? I can help you figure out monthly payments and options.";
    }
    if (path.includes('/promotions')) {
      return "Hey! Looking at the current deals? I can help you find the best one for what you need.";
    }
    if (path.includes('/repower')) {
      return "Hey! Thinking about repowering? Tell me about your boat — I'll help you figure out if it makes sense and what motor would work best.";
    }
    
    // Default friendly greeting
    return "Hey! I'm here to help you find the perfect Mercury motor. What are you looking for?";
  };

  // Convert persisted messages to UI format
  const convertPersistedMessages = useCallback((persisted: PersistedMessage[]): Message[] => {
    return persisted.map(msg => {
      const localId = `db_${msg.id}`;
      messageIdMap.current.set(localId, msg.id);
      return {
        id: localId,
        text: msg.content,
        isUser: msg.role === 'user',
        timestamp: new Date(msg.created_at),
        reaction: msg.reaction,
      };
    });
  }, []);

  // Get page category for context-aware chat reset
  const getPageCategory = (pathname: string): string => {
    if (pathname.includes('/repower')) return 'repower';
    if (pathname.includes('/quote/')) return 'quote';
    if (pathname.includes('/financing')) return 'financing';
    if (pathname.includes('/promotions')) return 'promotions';
    if (pathname.includes('/contact')) return 'contact';
    return 'general';
  };

  // Load history and initialize - with context-aware reset
  useEffect(() => {
    const initChat = async () => {
      if (!isOpen || hasInitialized || isPersistenceLoading) return;
      
      const currentCategory = getPageCategory(location.pathname);
      const storedCategory = localStorage.getItem('chat_page_category');
      
      // Check if page context changed significantly (different category)
      const contextChanged = storedCategory && storedCategory !== currentCategory;
      
      const persistedMessages = await loadMessages();
      
      // If context changed significantly and we have old history, start fresh
      if (contextChanged && persistedMessages.length > 0) {
        console.log(`[Chat] Context changed from ${storedCategory} to ${currentCategory}, starting fresh`);
        await clearConversation();
        localStorage.setItem('chat_page_category', currentCategory);
        
        const welcomeMessage: Message = {
          id: 'welcome_' + Date.now(),
          text: getWelcomeMessage(),
          isUser: false,
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
        
        const dbId = await saveMessage(welcomeMessage.text, 'assistant');
        if (dbId) messageIdMap.current.set(welcomeMessage.id, dbId);
        
        setHasInitialized(true);
        return;
      }
      
      if (persistedMessages.length > 0) {
        const loadedMessages = convertPersistedMessages(persistedMessages);
        setMessages(loadedMessages);
        setShowHistoryBanner(true);
        
        const history = persistedMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        setConversationHistory(history);
      } else {
        localStorage.setItem('chat_page_category', currentCategory);
        const welcomeMessage: Message = {
          id: 'welcome',
          text: getWelcomeMessage(),
          isUser: false,
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
        
        const dbId = await saveMessage(welcomeMessage.text, 'assistant');
        if (dbId) messageIdMap.current.set(welcomeMessage.id, dbId);
      }
      
      setHasInitialized(true);
    };
    
    initChat();
  }, [isOpen, hasInitialized, isPersistenceLoading, loadMessages, convertPersistedMessages, saveMessage, clearConversation, location.pathname]);

  // Handle new initial messages (when chat reopens with a REAL question from search bar)
  const initialMessageSentRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Skip legacy motor context markers - context now flows through QuoteContext.previewMotor
    if (initialMessage?.startsWith('__MOTOR_CONTEXT__:')) return;
    
    if (isOpen && hasInitialized && initialMessage && !isLoading && initialMessageSentRef.current !== initialMessage) {
      initialMessageSentRef.current = initialMessage;
      setTimeout(() => handleSend(initialMessage), 300);
    }
  }, [initialMessage, isOpen, hasInitialized, isLoading]);
  
  // Get active motor from quote context (previewMotor is set by AskQuestionButton)
  const activeMotor = state.previewMotor || state.motor;
  const motorPromptContext = useMemo(() => {
    if (activeMotor) {
      return { 
        hp: activeMotor.hp || 0, 
        model: activeMotor.model || '',
        family: (activeMotor as any).family || ''
      };
    }
    return null;
  }, [activeMotor]);

  // Use rotating prompts hook - refreshes every 45 seconds when idle
  const { prompts: rotatingPrompts, isRotating: promptsRotating } = useRotatingPrompts({
    context: motorPromptContext,
    rotationInterval: 45000,
    promptCount: 4,
    enabled: isOpen && messages.length <= 2,
  });
  
  // Fall back to contextual prompts if no motor context
  const smartPrompts = motorPromptContext ? rotatingPrompts : contextualPrompts;

  // Detect if motor context changed (to show fresh prompts for new motor)
  const currentMotorId = (state.previewMotor as any)?.id || (state.motor as any)?.id || null;
  const shouldShowMotorPrompts = currentMotorId && currentMotorId !== interactedMotorId;

  // Get current motor context label for banner (from previewMotor set by AskQuestionButton)
  // Use model_display for specific variant info (e.g., "6 MLH FourStroke" includes shaft length, start type)
  const currentMotorLabel = useMemo(() => {
    if (!activeMotor) return null;
    const modelName = (activeMotor as any).model_display || activeMotor.model;
    return getMotorContextLabel(activeMotor.hp || 0, modelName);
  }, [activeMotor]);

  // Show banner briefly when motor context changes, then auto-hide after 4 seconds
  // Also clear conversation history when motor changes to prevent AI confusion
  const prevMotorIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (currentMotorId && currentMotorId !== prevMotorIdRef.current) {
      // Clear existing timer
      if (bannerTimerRef.current) {
        clearTimeout(bannerTimerRef.current);
      }
      
      // If switching from one motor to another, clear conversation history
      // to prevent AI from getting confused by old motor context
      if (prevMotorIdRef.current && conversationHistory.length > 0) {
        setConversationHistory([]);
        // Keep only welcome message when motor changes
        setMessages(prev => {
          const welcome = prev.find(m => m.id.startsWith('welcome'));
          return welcome ? [welcome] : [];
        });
        messageIdMap.current.clear();
      }
      
      // Show banner
      setShowMotorBanner(true);
      // Auto-hide after 4 seconds
      bannerTimerRef.current = setTimeout(() => {
        setShowMotorBanner(false);
      }, 4000);
      prevMotorIdRef.current = currentMotorId;
    }
    return () => {
      if (bannerTimerRef.current) {
        clearTimeout(bannerTimerRef.current);
      }
    };
  }, [currentMotorId, conversationHistory.length]);

  // Reset promptSelected when motor context changes so new motors show their prompts
  useEffect(() => {
    if (currentMotorId !== prevMotorIdRef.current) {
      setPromptSelected(false);
    }
  }, [currentMotorId]);

  const handleReaction = useCallback(async (messageId: string, reaction: 'thumbs_up' | 'thumbs_down' | null) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, reaction } : msg
    ));
    
    const dbId = messageIdMap.current.get(messageId);
    if (dbId) {
      await updateReaction(dbId, reaction);
    }
  }, [updateReaction]);

  const handleStartFresh = useCallback(async () => {
    await clearConversation();
    setMessages([]);
    setConversationHistory([]);
    setShowHistoryBanner(false);
    messageIdMap.current.clear();
    
    const welcomeMessage: Message = {
      id: 'welcome_' + Date.now(),
      text: getWelcomeMessage(),
      isUser: false,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
    
    const dbId = await saveMessage(welcomeMessage.text, 'assistant');
    if (dbId) messageIdMap.current.set(welcomeMessage.id, dbId);
  }, [clearConversation, saveMessage]);

  const handleSend = async (text: string = inputText) => {
    if (!text.trim() || isLoading) return;

    setSendState('sending');
    triggerHaptic('messageSent');

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setShowHistoryBanner(false);

    const userDbId = await saveMessage(userMessage.text, 'user');
    if (userDbId) messageIdMap.current.set(userMessage.id, userDbId);
    
    // Brief success flash after message saved
    setSendState('success');
    setTimeout(() => setSendState('idle'), 400);

    const streamingId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: streamingId,
      text: '',
      isUser: false,
      timestamp: new Date(),
      isStreaming: true
    }]);

    const comparison = detectComparisonQuery(text.trim());

    try {
      let fullResponse = '';
      
      const activeMotor = state.previewMotor || state.motor;
      const quoteProgress = {
        step: location.pathname.includes('motor-selection') ? 1 :
              location.pathname.includes('options') ? 2 :
              location.pathname.includes('purchase-path') ? 3 :
              location.pathname.includes('trade-in') ? 4 :
              location.pathname.includes('schedule') ? 5 :
              location.pathname.includes('summary') ? 6 : 1,
        total: 6,
        selectedPackage: state.selectedOptions?.length > 0 ? 'Complete Package' : null,
        tradeInValue: state.tradeInInfo?.estimatedValue || null
      };
      
      // Prepend motor context to message to ensure AI knows which motor we're asking about
      let messageWithContext = text.trim();
      if (activeMotor) {
        const motorLabel = (activeMotor as any).model_display || activeMotor.model || '';
        const hp = activeMotor.hp || (activeMotor as any).horsepower || 0;
        messageWithContext = `[About: ${motorLabel} ${hp}HP] ${text.trim()}`;
      }
      
      await streamChat({
        message: messageWithContext,
        conversationHistory,
        context: {
          currentMotor: activeMotor ? {
            id: (activeMotor as any).id,
            model: (activeMotor as any).model_display || activeMotor.model || '',
            hp: activeMotor.hp || (activeMotor as any).horsepower || 0,
            price: activeMotor.msrp || activeMotor.price || (activeMotor as any).sale_price || activeMotor.salePrice,
            family: (activeMotor as any).family,
            description: (activeMotor as any).description,
            features: (activeMotor as any).features
          } : null,
          currentPage: location.pathname,
          boatInfo: state.boatInfo,
          quoteProgress,
          // Voice-to-text context handoff
          voiceContext: voiceContext?.hasRecentVoice ? {
            summary: voiceContext.summary,
            motorsDiscussed: voiceContext.motorsDiscussed,
            lastVoiceAt: voiceContext.lastVoiceAt,
            messageCount: voiceContext.messageCount,
          } : undefined
        },
        onDelta: (chunk) => {
          fullResponse += chunk;
          setMessages(prev => prev.map(msg => 
            msg.id === streamingId 
              ? { ...msg, text: msg.text + chunk, isStreaming: true }
              : msg
          ));
          scrollToBottom();
        },
        onDone: async (finalResponse) => {
          setMessages(prev => prev.map(msg => 
            msg.id === streamingId 
              ? { ...msg, isStreaming: false }
              : msg
          ));
          
          triggerHaptic('responseReceived');
          
          const assistantDbId = await saveMessage(finalResponse, 'assistant');
          if (assistantDbId) messageIdMap.current.set(streamingId, assistantDbId);
          
          setConversationHistory(prev => [
            ...prev,
            { role: 'user', content: text.trim() },
            { role: 'assistant', content: finalResponse }
          ]);
          
          setIsLoading(false);
          onAIResponse?.(); // Notify parent that AI responded
        },
        onError: (error) => {
          console.error('Stream error:', error);
          triggerHaptic('error');
          const errorText = "I'm sorry, I'm having trouble right now. Please try texting us at 647-952-2153 or call for immediate assistance.";
          setMessages(prev => prev.map(msg => 
            msg.id === streamingId 
              ? { ...msg, text: errorText, isStreaming: false }
              : msg
          ));
          saveMessage(errorText, 'assistant');
          setIsLoading(false);
        }
      });

    } catch (error) {
      console.error('Chat error:', error);
      triggerHaptic('error');
      const errorText = "I'm sorry, I'm having trouble right now. Please try texting us at 647-952-2153 or call for immediate assistance.";
      setMessages(prev => prev.map(msg => 
        msg.id === streamingId 
          ? { ...msg, text: errorText, isStreaming: false }
          : msg
      ));
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle swipe down to close
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      triggerHaptic('light'); // Tactile confirmation of drag-close
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with animated blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed inset-0 z-[70] bg-black/30 backdrop-blur-[4px]"
            onClick={onClose}
            style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
          />
          
          {/* Chat Panel with premium spring animation */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ 
              y: 0, 
              opacity: 1,
              boxShadow: '0 -8px 30px -12px rgba(0,0,0,0.25)'
            }}
            exit={{ y: 'calc(100% + 5rem)', opacity: 0 }}
            transition={{ 
              type: 'spring', 
              damping: 22,
              stiffness: 300,
              mass: 0.8,
              opacity: { duration: 0.12 }
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className="fixed inset-x-0 z-[75] bg-white rounded-t-2xl border-t border-gray-200"
            style={{ 
              bottom: keyboardVisible ? '0px' : 'calc(5rem + env(safe-area-inset-bottom))',
              maxHeight: keyboardVisible ? '100vh' : '70vh',
              touchAction: 'none'
            }}
          >
            {/* Drag handle with entrance animation */}
            <div className="flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing">
              <motion.div 
                className="w-10 h-1 bg-gray-300 rounded-full"
                initial={{ scaleX: 0.6, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: 0.12, duration: 0.2, ease: 'easeOut' }}
              />
            </div>
            
            {/* Chat Container with staggered content cascade */}
            <div className="flex flex-col h-[62vh] max-h-[500px]">
              {/* Header with staggered fade */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06, duration: 0.2, ease: 'easeOut' }}
                className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-white shrink-0"
              >
                <div className="flex flex-row items-center gap-3">
                  <img 
                    src={harrisLogo} 
                    alt="Harris Boat Works" 
                    className="h-6 w-auto"
                  />
                  <div className="w-px h-5 bg-gray-200" />
                  <img 
                    src={mercuryLogo} 
                    alt="Mercury Marine" 
                    className="h-6 w-auto"
                  />
                  <span className="w-2 h-2 bg-emerald-400 rounded-full ml-1" />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 h-8 w-8 p-0 rounded-full transition-colors"
                >
                  <ChevronDown className="w-5 h-5" />
                </Button>
              </motion.div>

              {/* History Banner */}
              {showHistoryBanner && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between shrink-0"
                >
                  <p className="text-xs text-gray-500">
                    ✨ Continuing your chat...
                  </p>
                  <button
                    onClick={handleStartFresh}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Start fresh
                  </button>
                </motion.div>
              )}

              {/* Messages Area with staggered fade */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.2, ease: 'easeOut' }}
                className="flex-1 overflow-y-auto min-h-0 px-4 py-3 space-y-3 bg-gradient-to-b from-gray-50/30 to-white relative"
              >
                {/* Motor Context Pill - compact floating indicator */}
                <AnimatePresence>
                  {showMotorBanner && currentMotorLabel && (
                    <motion.div
                      key={currentMotorId}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-2 right-2 px-2 py-1 bg-amber-50/80 backdrop-blur-sm border border-amber-100/60 rounded-full flex items-center gap-1.5 z-10 shadow-sm"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span className="text-[11px] text-amber-700/80 font-light">
                        {currentMotorLabel}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence initial={false}>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className={`flex flex-col ${message.isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] px-3.5 py-2.5 text-[14px]",
                          message.isUser
                            ? 'bg-gray-900 text-white rounded-2xl rounded-br-md shadow-sm'
                            : 'bg-white text-gray-800 rounded-2xl rounded-bl-md shadow-[0_1px_4px_-1px_rgba(0,0,0,0.08)] border border-gray-100'
                        )}
                      >
                        {message.isStreaming && message.text === '' ? (
                          <TypingIndicator />
                        ) : (
                          <p className="whitespace-pre-wrap leading-relaxed font-light">
                            {parseMessageText(message.text).map((segment, idx) => {
                              if (segment.type === 'text') {
                                return <span key={idx}>{segment.content}</span>;
                              }
                              return (
                                <a
                                  key={idx}
                                  href={segment.href}
                                  className="underline text-blue-600 hover:text-blue-800 transition-colors"
                                  target={segment.type === 'url' ? '_blank' : undefined}
                                  rel={segment.type === 'url' ? 'noopener noreferrer' : undefined}
                                >
                                  {segment.content}
                                </a>
                              );
                            })}
                            {message.isStreaming && (
                              <motion.span 
                                className="inline-block w-0.5 h-4 bg-current ml-0.5"
                                animate={{ opacity: [1, 0] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                              />
                            )}
                          </p>
                        )}
                      </div>

                      {/* Comparison Card */}
                      {message.comparisonData && (
                        <div className="mt-2 max-w-[85%]">
                          <MotorComparisonCard 
                            motor1={message.comparisonData.motor1}
                            motor2={message.comparisonData.motor2}
                            recommendation={message.comparisonData.recommendation}
                          />
                        </div>
                      )}

                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </motion.div>


              {/* Suggested Prompts - auto-hide after first exchange (3+ messages), compact on mobile */}
              <AnimatePresence mode="wait">
                {messages.length <= 2 && !isLoading && !promptSelected && smartPrompts.length > 0 && (
                  <motion.div
                    key={`prompts-${currentMotorId || 'default'}-${smartPrompts.join(',')}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: promptsRotating ? 0.5 : 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="px-3 py-1.5 border-t border-gray-100 bg-white shrink-0"
                  >
                    <p className="text-[9px] text-gray-400 mb-1 uppercase tracking-wide">
                      {currentMotorLabel ? 'Quick Questions' : 'Suggested'}
                    </p>
                    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-0.5">
                      {smartPrompts.slice(0, 3).map((prompt, index) => (
                        <motion.button
                          key={`${prompt}-${index}`}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05, duration: 0.2 }}
                          onClick={() => {
                            setPromptSelected(true);
                            if (currentMotorId) setInteractedMotorId(currentMotorId);
                            if (prompt.includes('Help me find the right motor') && setShowQuiz) {
                              setShowQuiz(true);
                              onClose();
                            } else {
                              handleSend(prompt);
                            }
                          }}
                          className="px-2 py-1 text-[11px] bg-gray-100 hover:bg-gray-200 
                            text-gray-700 rounded-full transition-all font-light 
                            whitespace-nowrap shrink-0"
                        >
                          {prompt}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input Area with staggered fade */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16, duration: 0.2, ease: 'easeOut' }}
                className="px-4 py-3 pb-4 border-t border-gray-100 bg-white shrink-0"
              >
                <div className="flex flex-row items-center gap-2 bg-gray-50 rounded-xl border border-gray-200 px-3 py-2.5">
                  <VoiceButton
                    isConnected={voice.isConnected}
                    isConnecting={voice.isConnecting}
                    isSpeaking={voice.isSpeaking}
                    isListening={voice.isListening}
                    onStart={voice.startVoiceChat}
                    onEnd={voice.endVoiceChat}
                    size="sm"
                  />
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      // Hide banner when user starts typing
                      if (e.target.value && showMotorBanner) setShowMotorBanner(false);
                    }}
                    onKeyPress={handleKeyPress}
                    placeholder={voice.isConnected ? "Voice chat active..." : "Ask anything..."}
                    disabled={voice.isConnected}
                    className="flex-1 min-w-0 bg-transparent border-none focus:outline-none 
                      text-sm text-gray-900 placeholder:text-gray-400 font-light h-8"
                  />
                  <motion.div
                    animate={{ 
                      scale: sendState === 'sending' ? [1, 0.85, 1.1, 1] : 1,
                      rotate: sendState === 'sending' ? [0, -8, 8, 0] : 0
                    }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  >
                    <Button
                      size="sm"
                      onClick={() => handleSend()}
                      disabled={!inputText.trim() || isLoading || voice.isConnected}
                      className="h-8 w-8 p-0 rounded-lg bg-gray-900 hover:bg-gray-800 
                        disabled:opacity-40 disabled:bg-gray-400 shrink-0 flex items-center justify-center"
                    >
                      <AnimatePresence mode="wait">
                        {sendState === 'success' ? (
                          <motion.div
                            key="check"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            <Check className="h-4 w-4" />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="send"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            <Send className="h-4 w-4" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
