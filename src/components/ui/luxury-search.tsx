import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  id: string;
  title: string;
  model: string;
  hp: number;
  shaft: string;
}

interface LuxurySearchProps {
  autoFocus?: boolean;
  onResultSelect?: (result: SearchResult) => void;
}

export function LuxurySearch({ autoFocus = false, onResultSelect }: LuxurySearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Focus search on "/" key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setQuery('');
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-focus if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        // TODO: Implement actual search logic with Supabase
        // For now, mock results
        const mockResults: SearchResult[] = [
          { id: '1', title: '6 MH FourStroke', model: '6MH', hp: 6, shaft: 'Short (15")' },
          { id: '2', title: '9.9 ELH FourStroke', model: '9.9ELH', hp: 9.9, shaft: 'Long (20")' },
        ].filter(item => 
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.hp.toString().includes(query)
        );
        
        setResults(mockResults);
        setIsOpen(mockResults.length > 0);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleResultClick = (result: SearchResult) => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
    
    if (onResultSelect) {
      onResultSelect(result);
    } else {
      // Navigate to motor selection with search pre-filled
      navigate('/quote/motors', { state: { searchTerm: result.model } });
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const parseTokens = (searchQuery: string) => {
    const tokens = {
      hp: '',
      shaft: '',
      start: '',
      control: '',
      general: ''
    };

    const parts = searchQuery.split(/\s+/);
    const generalParts: string[] = [];

    parts.forEach(part => {
      if (part.startsWith('hp:')) {
        tokens.hp = part.substring(3);
      } else if (part.startsWith('shaft:')) {
        tokens.shaft = part.substring(6);
      } else if (part.startsWith('start:')) {
        tokens.start = part.substring(6);
      } else if (part.startsWith('control:')) {
        tokens.control = part.substring(8);
      } else {
        generalParts.push(part);
      }
    });

    tokens.general = generalParts.join(' ');
    return tokens;
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-luxury-gray" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search motors by HP, model, or keyword…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setIsOpen(true)}
          className="w-full h-12 pl-12 pr-12 rounded-full border border-luxury-hairline bg-white text-luxury-ink placeholder-luxury-gray focus:border-luxury-gray focus:ring-2 focus:ring-luxury-gray/20 focus:outline-none transition-colors"
          aria-label="Search motors by horsepower, model, or keyword"
        />
        
        {/* Clear Button */}
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-luxury-gray hover:text-luxury-ink transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Results */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-luxury-hairline rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-luxury-gray">
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-luxury-gray"></div>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-3 text-left hover:bg-luxury-stage transition-colors group"
                >
                  <div className="font-medium text-luxury-ink group-hover:text-luxury-near-black">
                    {result.title}
                  </div>
                  <div className="text-sm text-luxury-gray mt-1">
                    {result.model} • {result.hp}HP • {result.shaft}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-luxury-gray">
              No motors found
            </div>
          )}
          
          {/* Search Tips */}
          {!isLoading && (
            <div className="border-t border-luxury-hairline p-3 bg-luxury-stage text-xs text-luxury-gray">
              <p>Try: <code className="px-1 bg-white rounded">hp:25</code>, <code className="px-1 bg-white rounded">shaft:long</code>, or <code className="px-1 bg-white rounded">start:electric</code></p>
            </div>
          )}
        </div>
      )}
      
      {/* Search Overlay (for mobile full-screen) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}