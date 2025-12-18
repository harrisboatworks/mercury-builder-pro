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
    <div className={cn('flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1', className)}>
      {HP_FILTERS.map(({ label, value }) => {
        const count = getCount(value);
        const isActive = activeFilter === value || (value === '' && !activeFilter);
        const hasStock = hasMotors(value);
        
        return (
          <button
            key={value}
            onClick={() => onFilterChange(value)}
            disabled={!hasStock && value !== ''}
            className={cn(
              'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
              'border whitespace-nowrap',
              isActive 
                ? 'bg-black text-white border-black' 
                : hasStock
                  ? 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                  : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
            )}
          >
            {label === 'All' ? label : `${label} HP`}
            {count > 0 && value !== '' && (
              <span className={cn(
                'ml-1.5 text-[10px]',
                isActive ? 'text-white/70' : 'text-gray-400'
              )}>
                ({count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
