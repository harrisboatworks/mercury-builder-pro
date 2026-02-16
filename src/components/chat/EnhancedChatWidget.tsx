import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X, Send, MessageCircle, RefreshCw, Sparkles } from 'lucide-react';
import { parseMessageText, ParsedSegment } from '@/lib/textParser';
import { useLocation } from 'react-router-dom';
import { useQuote } from '@/contexts/QuoteContext';
import { useMotorViewSafe } from '@/contexts/MotorViewContext';
import { motion, AnimatePresence } from 'framer-motion';
import { streamChat, detectComparisonQuery } from '@/lib/streamParser';
import { getContextualPromptsWithPerplexity, getPageWelcomeMessage, isMotorFocusedPage } from './getContextualPrompts';
import { usePageSpecificInsights } from '@/hooks/usePageSpecificInsights';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import { getMotorSpecificPrompts, getMotorContextLabel } from './getMotorSpecificPrompts';
import { useRotatingPrompts } from '@/hooks/useRotatingPrompts';
import { usePrefetchedInsights } from '@/hooks/usePrefetchedInsights';
import { MotorComparisonCard } from './MotorComparisonCard';
import { FinancingCTACard, parseFinancingCTA } from './FinancingCTACard';
import { FINANCING_MINIMUM } from '@/lib/finance';

import { useChatPersistence, PersistedMessage } from '@/hooks/useChatPersistence';
import { useCrossChannelContext, VoiceContextForText } from '@/hooks/useCrossChannelContext';
import { VoiceButton } from './VoiceButton';
import { VoiceHeaderButton } from './VoiceHeaderButton';
import { useVoice } from '@/contexts/VoiceContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { VoiceActivityCard } from './VoiceActivityCard';
import { VOICE_ACTIVITY_EVENT, type VoiceActivityEvent } from '@/lib/voiceActivityFeed';

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
  activityData?: VoiceActivityEvent;
  financingCTA?: import('./FinancingCTACard').FinancingCTAData;
}

export interface EnhancedChatWidgetHandle {
  open: (initialMessage?: string) => void;
  close: () => void;
  sendMessage: (message: string) => void;
}

