import React from 'react';
import { cn } from '@/lib/utils';
import { Package, Zap, Hand, Anchor, Ruler } from 'lucide-react';

export interface ConfigFiltersState {
  startType?: 'electric' | 'manual';
  controlType?: 'tiller' | 'remote';
  shaftLength?: 'short' | 'long' | 'xl' | 'xxl';
  inStock?: boolean;
}

interface ConfigFilterPillsProps {
  filters: ConfigFiltersState | null;
  onFilterChange: (filters: ConfigFiltersState | null) => void;
  className?: string;
}

interface FilterPillProps {
  label: string;
  icon?: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

function FilterPill({ label, icon, isActive, onClick }: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
        'transition-all duration-200 ease-out whitespace-nowrap',
        'border',
        isActive 
          ? 'bg-primary text-primary-foreground border-primary shadow-sm' 
          : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:bg-muted/50'
      )}
    >
      {icon}
      {label}
    </button>
  );
}

export function ConfigFilterPills({ filters, onFilterChange, className }: ConfigFilterPillsProps) {
  const currentFilters = filters || {};

  const toggleFilter = <K extends keyof ConfigFiltersState>(
    key: K, 
    value: ConfigFiltersState[K]
  ) => {
    const newFilters = { ...currentFilters };
    
    if (newFilters[key] === value) {
      // Toggle off
      delete newFilters[key];
    } else {
      // Set value
      newFilters[key] = value;
    }
    
    // If all filters removed, set to null
    if (Object.keys(newFilters).length === 0) {
      onFilterChange(null);
    } else {
      onFilterChange(newFilters);
    }
  };

  const clearAll = () => {
    onFilterChange(null);
  };

  const hasActiveFilters = filters && Object.keys(filters).length > 0;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Filter pills row */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* In Stock */}
        <FilterPill
          label="In Stock"
          icon={<Package className="h-3 w-3" />}
          isActive={currentFilters.inStock === true}
          onClick={() => toggleFilter('inStock', true)}
        />

        {/* Divider */}
        <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

        {/* Start Type */}
        <FilterPill
          label="Electric"
          icon={<Zap className="h-3 w-3" />}
          isActive={currentFilters.startType === 'electric'}
          onClick={() => toggleFilter('startType', 'electric')}
        />
        <FilterPill
          label="Pull-Start"
          icon={<Hand className="h-3 w-3" />}
          isActive={currentFilters.startType === 'manual'}
          onClick={() => toggleFilter('startType', 'manual')}
        />

        {/* Divider */}
        <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

        {/* Control Type */}
        <FilterPill
          label="Tiller"
          icon={<Anchor className="h-3 w-3" />}
          isActive={currentFilters.controlType === 'tiller'}
          onClick={() => toggleFilter('controlType', 'tiller')}
        />
        <FilterPill
          label="Remote"
          isActive={currentFilters.controlType === 'remote'}
          onClick={() => toggleFilter('controlType', 'remote')}
        />

        {/* Divider */}
        <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

        {/* Shaft Length */}
        <FilterPill
          label="15″ Short"
          icon={<Ruler className="h-3 w-3" />}
          isActive={currentFilters.shaftLength === 'short'}
          onClick={() => toggleFilter('shaftLength', 'short')}
        />
        <FilterPill
          label="20″ Long"
          isActive={currentFilters.shaftLength === 'long'}
          onClick={() => toggleFilter('shaftLength', 'long')}
        />
        <FilterPill
          label="25″ XL"
          isActive={currentFilters.shaftLength === 'xl'}
          onClick={() => toggleFilter('shaftLength', 'xl')}
        />

        {/* Clear All */}
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-foreground underline ml-2"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
