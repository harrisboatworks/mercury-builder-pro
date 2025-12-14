import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Sparkles, X, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHpSuggestions, HpSuggestion } from '@/hooks/useHpSuggestions';
import { HpSuggestionsDropdown } from '@/components/motors/HpSuggestionsDropdown';
import { useAIChat } from '@/components/chat/GlobalAIChat';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { supabase } from '@/integrations/supabase/client';
import type { Motor } from '@/components/QuoteBuilder';

interface HybridMotorSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  motors: Motor[];
  onHpSelect: (hp: number) => void;
  className?: string;
}

// Words that trigger AI mode
const AI_TRIGGER_WORDS = [
  'what', 'which', 'best', 'recommend', 'compare', 'difference',
  'should', 'help', 'suggest', 'good', 'better', 'between',
  'why', 'how', 'tell', 'explain', 'need', '?'
];

const SUGGESTED_PROMPTS = [
  "What's the best motor for fishing?",
  "Compare 115HP vs 150HP",
  "What promotions are active?",
  "Best motor for a pontoon boat?"
];

// Cycling placeholder phrases - short for mobile
const PLACEHOLDER_PHRASES = [
  "Search by HP...",
  "Ask a question...",
  "Compare motors...",
  "Find promotions...",
  "Best for fishing?",
  "Search models..."
];
export const HybridMotorSearch: React.FC<HybridMotorSearchProps> = ({
  query,
  onQueryChange,
  motors,
  onHpSelect,
  className = ''
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showHpSuggestions, setShowHpSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [iconPulse, setIconPulse] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  const { openChat } = useAIChat();
  const { triggerHaptic } = useHapticFeedback();
  const hpSuggestions = useHpSuggestions(query, motors);

  // Cycle through placeholder phrases (pause on hover)
  useEffect(() => {
    if (isHovered) return;
    
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_PHRASES.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isHovered]);

  // Trigger icon pulse when placeholder changes
  useEffect(() => {
    setIconPulse(true);
    const timeout = setTimeout(() => setIconPulse(false), 500);
    return () => clearTimeout(timeout);
  }, [placeholderIndex]);

  // Detect if query is an AI question
  const isAIQuery = useMemo(() => {
    if (!query.trim()) return false;
    const lowerQuery = query.toLowerCase();
    return AI_TRIGGER_WORDS.some(word => lowerQuery.includes(word));
  }, [query]);

  // Detect if query is numeric (for HP suggestions)
  const isNumericQuery = useMemo(() => {
    return /^\d+(\.\d+)?$/.test(query.trim());
  }, [query]);

  // Fetch AI response when query changes and is AI-type
  useEffect(() => {
    if (!isAIQuery || query.length < 5) {
      setAiResponse(null);
      return;
    }

    // Debounce AI calls
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoadingAI(true);
      try {
        const { data, error } = await supabase.functions.invoke('ai-chatbot-stream', {
          body: {
            message: query,
            conversationHistory: [],
            context: { page: 'motor-selection', isSearchQuery: true }
          }
        });

        if (error) throw error;
        
        // Truncate response for preview (first 2-3 sentences)
        const fullResponse = data?.reply || '';
        const sentences = fullResponse.split(/[.!?]+/).filter(Boolean);
        const preview = sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '...' : '.');
        setAiResponse(preview);
      } catch (err) {
        console.error('AI search error:', err);
        setAiResponse(null);
      } finally {
        setIsLoadingAI(false);
      }
    }, 800);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, isAIQuery]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showHpSuggestions || hpSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < hpSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (hpSuggestions[selectedSuggestionIndex]) {
          onHpSelect(hpSuggestions[selectedSuggestionIndex].hp);
          setShowHpSuggestions(false);
        }
        break;
      case 'Escape':
        setShowHpSuggestions(false);
        setSelectedSuggestionIndex(0);
        break;
    }
  };

  const handleClear = () => {
    onQueryChange('');
    setShowHpSuggestions(false);
    setAiResponse(null);
    inputRef.current?.focus();
  };

  const handlePromptClick = (prompt: string) => {
    openChat(prompt);
  };

  const handleContinueConversation = () => {
    openChat(query);
  };

  const showDropdown = isFocused && (
    (isAIQuery && (aiResponse || isLoadingAI)) ||
    (isNumericQuery && hpSuggestions.length > 0) ||
    (!query && isFocused)
  );

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div 
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Animated Search Icon with Pulse */}
        <motion.div
          animate={iconPulse ? { 
            scale: [1, 1.15, 1],
            opacity: [1, 0.8, 1]
          } : {}}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={`
            absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-300
            ${isAIQuery ? 'text-amber-500' : 'text-gray-400'}
          `}
        >
          {isAIQuery ? (
            <Sparkles className="w-5 h-5" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </motion.div>
        
        {/* Animated Placeholder Overlay with Typing Cursor */}
        {!query && (
          <div className="absolute left-14 top-1/2 -translate-y-1/2 pointer-events-none overflow-hidden flex items-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={placeholderIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="text-gray-400 font-light text-base"
              >
                {PLACEHOLDER_PHRASES[placeholderIndex]}
              </motion.span>
            </AnimatePresence>
            {/* Blinking Typing Cursor */}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ 
                duration: 0.7, 
                repeat: Infinity, 
                repeatType: "reverse",
                ease: "easeInOut"
              }}
              className="inline-block w-0.5 h-5 bg-gray-400 ml-0.5"
            />
          </div>
        )}
        
        <input
          ref={inputRef}
          type="text"
          placeholder=""
          value={query}
          onChange={(e) => {
            onQueryChange(e.target.value);
            if (/^\d/.test(e.target.value)) {
              setShowHpSuggestions(true);
              setSelectedSuggestionIndex(0);
            }
          }}
          onFocus={() => {
            setIsFocused(true);
            triggerHaptic('light');
          }}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onKeyDown={handleKeyDown}
          className={`
            w-full h-16 pl-14 pr-12 text-base font-light tracking-wide rounded-sm
            bg-white text-gray-900
            focus:outline-none transition-all duration-300
            ${isAIQuery 
              ? 'border-2 border-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.1)]' 
              : 'border border-gray-200 focus:border-gray-400'
            }
          `}
        />
        
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* HP Suggestions Dropdown (for numeric queries) */}
      {showHpSuggestions && isNumericQuery && hpSuggestions.length > 0 && (
        <HpSuggestionsDropdown
          suggestions={hpSuggestions}
          onSelect={(hp) => {
            onHpSelect(hp);
            setShowHpSuggestions(false);
          }}
          onClose={() => setShowHpSuggestions(false)}
          selectedIndex={selectedSuggestionIndex}
        />
      )}

      {/* AI Response & Suggestions Dropdown */}
      <AnimatePresence>
        {showDropdown && !isNumericQuery && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg border border-gray-200 shadow-xl z-50 overflow-hidden"
          >
            {/* AI Response Preview */}
            {isAIQuery && (isLoadingAI || aiResponse) && (
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-amber-600 mb-1">AI Assistant</p>
                    {isLoadingAI ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 font-light leading-relaxed">
                        {aiResponse}
                      </p>
                    )}
                  </div>
                </div>
                
                {aiResponse && (
                  <button
                    onClick={handleContinueConversation}
                    className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Continue conversation
                  </button>
                )}
              </div>
            )}

            {/* Suggested Prompts (when empty) */}
            {!query && (
              <div className="p-4">
                <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Try asking</p>
                <div className="space-y-2">
                  {SUGGESTED_PROMPTS.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handlePromptClick(prompt)}
                      className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