interface EnhancedChatWidgetProps {
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

export const EnhancedChatWidget = forwardRef<EnhancedChatWidgetHandle, EnhancedChatWidgetProps>(
  ({ isOpen, onClose, initialMessage, onLoadingChange, onAIResponse }, ref) => {
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoadingLocal, setIsLoadingLocal] = useState(false);
    
    // Sync local loading state with parent context
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
    const messageIdMap = useRef<Map<string, string>>(new Map()); // local id -> db id
    
    const location = useLocation();
    const { state } = useQuote();
    const motorViewContext = useMotorViewSafe();
    const setShowQuiz = motorViewContext?.setShowQuiz;
    
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

    // Listen for voice activity events and add them to messages
    useEffect(() => {
      const handleVoiceActivity = (e: CustomEvent<VoiceActivityEvent>) => {
        const activity = e.detail;
        const activityMessage: Message = {
          id: activity.id,
          text: '',
          isUser: false,
          timestamp: activity.timestamp,
          activityData: activity,
        };
        setMessages(prev => [...prev, activityMessage]);
      };
      
      window.addEventListener(VOICE_ACTIVITY_EVENT, handleVoiceActivity as EventListener);
      return () => window.removeEventListener(VOICE_ACTIVITY_EVENT, handleVoiceActivity as EventListener);
    }, []);

    // Scroll to bottom when chat opens
    useEffect(() => {
      if (isOpen && !isMinimized) {
        // Small delay to ensure messages are rendered
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    }, [isOpen, isMinimized]);

    useEffect(() => {
      if (isOpen && !isMinimized && inputRef.current) {
        inputRef.current.focus();
      }
    }, [isOpen, isMinimized]);

    // Get active promotion for promo-aware prompts
    const { promotions } = useActivePromotions();
    const mainPromo = promotions[0] || null;

    // Get Perplexity-backed page insights
    const { insights: pageInsights } = usePageSpecificInsights(location.pathname);
    const perplexityQuestions = useMemo(() => {
      return pageInsights.map(i => i.questionForm);
    }, [pageInsights]);

    // Get contextual prompts based on motor, page, promo, and Perplexity insights
    const contextualPrompts = useMemo(() => {
      const activeMotor = state.previewMotor || state.motor;
      const motor = activeMotor ? {
        model: activeMotor.model || '',
        hp: activeMotor.hp || 0,
        price: activeMotor.price || 0
      } : null;
      
      return getContextualPromptsWithPerplexity(motor, state.boatInfo, location.pathname, mainPromo, perplexityQuestions);
    }, [state.previewMotor, state.motor, state.boatInfo, location.pathname, mainPromo, perplexityQuestions]);

    // Track which motor the welcome message was generated for
    const welcomeMotorIdRef = useRef<string | null>(null);

    // Get contextual welcome message - uses centralized function for consistency
    const getWelcomeMessage = useCallback((): string => {
      const activeMotor = state.previewMotor || state.motor;
      const motor = activeMotor ? {
        model: activeMotor.model || '',
        hp: activeMotor.hp || 0
      } : null;
      
      return getPageWelcomeMessage(location.pathname, motor, mainPromo);
    }, [location.pathname, state.previewMotor, state.motor, mainPromo]);

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

    // Reset initialization when page category changes (so chat restarts fresh on new context)
    const currentCategoryRef = useRef<string | null>(null);
    
    useEffect(() => {
      const newCategory = getPageCategory(location.pathname);
      
      // If category changed since last check, reset initialization
      if (currentCategoryRef.current !== null && currentCategoryRef.current !== newCategory) {
        console.log(`[Chat] Page category changed from ${currentCategoryRef.current} to ${newCategory}, resetting initialization`);
        setHasInitialized(false);
      }
      
      currentCategoryRef.current = newCategory;
    }, [location.pathname]);

    // Load history and initialize - with context-aware reset and voice context loading
    useEffect(() => {
      const initChat = async () => {
        if (!isOpen || hasInitialized || isPersistenceLoading) return;
        
        // Load voice context for cross-channel handoff
        const voiceCtx = await loadVoiceContextForText();
        setVoiceContext(voiceCtx);
        if (voiceCtx?.hasRecentVoice) {
          console.log('[Chat] Voice context loaded:', voiceCtx);
        }
        
        const currentCategory = getPageCategory(location.pathname);
        const storedCategory = localStorage.getItem('chat_page_category');
        
        // Check if page context changed significantly (different category)
        const contextChanged = storedCategory && storedCategory !== currentCategory;
        
        const persistedMessages = await loadMessages();
        
        // Track which motor we're initializing with
        const activeMotor = state.previewMotor || state.motor;
        welcomeMotorIdRef.current = (activeMotor as any)?.id || null;
        
        // If context changed significantly and we have old history, start fresh
        if (contextChanged && persistedMessages.length > 0) {
          console.log(`[Chat] Context changed from ${storedCategory} to ${currentCategory}, starting fresh`);
          await clearConversation();
          localStorage.setItem('chat_page_category', currentCategory);
          
          // Include voice context in welcome if available
          const welcomeText = voiceCtx?.hasRecentVoice
            ? `${getWelcomeMessage()} I remember we were chatting earlier${voiceCtx.motorsDiscussed.length > 0 ? ` about the ${voiceCtx.motorsDiscussed[0]}` : ''} - feel free to continue here or ask me something new!`
            : getWelcomeMessage();
          
          const welcomeMessage: Message = {
            id: 'welcome_' + Date.now(),
            text: welcomeText,
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
          // Has history - load it
          const loadedMessages = convertPersistedMessages(persistedMessages);
          setMessages(loadedMessages);
          setShowHistoryBanner(true);
          
          // Rebuild conversation history for AI context
          const history = persistedMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          }));
          setConversationHistory(history);
        } else {
          // No history - show welcome (with voice context if available)
          localStorage.setItem('chat_page_category', currentCategory);
          
          const welcomeText = voiceCtx?.hasRecentVoice
            ? `${getWelcomeMessage()} I remember we were chatting earlier${voiceCtx.motorsDiscussed.length > 0 ? ` about the ${voiceCtx.motorsDiscussed[0]}` : ''} - feel free to continue here!`
            : getWelcomeMessage();
          
          const welcomeMessage: Message = {
            id: 'welcome',
            text: welcomeText,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages([welcomeMessage]);
          
          // Save welcome message
          const dbId = await saveMessage(welcomeMessage.text, 'assistant');
          if (dbId) messageIdMap.current.set(welcomeMessage.id, dbId);
        }
        
        setHasInitialized(true);
      };
      
      initChat();
    }, [isOpen, hasInitialized, isPersistenceLoading, loadMessages, convertPersistedMessages, saveMessage, clearConversation, location.pathname, loadVoiceContextForText, getWelcomeMessage, state.previewMotor, state.motor]);

    // Re-generate welcome message when motor context changes AFTER initialization
    useEffect(() => {
      const activeMotor = state.previewMotor || state.motor;
      const currentMotorId = (activeMotor as any)?.id || null;
      
      // Only update if we've initialized, chat is open, and motor actually changed
      if (hasInitialized && isOpen && !isMinimized && currentMotorId && currentMotorId !== welcomeMotorIdRef.current) {
        console.log('[Chat] Motor context changed, updating welcome message');
        welcomeMotorIdRef.current = currentMotorId;
        
        // Generate new welcome for this motor
        const newWelcome: Message = {
          id: 'welcome_' + Date.now(),
          text: getWelcomeMessage(),
          isUser: false,
          timestamp: new Date(),
        };
        
        // Replace the first message if it's a welcome (non-user message)
        setMessages(prev => {
          const firstIsWelcome = prev[0] && !prev[0].isUser && prev[0].id.startsWith('welcome');
          if (firstIsWelcome) {
            return [newWelcome, ...prev.slice(1)];
          }
          return prev;
        });
      }
    }, [state.previewMotor, state.motor, hasInitialized, isOpen, isMinimized, getWelcomeMessage]);

    // Parse motor context from initialMessage (if it's a context marker, not a question)
    const motorContext = useMemo(() => {
      if (!initialMessage) return null;
      // Check for motor context marker: __MOTOR_CONTEXT__:hp:model
      if (initialMessage.startsWith('__MOTOR_CONTEXT__:')) {
        const parts = initialMessage.split(':');
        if (parts.length >= 3) {
          const hp = parseInt(parts[1], 10);
          const model = parts.slice(2).join(':');
          return { hp, model, label: getMotorContextLabel(hp, model) };
        }
      }
      return null;
    }, [initialMessage]);

    // Handle new initial messages (when chat reopens with a REAL question from search bar)
    const initialMessageSentRef = useRef<string | null>(null);
    
    useEffect(() => {
      // Don't auto-send if it's a motor context marker (let customer lead)
      if (motorContext) return;
      
      if (isOpen && hasInitialized && initialMessage && !isLoading && initialMessageSentRef.current !== initialMessage) {
        initialMessageSentRef.current = initialMessage;
        setTimeout(() => handleSend(initialMessage), 300);
      }
    }, [initialMessage, isOpen, hasInitialized, isLoading, motorContext]);
    
    // Get rotating smart prompts based on motor context
    const motorPromptContext = useMemo(() => {
      if (motorContext) {
        return { hp: motorContext.hp, model: motorContext.model };
      }
      if (state.motor) {
        return { hp: state.motor.hp || 0, model: state.motor.model || '' };
      }
      return null;
    }, [motorContext, state.motor]);

    // Prefetch motor-specific insights from Perplexity
    const activeMotorForInsights = useMemo(() => {
      const activeMotor = state.previewMotor || state.motor;
      if (!activeMotor) return null;
      return {
        hp: activeMotor.hp || (activeMotor as any).horsepower || 0,
        model: activeMotor.model || (activeMotor as any).model_display || '',
        family: (activeMotor as any).family
      };
    }, [state.previewMotor, state.motor]);
    
    const { insights: prefetchedInsights } = usePrefetchedInsights(activeMotorForInsights);

    // Use rotating prompts hook
    const { prompts: rotatingPrompts, isRotating: promptsRotating } = useRotatingPrompts({
      context: motorPromptContext,
      rotationInterval: 45000,
      promptCount: 4,
      enabled: isOpen && !isMinimized && messages.length <= 2,
    });
    
    // Page-first prompt selection: use page prompts except on motor-focused pages with motor context
    const isOnMotorPage = useMemo(() => isMotorFocusedPage(location.pathname), [location.pathname]);
    
    const smartPrompts = useMemo(() => {
      // On motor-focused pages with motor context, prefer motor-specific rotating prompts
      if (isOnMotorPage && motorPromptContext && rotatingPrompts.length > 0) {
        return rotatingPrompts;
      }
      // Otherwise, always use page-specific contextual prompts
      return contextualPrompts;
    }, [isOnMotorPage, motorPromptContext, rotatingPrompts, contextualPrompts]);

    // Handle reaction updates
    const handleReaction = useCallback(async (messageId: string, reaction: 'thumbs_up' | 'thumbs_down' | null) => {
      // Update local state immediately
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, reaction } : msg
      ));
      
