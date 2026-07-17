import React from 'react';
import { X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecentlyViewedItem {
  id: string;
  model: string;
  hp: number;
  price: number;
  image?: string;
}

interface RecentlyViewedBarProps {
  items: RecentlyViewedItem[];
  onSelect: (id: string) => void;
  onClear: () => void;
  className?: string;
}

export function RecentlyViewedBar({ items, onSelect, onClear, className }: RecentlyViewedBarProps) {
  if (items.length === 0) return null;

  return (
    <div className={cn('block bg-repower-paper border-y border-repower-gold/10', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 sm:py-3">
        <div className="grid grid-cols-[minmax(0,1fr)_28px] min-[480px]:grid-cols-[auto_minmax(0,1fr)_28px] items-center gap-2 sm:gap-3 min-w-0">
          {/* Label, hidden on smallest viewports */}
          <div className="hidden min-[480px]:flex items-center gap-1.5 text-xs text-repower-navy-900/55 flex-shrink-0">
            <Clock size={14} />
            <span>Recently Viewed</span>
          </div>

          {/* Scrollable items with scroll-snap on mobile */}
          <div className="min-w-0 overflow-x-auto scrollbar-hide snap-x snap-mandatory sm:snap-none">
            <div className="flex flex-nowrap gap-1.5 sm:gap-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  className="snap-start inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-repower-paper/80 hover:bg-repower-paper border border-repower-gold/10 rounded-full transition-colors flex-shrink-0 group max-w-[180px]"
                >
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.model}
                      className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0"
                    />
                  )}
                  <span className="text-[11px] sm:text-xs font-medium text-repower-navy-900/75 whitespace-nowrap truncate">
                    {item.model}
                  </span>
                  <span className="hidden sm:inline text-xs text-repower-navy-900/40 whitespace-nowrap">
                    ${item.price.toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Clear button */}
          <button
            onClick={onClear}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-repower-navy-900/35 hover:text-repower-navy-900/65 hover:bg-repower-paper/80 transition-colors justify-self-end"
            aria-label="Clear recently viewed"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
