import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, Send, Sparkles, RefreshCw, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { streamChat } from '@/lib/streamParser';
import { useChatPersistence } from '@/hooks/useChatPersistence';
import { parseMessageText, ParsedSegment } from '@/lib/textParser';
import { FinancingCTACard } from '../chat/FinancingCTACard';
import { TradeInCTACard } from '../chat/TradeInCTACard';
import { ServiceCTACard } from '../chat/ServiceCTACard';
import { RepowerCTACard } from '../chat/RepowerCTACard';
import { ChatWriteConsentCard } from '../chat/ChatWriteConsentCard';
import {
  CHAT_ERROR_TEXT,
  buildChatQuoteProgress,
  parseAssistantCommandMarkers,
  stripStreamingCommandMarkers,
  type ChatPendingWrite,
  type ChatWriteStatus,
} from '../chat/chatSessionHelpers';

import { getMotorSpecificPrompts } from '../chat/getMotorSpecificPrompts';
import { useRotatingPrompts } from '@/hooks/useRotatingPrompts';
import { useVoice } from '@/contexts/VoiceContext';
import { useLocation } from 'react-router-dom';
import { useQuote } from '@/contexts/QuoteContext';
import type { Motor } from '@/lib/motor-helpers';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isStreaming?: boolean;
  reaction?: 'thumbs_up' | 'thumbs_down' | null;
  financingCTA?: import('../chat/FinancingCTACard').FinancingCTAData | null;
  tradeInCTA?: import('../chat/TradeInCTACard').TradeInCTAData | null;
  serviceCTA?: import('../chat/ServiceCTACard').ServiceCTAData | null;
  repowerCTA?: import('../chat/RepowerCTACard').RepowerCTAData | null;
  pendingWrite?: ChatPendingWrite;
  writeStatus?: ChatWriteStatus;
}

