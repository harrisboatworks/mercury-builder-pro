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
    <div className={cn('bg-white border-b border-gray-100', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center gap-3">
          {/* Label */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 flex-shrink-0">
            <Clock size={14} />
            <span className="hidden sm:inline">Recently Viewed</span>
          </div>
          
          {/* Scrollable items */}
          <div className="flex-1 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 group"
                >
                  {item.image && (
                    <img 
                      src={item.image} 
                      alt={item.model}
                      className="w-6 h-6 object-contain"
                    />
                  )}
                  <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
                    {item.hp} HP
                  </span>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
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
