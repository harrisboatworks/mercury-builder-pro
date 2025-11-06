import { useEffect, useRef } from 'react';
import type { HpSuggestion } from '@/hooks/useHpSuggestions';

interface HpSuggestionsDropdownProps {
  suggestions: HpSuggestion[];
  onSelect: (hp: number) => void;
  onClose: () => void;
  selectedIndex: number;
}

export function HpSuggestionsDropdown({
  suggestions,
  onSelect,
  onClose,
  selectedIndex,
}: HpSuggestionsDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-sm shadow-lg z-50 max-h-[320px] overflow-y-auto"
    >
      {suggestions.map((suggestion, index) => (
        <button
          key={suggestion.hp}
          ref={index === selectedIndex ? selectedItemRef : null}
          onClick={() => onSelect(suggestion.hp)}
          className={`w-full px-6 py-3 text-left flex items-center justify-between hover:bg-muted transition-colors ${
            index === selectedIndex ? 'bg-muted' : ''
          } ${suggestion.isExactMatch ? 'border-l-2 border-primary' : ''}`}
        >
          <span className={`text-sm ${suggestion.isExactMatch ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
            {suggestion.hp} HP
          </span>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {suggestion.inStockCount > 0 && (
              <span className="text-green-600 font-medium">
                {suggestion.inStockCount} in stock
              </span>
            )}
            <span>
              {suggestion.count} {suggestion.count === 1 ? 'model' : 'models'}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
