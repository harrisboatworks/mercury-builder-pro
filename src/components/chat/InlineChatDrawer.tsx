import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Send, RefreshCw, ChevronDown } from 'lucide-react';
import harrisLogo from '@/assets/harris-logo.png';
import mercuryLogo from '@/assets/mercury-logo.png';
import { useLocation } from 'react-router-dom';
import { useQuote } from '@/contexts/QuoteContext';
import { useMotorViewSafe } from '@/contexts/MotorViewContext';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { streamChat, detectComparisonQuery } from '@/lib/streamParser';
import { getContextualPrompts } from './getContextualPrompts';
import { MotorComparisonCard } from './MotorComparisonCard';
import { MessageReactions } from './MessageReactions';
import { useChatPersistence, PersistedMessage } from '@/hooks/useChatPersistence';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';

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
  onLoadingChange
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);
  
  const setIsLoading = useCallback((loading: boolean) => {
    setIsLoadingLocal(loading);
    onLoadingChange?.(loading);
  }, [onLoadingChange]);
  
  const isLoading = isLoadingLocal;
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [showHistoryBanner, setShowHistoryBanner] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    const motor = state.motor ? {
      model: state.motor.model || '',
      hp: state.motor.hp || 0
    } : null;
    
    return getContextualPrompts(motor, state.boatInfo, location.pathname);
  }, [state.motor, state.boatInfo, location.pathname]);

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

  // Load history and initialize
  useEffect(() => {
    const initChat = async () => {
      if (!isOpen || hasInitialized || isPersistenceLoading) return;
      
      const persistedMessages = await loadMessages();
      
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
        const welcomeMessage: Message = {
          id: 'welcome',
          text: getWelcomeMessage(),
          isUser: false,
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
        
        const dbId = await saveMessage(welcomeMessage.text, 'assistant');
        if (dbId) messageIdMap.current.set(welcomeMessage.id, dbId);
        
        if (initialMessage) {
          setTimeout(() => handleSend(initialMessage), 500);
        }
      }
      
      setHasInitialized(true);
    };
    
    initChat();
  }, [isOpen, hasInitialized, isPersistenceLoading, loadMessages, convertPersistedMessages, saveMessage, initialMessage]);

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
      
      await streamChat({
        message: text.trim(),
        conversationHistory,
        context: {
          currentMotor: activeMotor ? {
            id: (activeMotor as any).id,
            model: activeMotor.model || (activeMotor as any).model_display || '',
            hp: activeMotor.hp || (activeMotor as any).horsepower || 0,
            price: activeMotor.msrp || activeMotor.price || (activeMotor as any).sale_price || activeMotor.salePrice,
            family: (activeMotor as any).family,
            description: (activeMotor as any).description,
            features: (activeMotor as any).features
          } : null,
          currentPage: location.pathname,
          boatInfo: state.boatInfo,
          quoteProgress
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
          
          const assistantDbId = await saveMessage(finalResponse, 'assistant');
          if (assistantDbId) messageIdMap.current.set(streamingId, assistantDbId);
          
          setConversationHistory(prev => [
            ...prev,
            { role: 'user', content: text.trim() },
            { role: 'assistant', content: finalResponse }
          ]);
          
          setIsLoading(false);
        },
        onError: (error) => {
          console.error('Stream error:', error);
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
          {/* Backdrop - tap to close with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 z-[70] bg-black/25 backdrop-blur-sm"
            onClick={onClose}
            style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
          />
          
          {/* Chat Panel with scale + slide animation */}
          <motion.div
            initial={{ y: '100%', opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '100%', opacity: 0, scale: 0.97 }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 300,
              opacity: { duration: 0.2 },
              scale: { duration: 0.25 }
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className="fixed inset-x-0 z-[75] bg-white rounded-t-2xl shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.25)] border-t border-gray-200"
            style={{ 
              bottom: 'calc(5rem + env(safe-area-inset-bottom))',
              maxHeight: '70vh',
              touchAction: 'none'
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            
            {/* Chat Container with staggered content fade-in */}
            <motion.div 
              className="flex flex-col h-[60vh] max-h-[420px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.2, ease: 'easeOut' }}
            >
              {/* Header - Premium dual-logo branding */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-white shrink-0">
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
              </div>

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

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gradient-to-b from-gray-50/30 to-white">
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
                            {message.text}
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

                      {/* Reactions for AI messages */}
                      {!message.isUser && !message.isStreaming && message.id !== 'welcome' && (
                        <div className="mt-1">
                          <MessageReactions
                            messageId={message.id}
                            currentReaction={message.reaction || null}
                            onReact={handleReaction}
                          />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Suggested Prompts (only when few messages) */}
              {messages.length <= 2 && !isLoading && (
                <div className="px-4 py-2 border-t border-gray-100 bg-white shrink-0">
                  <div className="flex flex-wrap gap-1.5">
                    {contextualPrompts.slice(0, 3).map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          if (prompt.includes('Help me find the right motor') && setShowQuiz) {
                            setShowQuiz(true);
                            onClose();
                          } else {
                            handleSend(prompt);
                          }
                        }}
                        className="px-2.5 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 
                          text-gray-700 rounded-full transition-colors font-light"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area - Horizontal layout */}
              <div className="px-4 py-3 border-t border-gray-100 bg-white shrink-0">
                <div className="flex flex-row items-center gap-2 bg-gray-50 rounded-xl border border-gray-200 px-3 py-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask anything..."
                    disabled={isLoading}
                    className="flex-1 min-w-0 bg-transparent border-none focus:outline-none 
                      text-sm text-gray-900 placeholder:text-gray-400 font-light h-8"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleSend()}
                    disabled={!inputText.trim() || isLoading}
                    className="h-8 w-8 p-0 rounded-lg bg-gray-900 hover:bg-gray-800 
                      disabled:opacity-40 disabled:bg-gray-400 shrink-0 flex items-center justify-center"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
