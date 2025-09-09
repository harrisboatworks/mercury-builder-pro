import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
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

export const ChatWidget: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if we're on a quote page where sticky bar might be present
  const isOnQuotePage = location.pathname.startsWith('/quote');
  const bottomPosition = isOnQuotePage ? 'bottom-20' : 'bottom-6';

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

  if (!isOpen) {
    return (
      <div className={`fixed ${bottomPosition} right-6 z-[1000]`}>
        <Button
          onClick={handleOpen}
          className="bg-red-600 hover:bg-red-700 text-white shadow-lg rounded-full w-14 h-14 p-0 flex items-center justify-center transition-all duration-200 hover:scale-105"
          aria-label="Open Chat"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed ${bottomPosition} right-6 z-[1000]`}>
      <Card className={`w-80 md:w-96 transition-all duration-200 ${isMinimized ? 'h-14' : 'h-96'} shadow-xl border-2`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-red-600 text-white rounded-t-lg">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <h3 className="font-semibold">Harris Boat Works</h3>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:bg-red-700 h-8 w-8 p-0"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-red-700 h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-80">
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
              <SuggestedQuestions onQuestionSelect={handleSend} />
            )}

            {/* Input */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about motors, pricing, or technical specs..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  disabled={isLoading}
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={!inputText.trim() || isLoading}
                  className="bg-red-600 hover:bg-red-700 text-white h-10 w-10 p-0"
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