import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HelpCircle, X, Send, Minimize2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ChatBubble } from './ChatBubble';
import { TypingIndicator } from './TypingIndicator';
import { SuggestedQuestions } from './SuggestedQuestions';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatWidgetProps {
  className?: string;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

    try {
      const { data, error } = await supabase.functions.invoke('ai-chatbot', {
        body: {
          message: text.trim(),
          conversationHistory
        }
      });

      if (error) throw error;

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.reply,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setConversationHistory(data.conversationHistory || []);

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble right now. Please try texting us at 647-952-2153 or call for immediate assistance.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    
    // Add welcome message if no messages exist
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        text: "Hi there! I'm here to help you with Mercury outboard motors, pricing, and technical questions. How can I assist you today?",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  };

  // Show minimized help icon when chat is closed
  if (!isOpen) {
    return (
      <div className={className}>
        <Button
          onClick={handleOpen}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-primary transition-colors p-2"
          aria-label="Open Chat Support"
        >
          <HelpCircle className="w-5 h-5" />
        </Button>
      </div>
    );
  }

  // Responsive chat card for both mobile and desktop
  return (
    <div className="fixed top-4 right-4 bottom-4 left-4 sm:top-20 sm:right-6 sm:left-auto sm:bottom-auto z-50 sm:z-60">
      <Card 
        className={`w-full h-full sm:w-80 md:w-96 sm:h-auto transition-all duration-200 ${isMinimized ? 'sm:h-14' : 'sm:h-96'} shadow-xl border mobile-chat-card`}
        style={{ 
          backgroundColor: '#ffffff',
          background: '#ffffff',
          WebkitBackdropFilter: 'none',
          backdropFilter: 'none',
          borderColor: '#e5e7eb'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white dark:bg-gray-950 rounded-t-lg">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-gray-400" />
            <h3 className="font-light text-gray-600 dark:text-gray-300">Harris Support</h3>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 h-8 w-8 p-0 hidden sm:flex"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <CardContent 
            className="p-0 flex flex-col h-[calc(100%-60px)] sm:h-80 chat-mobile-fix" 
            style={{ 
              backgroundColor: '#ffffff',
              background: '#ffffff'
            }}
          >
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick questions for first interaction */}
            {messages.length <= 1 && !isLoading && (
              <div className="px-4">
                <SuggestedQuestions onQuestionSelect={handleSend} />
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-white dark:bg-gray-950">
              <div className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask us anything..."
                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 text-sm font-light placeholder:text-gray-400"
                  disabled={isLoading}
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={!inputText.trim() || isLoading}
                  className="bg-blue-500 hover:bg-blue-600 text-white h-10 w-10 p-0 rounded-md"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};