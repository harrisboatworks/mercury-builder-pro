import React from 'react';
import { cn } from '@/lib/utils';
import type { Motor } from '@/lib/motor-helpers';

interface QuickHPFiltersProps {
  motors: Motor[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  className?: string;
}

// Popular HP values to show as quick filters
const HP_FILTERS = [
  { label: 'All', value: '' },
  { label: '2.5', value: '2.5' },
  { label: '9.9', value: '9.9' },
  { label: '25', value: '25' },
  { label: '40', value: '40' },
  { label: '60', value: '60' },
  { label: '115', value: '115' },
  { label: '150', value: '150' },
  { label: '300+', value: 'hp:>299' }
];

export function QuickHPFilters({ motors, activeFilter, onFilterChange, className }: QuickHPFiltersProps) {
  // Calculate counts for each HP filter
  const getCount = (filter: string): number => {
    if (filter === '') return motors.length;
    if (filter === 'hp:>299') return motors.filter(m => m.hp >= 300).length;
    const hp = parseFloat(filter);
    return motors.filter(m => m.hp === hp).length;
  };

  // Check if any motors exist for this filter
  const hasMotors = (filter: string): boolean => getCount(filter) > 0;

  return (
    <div 
      className={cn(
        'flex flex-row gap-2 md:gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1',
        className
      )}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {HP_FILTERS.map(({ label, value }) => {
        const isActive = activeFilter === value || (value === '' && !activeFilter);
        const hasStock = hasMotors(value);
        
        return (
          <button
            key={value}
            onClick={() => onFilterChange(value)}
            disabled={!hasStock && value !== ''}
            className={cn(
              'flex-shrink-0 px-3 py-1.5 md:px-5 md:py-2.5 rounded-full text-xs md:text-sm font-light tracking-wide transition-all duration-300 ease-out',
              'whitespace-nowrap relative overflow-hidden',
              isActive 
                ? 'bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg shadow-gray-900/20' 
                : hasStock
                  ? 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:shadow-md hover:scale-[1.02]'
                  : 'bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed opacity-60'
            )}
          >
            <span className="relative z-10">
              <span className="md:hidden">{label === 'All' ? 'All' : label}</span>
              <span className="hidden md:inline">{label === 'All' ? 'All Motors' : `${label} HP`}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
