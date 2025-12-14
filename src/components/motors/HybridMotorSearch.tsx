import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Search, Sparkles, X, MessageCircle, Mic, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHpSuggestions, HpSuggestion } from '@/hooks/useHpSuggestions';
import { HpSuggestionsDropdown } from '@/components/motors/HpSuggestionsDropdown';
import { useAIChat } from '@/components/chat/GlobalAIChat';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { supabase } from '@/integrations/supabase/client';
import type { Motor } from '@/components/QuoteBuilder';

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

interface HybridMotorSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  motors: Motor[];
  onHpSelect: (hp: number) => void;
  className?: string;
}

const RECENT_SEARCHES_KEY = 'motor-search-recent';
const MAX_RECENT_SEARCHES = 5;

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
  
  // Voice search state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  
  // Recent searches state
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  const { openChat } = useAIChat();
  const { triggerHaptic } = useHapticFeedback();
  const hpSuggestions = useHpSuggestions(query, motors);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load recent searches:', e);
    }
  }, []);

  // Check for Speech Recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        onQueryChange(transcript);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onQueryChange]);

  // Save search to recent searches
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) return;
    
    setRecentSearches(prev => {
      // Remove duplicates (case-insensitive)
      const filtered = prev.filter(s => s.toLowerCase() !== searchQuery.toLowerCase());
      const updated = [searchQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save recent searches:', e);
      }
      
      return updated;
    });
  }, []);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {
      console.error('Failed to clear recent searches:', e);
    }
    triggerHaptic('light');
  }, [triggerHaptic]);

  // Toggle voice search
  const toggleVoiceSearch = useCallback(() => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      triggerHaptic('medium');
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening, triggerHaptic]);

  // Handle recent search click
  const handleRecentSearchClick = useCallback((search: string) => {
    onQueryChange(search);
    triggerHaptic('light');
    inputRef.current?.focus();
  }, [onQueryChange, triggerHaptic]);

  // Keyboard shortcut "/" to focus search
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

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
          saveRecentSearch(query);
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
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    inputRef.current?.focus();
  };

  // Save search on blur
  const handleBlur = () => {
    setTimeout(() => setIsFocused(false), 200);
    if (query.trim()) {
      saveRecentSearch(query);
    }
  };

  const handleKeyDownWithSave = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim() && !showHpSuggestions) {
      saveRecentSearch(query);
    }
    handleKeyDown(e);
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
            ${isListening ? 'text-red-500' : isAIQuery ? 'text-amber-500' : 'text-gray-400'}
          `}
        >
          {isListening ? (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <Mic className="w-5 h-5" />
            </motion.div>
          ) : isAIQuery ? (
            <Sparkles className="w-5 h-5" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </motion.div>
        
        {/* Animated Placeholder Overlay with Typing Cursor */}
        {!query && !isListening && (
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

        {/* Listening indicator */}
        {isListening && !query && (
          <div className="absolute left-14 top-1/2 -translate-y-1/2 pointer-events-none">
            <span className="text-red-500 font-light text-base">Listening...</span>
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
          onBlur={handleBlur}
          onKeyDown={handleKeyDownWithSave}
          className={`
            w-full h-16 pl-14 pr-12 text-base font-light tracking-wide rounded-sm
            bg-white text-gray-900
            focus:outline-none transition-all duration-300
            ${isListening
              ? 'border-2 border-red-400 shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
              : isAIQuery 
                ? 'border-2 border-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.1)]' 
                : isFocused
                  ? 'border border-gray-400 shadow-[0_0_20px_rgba(0,0,0,0.08),0_0_0_3px_rgba(0,0,0,0.03)]'
                  : 'border border-gray-200 hover:border-gray-300'
            }
          `}
        />
        
        {/* Keyboard Shortcut Hint & Voice Search */}
        <AnimatePresence>
          {!isFocused && !query && !isListening && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2"
            >
              {/* Voice Search Button - Mobile Only */}
              {speechSupported && (
                <button
                  onClick={toggleVoiceSearch}
                  className="md:hidden p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Voice search"
                >
                  <Mic className="w-5 h-5" />
                </button>
              )}
              
              {/* Keyboard Shortcut - Desktop Only */}
              <div className="hidden md:flex items-center gap-1.5">
                <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 border border-gray-200 rounded text-gray-500 shadow-sm">
                  /
                </kbd>
                <span className="text-xs text-gray-400 font-light">to search</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Voice Search Active Indicator */}
        <AnimatePresence>
          {isListening && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={toggleVoiceSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2"
              aria-label="Stop listening"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="relative"
              >
                <Mic className="w-5 h-5 text-red-500" />
                <motion.div
                  className="absolute inset-0 rounded-full bg-red-500/20"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </motion.div>
            </motion.button>
          )}
        </AnimatePresence>

        {query && !isListening && (
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
            saveRecentSearch(query);
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
                      <div className="space-y-2">
                        {[100, 85, 60].map((width, i) => (
                          <motion.div
                            key={i}
                            className="h-3 rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%]"
                            style={{ width: `${width}%` }}
                            animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "linear",
                              delay: i * 0.1
                            }}
                          />
                        ))}
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

            {/* Recent Searches (when empty and has history) */}
            {!query && recentSearches.length > 0 && (
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs font-medium text-gray-500 uppercase tracking-wide"
                  >
                    Recent
                  </motion.p>
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={clearRecentSearches}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Clear
                  </motion.button>
                </div>
                <div className="space-y-1">
                  {recentSearches.map((search, index) => (
                    <motion.button
                      key={search}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleRecentSearchClick(search)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors flex items-center gap-2"
                    >
                      <History className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{search}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Prompts (when empty) - Staggered Animation */}
            {!query && (
              <div className="p-4">
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide"
                >
                  Try asking
                </motion.p>
                <div className="space-y-2">
                  {SUGGESTED_PROMPTS.map((prompt, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ 
                        delay: 0.15 + (index * 0.08),
                        duration: 0.3,
                        ease: "easeOut"
                      }}
                      onClick={() => handlePromptClick(prompt)}
                      className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      {prompt}
                    </motion.button>
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