import React, { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, X, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface AICommandBarProps {
  onAskAI: (question: string) => void;
  placeholder?: string;
}

interface SearchResult {
  id: string;
  title: string;
  model: string;
  hp: number;
  shaft: string;
  price?: number;
}

// Keywords that indicate a question for AI
const AI_TRIGGER_WORDS = [
  'what', 'which', 'best', 'compare', 'recommend', 'help', 'how', 'why',
  'should', 'can', 'difference', 'vs', 'versus', 'better', 'good for',
  'need', 'looking for', 'suggest', '?'
];

const SUGGESTED_PROMPTS = [
  "What's the best motor for fishing?",
  "Compare 115HP vs 150HP",
  "What promotions are active?",
  "Best motor for a pontoon boat?"
];

export const AICommandBar: React.FC<AICommandBarProps> = ({ 
  onAskAI, 
  placeholder = "Search motors or ask a question..." 
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAIQuery, setIsAIQuery] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Detect if query is an AI question
  useEffect(() => {
    const lowerQuery = query.toLowerCase().trim();
    const isQuestion = AI_TRIGGER_WORDS.some(word => lowerQuery.includes(word));
    setIsAIQuery(isQuestion);
  }, [query]);

  // Focus search on "/" key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && 
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setQuery('');
        setIsOpen(false);
        setAiResponse(null);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search/AI query
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setAiResponse(null);
      setIsOpen(false);
      return;
    }

    setIsOpen(true);
    const timer = setTimeout(async () => {
      if (isAIQuery) {
        // Get AI response
        setAiLoading(true);
        try {
          const { data, error } = await supabase.functions.invoke('ai-chatbot', {
            body: { message: query.trim(), conversationHistory: [] }
          });

          if (!error && data?.reply) {
            // Truncate to first 2-3 sentences for inline display
            const sentences = data.reply.split(/[.!?]+/).filter(Boolean);
            const preview = sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '...' : '.');
            setAiResponse(preview);
          }
        } catch (error) {
          console.error('AI query error:', error);
          setAiResponse("I can help with that! Click to continue chatting...");
        } finally {
          setAiLoading(false);
        }
      }

      // Also search motors
      setIsLoading(true);
      try {
        const { data: motors, error } = await supabase
          .from('motor_models')
          .select('id, model, model_display, horsepower, shaft, msrp, sale_price')
          .or(`model.ilike.%${query}%,model_display.ilike.%${query}%`)
          .limit(5);

        if (!error && motors) {
          setSearchResults(motors.map(m => ({
            id: m.id,
            title: m.model_display || m.model,
            model: m.model,
            hp: m.horsepower || 0,
            shaft: m.shaft || 'Standard',
            price: m.sale_price || m.msrp
          })));
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, isAIQuery]);

  const handleResultClick = (result: SearchResult) => {
    setQuery('');
    setIsOpen(false);
    navigate('/quote/motor-selection', { state: { searchTerm: result.model, highlightMotorId: result.id } });
  };

  const handleAIClick = () => {
    onAskAI(query);
    setQuery('');
    setIsOpen(false);
    setAiResponse(null);
  };

  const handlePromptClick = (prompt: string) => {
    onAskAI(prompt);
    setQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setSearchResults([]);
    setAiResponse(null);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full max-w-xl mx-auto">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {isAIQuery ? (
            <Sparkles className="h-5 w-5 text-amber-500" />
          ) : (
            <Search className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setIsOpen(true)}
          className={`w-full h-12 pl-12 pr-12 rounded-full border bg-background text-foreground placeholder-muted-foreground focus:ring-2 focus:outline-none transition-all ${
            isAIQuery 
              ? 'border-amber-300 focus:border-amber-400 focus:ring-amber-200' 
              : 'border-border focus:border-primary focus:ring-primary/20'
          }`}
          aria-label="Search motors or ask AI a question"
        />
        
        {/* Clear Button */}
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Keyboard hint */}
        {!query && (
          <kbd className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
            /
          </kbd>
        )}
      </div>

      {/* Suggested Prompts (when focused but no query) */}
      {isOpen && !query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 p-3">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Try asking:
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handlePromptClick(prompt)}
                className="text-sm px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-foreground transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results Dropdown */}
      {isOpen && query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 max-h-[70vh] overflow-y-auto">
          {/* AI Response Section */}
          {isAIQuery && (
            <div className="p-4 border-b border-border">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-amber-600 mb-1">AI Response</p>
                  {aiLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  ) : aiResponse ? (
                    <>
                      <p className="text-sm text-foreground leading-relaxed">{aiResponse}</p>
                      <button
                        onClick={handleAIClick}
                        className="mt-2 text-sm text-primary hover:text-primary/80 flex items-center gap-1 font-medium"
                      >
                        Continue conversation
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {/* Motor Search Results */}
          {(isLoading || searchResults.length > 0) && (
            <div className="py-2">
              {searchResults.length > 0 && (
                <p className="px-4 py-1 text-xs font-medium text-muted-foreground">
                  Matching Motors
                </p>
              )}
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin inline-block" />
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className="w-full px-4 py-3 text-left hover:bg-muted transition-colors group"
                  >
                    <div className="font-medium text-foreground group-hover:text-primary">
                      {result.title}
                    </div>
                    <div className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
                      <span>{result.hp}HP</span>
                      <span>•</span>
                      <span>{result.shaft}</span>
                      {result.price && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-600 font-medium">
                            ${result.price.toLocaleString()}
                          </span>
                        </>
                      )}
                    </div>
                  </button>
                ))
              ) : !isAIQuery ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No motors found for "{query}"
                </div>
              ) : null}
            </div>
          )}

          {/* Search Tips */}
          {!isLoading && !isAIQuery && (
            <div className="border-t border-border p-3 bg-muted/50 text-xs text-muted-foreground">
              <p className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Tip: Ask a question like "best motor for fishing" for AI recommendations
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
