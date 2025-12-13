import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { X, Send, MessageCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useQuote } from '@/contexts/QuoteContext';
import { motion, AnimatePresence } from 'framer-motion';
import { streamChat, detectComparisonQuery } from '@/lib/streamParser';
import { getContextualPrompts } from './getContextualPrompts';
import { MotorComparisonCard } from './MotorComparisonCard';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isStreaming?: boolean;
  comparisonData?: {
    motor1: { model: string; hp: number; price: number };
    motor2: { model: string; hp: number; price: number };
    recommendation?: string;
  };
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
  ({ isOpen, onClose, initialMessage }, ref) => {
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversationHistory, setConversationHistory] = useState<any[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const location = useLocation();
    const { state } = useQuote();

    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
      scrollToBottom();
    }, [messages]);

    useEffect(() => {
      if (isOpen && !isMinimized && inputRef.current) {
        inputRef.current.focus();
      }
    }, [isOpen, isMinimized]);

    // Get contextual prompts based on motor and page
    const contextualPrompts = useMemo(() => {
      const motor = state.motor ? {
        model: state.motor.model || '',
        hp: state.motor.hp || 0
      } : null;
      
      return getContextualPrompts(motor, state.boatInfo, location.pathname);
    }, [state.motor, state.boatInfo, location.pathname]);

    // Get contextual welcome message
    const getWelcomeMessage = (): string => {
      const path = location.pathname;
      
      if (state.motor) {
        return `Hi! I see you're looking at the ${state.motor.model} (${state.motor.hp}HP). How can I help you with this motor?`;
      }
      if (path.includes('/quote/summary')) {
        return "Hi! I see you're reviewing your quote. Do you have any questions about pricing, financing, or your motor selection?";
      }
      if (path.includes('/financing')) {
        return "Hi! I can help with financing questions. What would you like to know about our financing options?";
      }
      if (path.includes('/promotions')) {
        return "Hi! Looking at our promotions? I can help explain the current offers and find the best deal for you.";
      }
      return "Hi there! I'm your Mercury Marine expert. I can help you find the perfect outboard motor, answer technical questions, or explain our current promotions. What can I help you with?";
    };

    // Initialize with welcome message when opened
    useEffect(() => {
      if (isOpen && messages.length === 0) {
        const welcomeMessage: Message = {
          id: 'welcome',
          text: getWelcomeMessage(),
          isUser: false,
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
        
        // If there's an initial message, send it after welcome
        if (initialMessage) {
          setTimeout(() => {
            handleSend(initialMessage);
          }, 500);
        }
      }
    }, [isOpen]);

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
        // Use streaming with typewriter effect
        await streamChat({
          message: text.trim(),
          conversationHistory,
          context: {
            currentMotor: state.motor ? {
              model: state.motor.model,
              hp: state.motor.hp,
              price: state.motor.msrp || state.motor.price
            } : null,
            currentPage: location.pathname,
            boatInfo: state.boatInfo
          },
          onDelta: (chunk) => {
            // Update message with each new chunk (typewriter effect)
            setMessages(prev => prev.map(msg => 
              msg.id === streamingId 
                ? { ...msg, text: msg.text + chunk, isStreaming: true }
                : msg
            ));
            scrollToBottom();
          },
          onDone: (fullResponse) => {
            // Mark streaming as complete
            setMessages(prev => prev.map(msg => 
              msg.id === streamingId 
                ? { ...msg, isStreaming: false }
                : msg
            ));
            
            // Update conversation history
            setConversationHistory(prev => [
              ...prev,
              { role: 'user', content: text.trim() },
              { role: 'assistant', content: fullResponse }
            ]);
            
            setIsLoading(false);
          },
          onError: (error) => {
            console.error('Stream error:', error);
            setMessages(prev => prev.map(msg => 
              msg.id === streamingId 
                ? { 
                    ...msg, 
                    text: "I'm sorry, I'm having trouble right now. Please try texting us at 647-952-2153 or call for immediate assistance.",
                    isStreaming: false 
                  }
                : msg
            ));
            setIsLoading(false);
          }
        });

      } catch (error) {
        console.error('Chat error:', error);
        setMessages(prev => prev.map(msg => 
          msg.id === streamingId 
            ? { 
                ...msg, 
                text: "I'm sorry, I'm having trouble right now. Please try texting us at 647-952-2153 or call for immediate assistance.",
                isStreaming: false 
              }
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

    // Expose methods via ref
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
          className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[380px] z-50"
        >
          {/* Glass container */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_8px_60px_-15px_rgba(0,0,0,0.2)] border border-gray-200/50 overflow-hidden">
            
            {/* Header - Light & Elegant */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white/80">
              <div className="flex items-center gap-3">
                {/* Glowing orb icon */}
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-lg">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  {/* Online indicator */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-[15px]">Mercury Expert</h3>
                  <p className="text-xs text-gray-500 font-light">Always here to help</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 h-9 w-9 p-0 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {!isMinimized && (
              <div className="flex flex-col h-[60vh] sm:h-[420px]">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gradient-to-b from-gray-50/50 to-white">
                  <AnimatePresence initial={false}>
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index === messages.length - 1 ? 0 : 0 }}
                        className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                      >
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
                                {message.text}
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
                            </>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>

                {/* Suggested Questions - Pill Style */}
                {messages.length <= 1 && !isLoading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="px-5 pb-3"
                  >
                    <p className="text-[11px] text-gray-400 mb-2 uppercase tracking-wide">Suggested</p>
                    <div className="flex flex-wrap gap-2">
                      {contextualPrompts.map((q, i) => (
                        <motion.button
                          key={q}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.4 + i * 0.1 }}
                          onClick={() => handleSend(q)}
                          className="text-[13px] px-3.5 py-1.5 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600 transition-all duration-200 font-light"
                        >
                          {q}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Input Area - Clean & Minimal */}
                <div className="px-4 py-4 bg-white border-t border-gray-100">
                  <div className="flex items-center gap-2 bg-gray-50 rounded-full px-2 py-1 focus-within:ring-2 focus-within:ring-gray-200 transition-shadow">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask anything..."
                      className="flex-1 px-3 py-2.5 bg-transparent border-0 focus:outline-none text-[14px] text-gray-800 placeholder:text-gray-400 font-light"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={() => handleSend()}
                      disabled={!inputText.trim() || isLoading}
                      className="h-9 w-9 p-0 rounded-full bg-gray-900 hover:bg-gray-800 text-white transition-all duration-200 disabled:opacity-40 disabled:bg-gray-300"
                    >
                      <Send className="w-4 h-4" />
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