interface MotorInlineChatPanelProps {
  motor: Motor;
  motorTitle: string;
  hp: number;
  price: number;
  onClose: () => void;
  initialQuestion?: string;
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

// Render parsed segment as clickable link or text
const RenderSegment = ({ segment, idx }: { segment: ParsedSegment; idx: number }) => {
  if (segment.type === 'text') {
    return <span key={idx}>{segment.content}</span>;
  }
  
  // Handle images
  if (segment.type === 'image') {
    return (
      <img
        key={idx}
        src={segment.href}
        alt={segment.alt || 'Product image'}
        className="max-w-full rounded-lg my-2 border border-gray-200"
        style={{ maxHeight: '180px' }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }
  
  // All other types are links
  const isExternal = segment.type === 'url' || segment.type === 'email';
  return (
    <a
      key={idx}
      href={segment.href}
      className="font-medium text-repower-mercury-red underline decoration-repower-mercury-red/30 underline-offset-2 hover:decoration-repower-mercury-red"
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
    >
      {segment.content}
    </a>
  );
};

// Rotating prompts section with animation
const RotatingPromptSection = ({ 
  motor, 
  hp, 
  isLoading, 
  messageCount,
  onSend 
}: { 
  motor: Motor; 
  hp: number; 
  isLoading: boolean;
  messageCount: number;
  onSend: (text: string) => void;
}) => {
  const { prompts, isRotating } = useRotatingPrompts({
    context: { hp, family: motor.family, model: motor.model },
    rotationInterval: 45000,
    promptCount: 4,
    enabled: messageCount <= 1 && !isLoading,
  });

  if (messageCount > 1 || isLoading || prompts.length === 0) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={prompts.join(',')}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: isRotating ? 0.5 : 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        transition={{ duration: 0.25 }}
        className="pt-2"
      >
        <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-repower-navy-900/48">Common Questions</p>
        <div className="flex flex-wrap gap-1.5">
          {prompts.map((prompt, idx) => (
            <motion.button
              key={`${prompt}-${idx}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05, duration: 0.2 }}
              onClick={() => onSend(prompt)}
              className="rounded-full border border-repower-navy-900/10 bg-[#FCFAF5] px-3 py-1.5 text-xs font-medium text-repower-navy-900/72 shadow-[0_2px_8px_rgba(5,14,28,0.04)] transition-all hover:scale-[1.02] hover:border-repower-mercury-red/25 hover:bg-white hover:text-repower-navy-900"
            >
              {prompt}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export function MotorInlineChatPanel({
  motor,
  motorTitle,
  hp,
  price,
  onClose,
  initialQuestion
}: MotorInlineChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sendInFlightRef = useRef(false);
  const messageIdMap = useRef<Map<string, string>>(new Map());
  const initialSentRef = useRef(false);
  
  const location = useLocation();
  const { state } = useQuote();
  const voice = useVoice();
  
  const {
    loadMessages,
    saveMessage,
    updateReaction,
    clearConversation,
  } = useChatPersistence();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  // Initialize chat with brief welcome - let customer lead
  useEffect(() => {
    if (hasInitialized) return;
    
    const welcomeMessage: Message = {
      id: 'inline_welcome_' + Date.now(),
      text: `What would you like to know about this motor?`,
      isUser: false,
      timestamp: new Date(),
    };
    
    setMessages([welcomeMessage]);
    saveMessage(welcomeMessage.text, 'assistant');
    setHasInitialized(true);
  }, [hasInitialized, motorTitle, saveMessage]);

  // Don't auto-send initial question - let customer lead the conversation
  // The initialQuestion prop is no longer used for auto-sending

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
    messageIdMap.current.clear();
    initialSentRef.current = false;
    
    const welcomeMessage: Message = {
      id: 'inline_welcome_' + Date.now(),
      text: `Fresh start! What would you like to know about the ${motorTitle}?`,
      isUser: false,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
    await saveMessage(welcomeMessage.text, 'assistant');
  }, [clearConversation, motorTitle, saveMessage]);

  const handleSend = async (text: string = inputText) => {
    if (!text.trim() || isLoading || sendInFlightRef.current) return;
    sendInFlightRef.current = true;
    setLastFailedMessage(null);

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

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

    try {
      let fullResponse = '';
      
      await streamChat({
        message: text.trim(),
        conversationHistory,
        context: {
          currentMotor: {
            id: motor.id,
            model: motorTitle,
            hp: hp,
            price: price,
            family: motor.family,
            description: motor.description,
            features: motor.features
          },
          currentPage: location.pathname,
          boatInfo: state.boatInfo,
          quoteProgress: buildChatQuoteProgress(location.pathname, state),
        },
        onDelta: (chunk) => {
          fullResponse += chunk;
          const displayText = stripStreamingCommandMarkers(fullResponse);
          setMessages(prev => prev.map(msg => 
            msg.id === streamingId 
              ? { ...msg, text: displayText, isStreaming: true }
              : msg
          ));
          scrollToBottom();
        },
        onDone: async (finalResponse) => {
          const parsed = parseAssistantCommandMarkers(finalResponse, {
            currentPage: location.pathname,
            motor: {
              id: motor.id,
              model: motorTitle,
              hp,
              price,
              family: motor.family,
              description: motor.description,
              features: motor.features,
            },
            conversationHistory,
          });
          
          setMessages(prev => prev.map(msg => 
            msg.id === streamingId 
              ? {
                  ...msg,
                  text: parsed.displayText,
                  isStreaming: false,
                  financingCTA: parsed.financingCTA,
                  tradeInCTA: parsed.tradeInCTA,
                  serviceCTA: parsed.serviceCTA,
                  repowerCTA: parsed.repowerCTA,
                  pendingWrite: parsed.pendingWrite,
                  writeStatus: parsed.pendingWrite ? 'needs_consent' : undefined,
                }
              : msg
          ));
          
          const assistantDbId = await saveMessage(parsed.displayText, 'assistant');
          if (assistantDbId) messageIdMap.current.set(streamingId, assistantDbId);
          
          setConversationHistory(prev => [
            ...prev,
            { role: 'user', content: text.trim() },
            { role: 'assistant', content: parsed.displayText }
          ]);
          
          sendInFlightRef.current = false;
          setIsLoading(false);
        },
        onError: (error) => {
          console.error('Inline chat error:', error);
          setMessages(prev => prev.map(msg => 
            msg.id === streamingId 
              ? { ...msg, text: CHAT_ERROR_TEXT, isStreaming: false }
              : msg
          ));
          setLastFailedMessage(text.trim());
          sendInFlightRef.current = false;
          setIsLoading(false);
        }
      });

    } catch (error) {
      console.error('Chat error:', error);
      setLastFailedMessage(text.trim());
      sendInFlightRef.current = false;
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (!lastFailedMessage) return;
    const retryText = lastFailedMessage;
    setLastFailedMessage(null);
    handleSend(retryText);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceStart = () => {
    voice?.startVoiceChat?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex h-full flex-col bg-[radial-gradient(circle_at_100%_0%,rgba(201,162,74,0.15),transparent_34%),linear-gradient(180deg,#F9F6EF_0%,#F1ECE3_100%)]"
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-repower-navy-900/10 bg-[#F9F6EF]/95 px-4 py-3 backdrop-blur-md">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-sm font-semibold text-repower-navy-900/65 transition-colors hover:text-repower-navy-900"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to pricing
        </button>
        <button
          onClick={handleStartFresh}
          className="rounded-full border border-transparent p-2 text-repower-navy-900/45 transition-colors hover:border-repower-navy-900/10 hover:bg-[#FFFDF8] hover:text-repower-navy-900"
          aria-label="Start fresh conversation"
          title="Start fresh conversation"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      
      {/* Chat Header */}
      <div className="shrink-0 border-b border-white/10 bg-repower-navy-900 px-4 py-4 text-white shadow-[0_12px_28px_rgba(5,14,28,0.14)]">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(145deg,#D3AD55,#B97824)] shadow-[0_6px_16px_rgba(0,0,0,0.22)]">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-[-0.01em] text-white">Mercury Expert</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-white/62">
              <span>Ask about the {hp}HP {motor.family || 'Motor'}</span>
              <span className="inline-flex items-center gap-1 text-[#E6C97E]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                Live pricing, stock & offers
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.isUser ? 'items-end' : 'items-start'}`}
          >
            <div className={`max-w-[85%]`}>
              <div
                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.isUser
                    ? 'rounded-br-md bg-repower-navy-900 text-white shadow-[0_8px_20px_rgba(5,14,28,0.13)]'
                    : 'rounded-bl-md border border-repower-navy-900/8 bg-[#FCFAF5] text-repower-navy-900 shadow-[0_8px_20px_rgba(5,14,28,0.06)]'
                }`}
              >
                {msg.isStreaming ? (
                  <div className="flex items-center gap-2">
                    <span>{msg.text}</span>
                    <TypingIndicator />
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">
                    {parseMessageText(msg.text).map((segment, idx) => (
                      <RenderSegment key={idx} segment={segment} idx={idx} />
                    ))}
                  </div>
                )}
              </div>
              
              {/* CTA Cards - render below the message bubble */}
              {!msg.isUser && msg.financingCTA && (
                <FinancingCTACard data={msg.financingCTA} />
              )}
              {!msg.isUser && msg.tradeInCTA && (
                <TradeInCTACard data={msg.tradeInCTA} />
              )}
              {!msg.isUser && msg.serviceCTA && (
                <ServiceCTACard data={msg.serviceCTA} />
              )}
              {!msg.isUser && msg.repowerCTA && (
                <RepowerCTACard data={msg.repowerCTA} />
              )}
              {!msg.isUser && msg.pendingWrite && msg.writeStatus && (
                <ChatWriteConsentCard
                  write={msg.pendingWrite}
                  status={msg.writeStatus}
                  onStatusChange={(status) => {
                    setMessages((prev) => prev.map((item) =>
                      item.id === msg.id ? { ...item, writeStatus: status } : item
                    ));
                  }}
                />
              )}
            </div>
          </div>
        ))}
        
        {/* HP-aware Smart Prompts - rotates every 45s when idle */}
        <RotatingPromptSection 
          motor={motor}
          hp={hp}
          isLoading={isLoading}
          messageCount={messages.length}
          onSend={handleSend}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="shrink-0 border-t border-repower-navy-900/10 bg-[#F8F5EE]/95 px-4 py-3 backdrop-blur-md">
        {lastFailedMessage && !isLoading && (
          <button
            type="button"
            onClick={handleRetry}
            aria-label="Retry last message"
            className="mb-2 rounded-full border border-repower-navy-900/10 bg-[#FFFDF8] px-3 py-1 text-xs text-repower-navy-900/72"
          >
            Retry
          </button>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={handleVoiceStart}
            aria-label="Start voice chat"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-repower-navy-900/10 bg-[#FFFDF8] text-repower-navy-900/58 shadow-sm transition-colors hover:border-repower-navy-900/20 hover:text-repower-navy-900"
            title="Voice chat"
          >
            <Mic className="w-4 h-4" />
          </button>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask anything about this motor..."
              aria-label="Ask the Mercury Expert"
              className="w-full rounded-full border border-repower-navy-900/12 bg-[#FFFDF8] py-2.5 pl-4 pr-12 text-sm text-repower-navy-900 shadow-[inset_0_1px_2px_rgba(5,14,28,0.04)] placeholder:text-repower-navy-900/38 focus:border-repower-navy-900/25 focus:outline-none focus:ring-2 focus:ring-[#C9A24A]/20"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSend()}
              aria-label="Send message"
              disabled={!inputText.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-repower-mercury-red transition-colors hover:text-[#9A0C24] disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