      // Get database ID and persist
      const dbId = messageIdMap.current.get(messageId);
      if (dbId) {
        await updateReaction(dbId, reaction);
      }
    }, [updateReaction]);

    // Start fresh conversation
    const handleStartFresh = useCallback(async () => {
      await clearConversation();
      setMessages([]);
      setConversationHistory([]);
      setShowHistoryBanner(false);
      messageIdMap.current.clear();
      
      // Show new welcome
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

      // Save user message to DB
      const userDbId = await saveMessage(userMessage.text, 'user');
      if (userDbId) messageIdMap.current.set(userMessage.id, userDbId);

      // Add streaming placeholder
      const streamingId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: streamingId,
        text: '',
        isUser: false,
        timestamp: new Date(),
        isStreaming: true
      }]);

      // Check if this is a comparison query
      const comparison = detectComparisonQuery(text.trim());

      try {
        let fullResponse = '';
        
        // Build rich context for AI including motor details, quote progress, trade-in
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
            quoteProgress,
            // Pass prefetched Perplexity insights for proactive knowledge sharing
            prefetchedInsights: prefetchedInsights.length > 0 ? prefetchedInsights : undefined,
            // Voice-to-text context handoff - include recent voice session info
            voiceContext: voiceContext?.hasRecentVoice ? {
              summary: voiceContext.summary,
              motorsDiscussed: voiceContext.motorsDiscussed,
              lastVoiceAt: voiceContext.lastVoiceAt,
              messageCount: voiceContext.messageCount,
            } : undefined
          },
          onDelta: (chunk) => {
            fullResponse += chunk;
            // Strip all command markers during streaming to hide them from user
            const displayText = fullResponse
              .replace(/\[LEAD_CAPTURE:.*$/s, '')
              .replace(/\[SEND_SMS:.*$/s, '')
              .replace(/\[PRICE_ALERT:.*$/s, '')
              .replace(/\[FINANCING_CTA:.*$/s, '')
              .trim();
            setMessages(prev => prev.map(msg =>
              msg.id === streamingId 
                ? { ...msg, text: displayText, isStreaming: true }
                : msg
            ));
            scrollToBottom();
          },
          onDone: async (finalResponse) => {
            // Check for lead capture pattern and process it
            let displayResponse = finalResponse;
            const leadMatch = finalResponse.match(/\[LEAD_CAPTURE:\s*(\{[^}]+\})\]/);
            
            if (leadMatch) {
              try {
                const leadData = JSON.parse(leadMatch[1]);
                console.log('[Chat] Lead capture detected:', leadData);
                
                // Remove the marker from the displayed message
                displayResponse = displayResponse.replace(/\[LEAD_CAPTURE:\s*\{[^}]+\}\]/, '').trim();
                
                // Get conversation context (last few exchanges)
                const recentContext = conversationHistory.slice(-4).map(h => 
                  `${h.role}: ${h.content.substring(0, 100)}`
                ).join(' | ');
                
                // Get motor context
                const activeMotor = state.previewMotor || state.motor;
                
                // Submit lead to edge function
                const { error: leadError } = await supabase.functions.invoke('capture-chat-lead', {
                  body: {
                    name: leadData.name,
                    phone: leadData.phone,
                    email: leadData.email,
                    conversationContext: recentContext || 'Customer requested callback',
                    currentPage: location.pathname,
                    motorContext: activeMotor ? {
                      model: activeMotor.model || (activeMotor as any).model_display,
                      hp: activeMotor.hp || (activeMotor as any).horsepower,
                      price: activeMotor.msrp || activeMotor.price || (activeMotor as any).sale_price
                    } : undefined
                  }
                });
                
                if (leadError) {
                  console.error('[Chat] Failed to capture lead:', leadError);
                } else {
                  console.log('[Chat] Lead captured successfully');
                  toast.success("We've got your info! Someone will call you soon.");
                }
              } catch (parseError) {
                console.error('[Chat] Failed to parse lead capture:', parseError);
              }
            }
            
            // Check for SMS send pattern
            const smsMatch = finalResponse.match(/\[SEND_SMS:\s*(\{[^}]+\})\]/);
            if (smsMatch) {
              try {
                const smsData = JSON.parse(smsMatch[1]);
                console.log('[Chat] SMS send detected:', smsData);
                
                // Remove the marker from displayed message
                displayResponse = displayResponse.replace(/\[SEND_SMS:\s*\{[^}]+\}\]/, '').trim();
                
                // Determine message type and motor context
                const activeMotor = state.previewMotor || state.motor;
                
                const { error: smsError } = await supabase.functions.invoke('voice-send-follow-up', {
                  body: {
                    customer_name: smsData.name || 'Friend',
                    customer_phone: smsData.phone,
                    message_type: smsData.content === 'comparison' ? 'comparison' : 
                                  smsData.content === 'promo_reminder' ? 'promo_reminder' : 'quote_interest',
                    motor_model: activeMotor?.model || smsData.motors?.join(' vs '),
                    motor_id: activeMotor?.id,
                    custom_note: smsData.content === 'comparison' 
                      ? `Comparing: ${smsData.motors?.join(' vs ')}`
                      : undefined
                  }
                });
                
                if (smsError) {
                  console.error('[Chat] Failed to send SMS:', smsError);
                } else {
                  console.log('[Chat] SMS sent successfully');
                  toast.success("Text sent! Check your phone.");
                }
              } catch (parseError) {
                console.error('[Chat] Failed to parse SMS command:', parseError);
              }
            }
            
            // Check for price alert pattern
            const priceAlertMatch = finalResponse.match(/\[PRICE_ALERT:\s*(\{[^}]+\})\]/);
            if (priceAlertMatch) {
              try {
                const alertData = JSON.parse(priceAlertMatch[1]);
                console.log('[Chat] Price alert detected:', alertData);
                
                // Remove the marker from displayed message
                displayResponse = displayResponse.replace(/\[PRICE_ALERT:\s*\{[^}]+\}\]/, '').trim();
                
                // Get motor context for lead capture
                const activeMotor = state.previewMotor || state.motor;
                
                // Capture as lead with price alert context
                await supabase.functions.invoke('capture-chat-lead', {
                  body: {
                    name: alertData.name || 'Price Alert Subscriber',
                    phone: alertData.phone,
                    conversationContext: `Price drop alert for ${alertData.motor_hp || activeMotor?.hp || 'unknown'}HP motor`,
                    currentPage: location.pathname,
                    motorContext: activeMotor ? {
                      model: activeMotor.model || (activeMotor as any).model_display,
                      hp: activeMotor.hp || (activeMotor as any).horsepower,
                      price: activeMotor.msrp || activeMotor.price || (activeMotor as any).sale_price
                    } : undefined
                  }
                });
                
                console.log('[Chat] Price alert lead captured');
                toast.success("Got it! We'll text you if pricing changes.");
              } catch (parseError) {
                console.error('[Chat] Failed to parse price alert:', parseError);
              }
            }
            
            // Parse financing CTA - only show if price meets minimum threshold
            let financingCTA: import('./FinancingCTACard').FinancingCTAData | undefined;
            const { displayText: afterFinancing, ctaData } = parseFinancingCTA(displayResponse);
            if (ctaData) {
              displayResponse = afterFinancing;
              // Only show CTA if motor price meets minimum financing threshold
              if (ctaData.price >= FINANCING_MINIMUM) {
                financingCTA = ctaData;
                console.log('[Chat] Financing CTA parsed:', ctaData);
              } else {
                console.log('[Chat] Financing CTA ignored - price below minimum:', ctaData.price);
              }
            }
            
            setMessages(prev => prev.map(msg =>
              msg.id === streamingId 
                ? { ...msg, text: displayResponse, isStreaming: false, financingCTA }
                : msg
            ));
            
            // Save assistant message to DB (without markers)
            const assistantDbId = await saveMessage(displayResponse, 'assistant');
            if (assistantDbId) messageIdMap.current.set(streamingId, assistantDbId);
            
            setConversationHistory(prev => [
              ...prev,
              { role: 'user', content: text.trim() },
              { role: 'assistant', content: displayResponse }
            ]);
            
            setIsLoading(false);
            onAIResponse?.(); // Notify parent that AI responded
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

    useImperativeHandle(ref, () => ({
      open: (msg?: string) => {
        if (msg) {
          setTimeout(() => handleSend(msg), 500);
        }
      },
      close: onClose,
      sendMessage: handleSend
    }));

    if (!isOpen) return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.9 }}
          transition={{ 
            type: 'spring', 
            stiffness: 400, 
            damping: 28,
            mass: 0.8
          }}
          className="fixed bottom-20 right-4 left-4 sm:bottom-4 sm:left-auto sm:w-[380px] z-[70]"
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_8px_60px_-15px_rgba(0,0,0,0.2)] border border-gray-200/50 overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white/80">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-lg">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-[15px]">Mercury Expert</h3>
                  <p className="text-xs text-gray-500 font-light">Always here to help</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Voice chat button in header */}
                <VoiceHeaderButton 
                  isConnected={voice?.isConnected ?? false}
                  isConnecting={voice?.isConnecting ?? false}
                  isSpeaking={voice?.isSpeaking ?? false}
                  isListening={voice?.isListening ?? false}
                  onStart={() => voice?.startVoiceChat?.()}
                  onEnd={() => voice?.endVoiceChat?.()}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 h-9 w-9 p-0 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {!isMinimized && (
              <div className="flex flex-col h-[60vh] sm:h-[420px]">
                
                {/* History Banner */}
                {showHistoryBanner && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between"
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
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gradient-to-b from-gray-50/50 to-white">
                  <AnimatePresence initial={false}>
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex flex-col ${message.isUser ? 'items-end' : 'items-start'}`}
                      >
                        {/* Voice Activity Card */}
                        {message.activityData ? (
                          <VoiceActivityCard activity={message.activityData} className="max-w-[90%]" />
                        ) : (
                          <div
                            className={`max-w-[80%] px-4 py-3 ${
                              message.isUser
                                ? 'bg-gray-900 text-white rounded-2xl rounded-br-lg shadow-sm'
                                : 'bg-white text-gray-800 rounded-2xl rounded-bl-lg shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] border border-gray-100'
                            }`}
                          >
                            {message.isStreaming && message.text === '' ? (
                              <TypingIndicator />
                            ) : (
                              <>
                                <p className="text-[14px] whitespace-pre-wrap leading-relaxed font-light">
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
                                {message.comparisonData && (
                                  <MotorComparisonCard
                                    motor1={message.comparisonData.motor1}
                                    motor2={message.comparisonData.motor2}
                                    recommendation={message.comparisonData.recommendation}
                                  />
                                )}
                                {/* Financing CTA Card */}
                                {!message.isUser && message.financingCTA && (
                                  <FinancingCTACard data={message.financingCTA} />
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>

                {/* Motor Context Banner - when opened from motor view */}
                {motorContext && messages.length <= 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-4 mt-2 px-3 py-2 bg-amber-50/60 border border-amber-100 rounded-lg flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs text-amber-700 font-light">
                      <span className="opacity-60">Viewing:</span> {motorContext.label}
                    </span>
                  </motion.div>
                )}

                {/* Suggested Questions - HP-aware when motor context exists */}
                {messages.length <= 1 && !isLoading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="px-5 pb-3"
                  >
                    <p className="text-[11px] text-gray-400 mb-2 uppercase tracking-wide">
                      {motorContext ? 'Common Questions' : 'Suggested'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {smartPrompts.map((q, i) => (
                        <motion.button
                          key={q}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.4 + i * 0.1 }}
                          onClick={() => {
                            if (q.includes('Help me find the right motor') && setShowQuiz) {
                              setShowQuiz(true);
                              onClose();
                            } else {
                              handleSend(q);
                            }
                          }}
                          className="text-[13px] px-3.5 py-1.5 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600 transition-all duration-200 font-light"
                        >
                          {q}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Input Area - Compact */}
                <div className="px-3 py-2 bg-white border-t border-gray-100">
                  <div className="flex items-center gap-2 bg-gray-50 rounded-full px-3 h-11 focus-within:ring-2 focus-within:ring-gray-200 transition-shadow">
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
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={voice.isConnected ? "Voice chat active..." : "Ask anything..."}
                      className="flex-1 px-1 py-0 h-full bg-transparent border-0 focus:outline-none text-[14px] text-gray-800 placeholder:text-gray-400 font-light"
                      disabled={isLoading || voice.isConnected}
                    />
                    <Button
                      onClick={() => handleSend()}
                      disabled={!inputText.trim() || isLoading || voice.isConnected}
                      className="h-8 w-8 p-0 rounded-full bg-gray-900 hover:bg-gray-800 text-white transition-all duration-200 disabled:opacity-40 disabled:bg-gray-300"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }
);

EnhancedChatWidget.displayName = 'EnhancedChatWidget';

EnhancedChatWidget.displayName = 'EnhancedChatWidget';
