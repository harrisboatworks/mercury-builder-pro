import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, Send, Sparkles, RefreshCw, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { streamChat } from '@/lib/streamParser';
import { useChatPersistence } from '@/hooks/useChatPersistence';
import { parseMessageText, ParsedSegment } from '@/lib/textParser';
import { FinancingCTACard, parseFinancingCTA } from '../chat/FinancingCTACard';

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
      className="text-blue-600 hover:underline"
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
        <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wide px-1">Common Questions</p>
        <div className="flex flex-wrap gap-1.5">
          {prompts.map((prompt, idx) => (
            <motion.button
              key={`${prompt}-${idx}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05, duration: 0.2 }}
              onClick={() => onSend(prompt)}
              className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 
                text-gray-700 rounded-full transition-all font-light hover:scale-[1.02]"
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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
        },
        onDelta: (chunk) => {
          fullResponse += chunk;
          const displayText = fullResponse.replace(/\[LEAD_CAPTURE:.*$/s, '').trim();
          setMessages(prev => prev.map(msg => 
            msg.id === streamingId 
              ? { ...msg, text: displayText, isStreaming: true }
              : msg
          ));
          scrollToBottom();
        },
        onDone: async (finalResponse) => {
          // Parse lead capture marker
          let displayResponse = finalResponse.replace(/\[LEAD_CAPTURE:\s*\{[^}]+\}\]/, '').trim();
          
          // Parse financing CTA
          const { displayText, ctaData } = parseFinancingCTA(displayResponse);
          displayResponse = displayText;
          
          setMessages(prev => prev.map(msg => 
            msg.id === streamingId 
              ? { ...msg, text: displayResponse, isStreaming: false, financingCTA: ctaData }
              : msg
          ));
          
          const assistantDbId = await saveMessage(displayResponse, 'assistant');
          if (assistantDbId) messageIdMap.current.set(streamingId, assistantDbId);
          
          setConversationHistory(prev => [
            ...prev,
            { role: 'user', content: text.trim() },
            { role: 'assistant', content: displayResponse }
          ]);
          
          setIsLoading(false);
        },
        onError: (error) => {
          console.error('Inline chat error:', error);
          const errorText = "Sorry, I'm having trouble. Try again or call us at 905-342-2153.";
          setMessages(prev => prev.map(msg => 
            msg.id === streamingId 
              ? { ...msg, text: errorText, isStreaming: false }
              : msg
          ));
          setIsLoading(false);
        }
      });

    } catch (error) {
      console.error('Chat error:', error);
      setIsLoading(false);
    }
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
      className="flex flex-col h-full bg-white"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to pricing
        </button>
        <button
          onClick={handleStartFresh}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
          title="Start fresh conversation"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-gray-50 bg-gradient-to-r from-amber-50/50 to-orange-50/50 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Mercury Expert</p>
            <p className="text-xs text-gray-500">Ask about the {hp}HP {motor.family || 'Motor'}</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.isUser ? 'items-end' : 'items-start'}`}
          >
            <div className={`max-w-[85%]`}>
              <div
                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.isUser
                    ? 'bg-gray-900 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
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
              
              {/* Financing CTA Card - renders below the message bubble */}
              {!msg.isUser && msg.financingCTA && (
                <FinancingCTACard data={msg.financingCTA} />
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
      <div className="px-4 py-3 border-t border-gray-100 bg-white shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={handleVoiceStart}
            className="shrink-0 w-8 h-8 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center transition-colors"
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
              className="w-full px-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 pr-12"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
