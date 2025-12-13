import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Send, Minimize2, Sparkles, Loader2 } from 'lucide-react';
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
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-50"
        >
          <Card className="shadow-2xl border border-border overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-foreground to-foreground/90 text-background">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Mercury Expert</h3>
                  <p className="text-xs opacity-70">AI-Powered Assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-background/70 hover:text-background hover:bg-background/10 h-8 w-8 p-0 hidden sm:flex"
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-background/70 hover:text-background hover:bg-background/10 h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {!isMinimized && (
              <CardContent className="p-0 flex flex-col h-[60vh] sm:h-96">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                          message.isUser
                            ? 'bg-foreground text-background rounded-br-md'
                            : 'bg-muted text-foreground rounded-bl-md'
                        }`}
                      >
                        {message.isStreaming && message.text === '' ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Thinking...</span>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">
                              {message.text}
                              {message.isStreaming && (
                                <span className="inline-block w-1.5 h-4 bg-current ml-0.5 animate-pulse" />
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
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Suggested Questions (contextual) */}
                {messages.length <= 1 && !isLoading && (
                  <div className="px-4 pb-2">
                    <p className="text-xs text-muted-foreground mb-2">Quick questions:</p>
                    <div className="flex flex-wrap gap-2">
                      {contextualPrompts.map((q) => (
                        <button
                          key={q}
                          onClick={() => handleSend(q)}
                          className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-foreground transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="p-4 border-t border-border bg-background">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask anything about Mercury motors..."
                      className="flex-1 px-4 py-2.5 bg-muted border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm placeholder:text-muted-foreground"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={() => handleSend()}
                      disabled={!inputText.trim() || isLoading}
                      className="h-10 w-10 p-0 rounded-full bg-foreground hover:bg-foreground/90 text-background"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>
    );
  }
);

EnhancedChatWidget.displayName = 'EnhancedChatWidget';
