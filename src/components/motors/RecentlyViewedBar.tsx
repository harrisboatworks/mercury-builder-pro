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
    <div className={cn('block bg-white border-b border-gray-100', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 sm:py-3">
        <div className="flex flex-nowrap items-center gap-2 sm:gap-3 min-w-0">
          {/* Label — hidden on smallest viewports */}
          <div className="hidden min-[480px]:flex items-center gap-1.5 text-xs text-gray-500 flex-shrink-0">
            <Clock size={14} />
            <span>Recently Viewed</span>
          </div>
          
          {/* Scrollable items with scroll-snap on mobile */}
          <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide snap-x snap-mandatory sm:snap-none">
            <div className="flex flex-nowrap gap-1.5 sm:gap-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  className="snap-start inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 group max-w-[180px]"
                >
                  {item.image && (
                    <img 
                      src={item.image} 
                      alt={item.model}
                      className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0"
                    />
                  )}
                  <span className="text-[11px] sm:text-xs font-medium text-gray-700 whitespace-nowrap truncate">
                    {item.model}
                  </span>
                  <span className="hidden sm:inline text-xs text-gray-400 whitespace-nowrap">
                    ${item.price.toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Clear button */}
          <button
            onClick={onClear}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear recently viewed"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
