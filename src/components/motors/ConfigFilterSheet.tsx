import React, { useState, useEffect, useRef } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import type { Motor } from '@/lib/motor-helpers';

// Re-export the type for consumers
export interface ConfigFiltersState {
  startType?: 'electric' | 'manual';
  controlType?: 'tiller' | 'remote';
  shaftLength?: 'short' | 'long' | 'xl' | 'xxl';
  inStock?: boolean;
}

// HP filter options with popular flag
const HP_FILTERS = [
  { label: 'All', value: '', popular: false },
  { label: '2.5', value: '2.5', popular: false },
  { label: '9.9', value: '9.9', popular: false },
  { label: '25', value: '25', popular: true },
  { label: '40', value: '40', popular: true },
  { label: '60', value: '60', popular: true },
  { label: '115', value: '115', popular: false },
  { label: '150', value: '150', popular: false },
  { label: '300+', value: 'hp:>299', popular: false }
];

interface ConfigFilterSheetProps {
  filters: ConfigFiltersState | null;
  onFilterChange: (filters: ConfigFiltersState | null) => void;
  motors: Motor[];
  activeHpFilter: string;
  onHpFilterChange: (filter: string) => void;
  className?: string;
}

export function ConfigFilterSheet({ 
  filters, 
  onFilterChange, 
  motors,
  activeHpFilter,
  onHpFilterChange,
  className 
}: ConfigFilterSheetProps) {
  const [open, setOpen] = useState(false);
  const [badgePulse, setBadgePulse] = useState(false);
  const prevCountRef = useRef(0);

  // Count HP as 1 if active, plus config filter keys
  const hpActive = activeHpFilter ? 1 : 0;
  const configActive = filters ? Object.keys(filters).length : 0;
  const activeCount = hpActive + configActive;

  // Pulse animation when filter count changes
  useEffect(() => {
    if (activeCount !== prevCountRef.current && activeCount > 0) {
      setBadgePulse(true);
      const timeout = setTimeout(() => setBadgePulse(false), 400);
      prevCountRef.current = activeCount;
      return () => clearTimeout(timeout);
    }
    prevCountRef.current = activeCount;
  }, [activeCount]);

  // Calculate counts for each HP filter
  const getHpCount = (filter: string): number => {
    if (filter === '') return motors.length;
    if (filter === 'hp:>299') return motors.filter(m => m.hp >= 300).length;
    const hp = parseFloat(filter);
    return motors.filter(m => m.hp === hp).length;
  };

  const hasMotors = (filter: string): boolean => getHpCount(filter) > 0;

  const handleClearAll = () => {
    onFilterChange(null);
    onHpFilterChange('');
  };

  const handleDone = () => {
    setOpen(false);
  };

  // Toggle a config filter value
  const toggleFilter = <K extends keyof ConfigFiltersState>(key: K, value: ConfigFiltersState[K]) => {
    const current = filters?.[key];
    if (current === value) {
      // Remove the filter
      const newFilters = { ...filters };
      delete newFilters[key];
      onFilterChange(Object.keys(newFilters).length > 0 ? newFilters : null);
    } else {
      // Set the filter
      onFilterChange({ ...filters, [key]: value });
    }
  };

  const FilterPill = ({ 
    label, 
    isActive, 
    onClick 
  }: { 
    label: string; 
    isActive: boolean; 
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center w-fit px-3 py-1.5 rounded-full text-sm font-light shrink-0',
        'transition-all duration-200',
        isActive 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      )}
    >
      {label}
    </button>
  );

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className={cn("h-10 w-10 shrink-0", className)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeCount > 0 && (
            <Badge 
              variant="secondary" 
              className={cn(
                "absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1.5 text-xs bg-primary text-primary-foreground transition-transform",
                badgePulse && "animate-[pulse_0.4s_ease-out] scale-110"
              )}
            >
              {activeCount}
            </Badge>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Filter Motors</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4 space-y-5 overflow-y-auto max-h-[60vh]">
          {/* HP Filter Section */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Horsepower</h4>
            <div className="flex flex-wrap gap-1.5">
              {HP_FILTERS.map(({ label, value, popular }) => {
                const isActive = activeHpFilter === value || (value === '' && !activeHpFilter);
                const hasStock = hasMotors(value);
                
                return (
                  <button
                    key={value}
                    onClick={() => onHpFilterChange(value)}
                    disabled={!hasStock && value !== ''}
                    className={cn(
                      'inline-flex items-center gap-1 w-fit px-3 py-1.5 rounded-full text-sm font-light shrink-0',
                      'transition-all duration-200',
                      isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : hasStock
                          ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                          : 'bg-muted/50 text-muted-foreground/50 cursor-not-allowed'
                    )}
                  >
                    {label === 'All' ? 'All' : `${label} HP`}
                    {popular && !isActive && (
                      <span className="text-[10px] text-amber-600 font-medium">Popular</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Availability */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Availability</h4>
            <div className="flex flex-wrap gap-2">
              <FilterPill 
                label="In Stock" 
                isActive={filters?.inStock === true}
                onClick={() => toggleFilter('inStock', true)}
              />
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Start Type */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Start Type</h4>
            <div className="flex flex-wrap gap-2">
              <FilterPill 
                label="Electric" 
                isActive={filters?.startType === 'electric'}
                onClick={() => toggleFilter('startType', 'electric')}
              />
              <FilterPill 
                label="Pull-Start" 
                isActive={filters?.startType === 'manual'}
                onClick={() => toggleFilter('startType', 'manual')}
              />
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Control Type */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Control</h4>
            <div className="flex flex-wrap gap-2">
              <FilterPill 
                label="Tiller" 
                isActive={filters?.controlType === 'tiller'}
                onClick={() => toggleFilter('controlType', 'tiller')}
              />
              <FilterPill 
                label="Remote" 
                isActive={filters?.controlType === 'remote'}
                onClick={() => toggleFilter('controlType', 'remote')}
              />
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Shaft Length */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Shaft Length</h4>
            <div className="flex flex-wrap gap-2">
              <FilterPill 
                label="15&quot; Short" 
                isActive={filters?.shaftLength === 'short'}
                onClick={() => toggleFilter('shaftLength', 'short')}
              />
              <FilterPill 
                label="20&quot; Long" 
                isActive={filters?.shaftLength === 'long'}
                onClick={() => toggleFilter('shaftLength', 'long')}
              />
              <FilterPill 
                label="25&quot; XL" 
                isActive={filters?.shaftLength === 'xl'}
                onClick={() => toggleFilter('shaftLength', 'xl')}
              />
            </div>
          </div>
        </div>
        <DrawerFooter className="flex-row gap-2 pt-2">
          <Button 
            variant="outline" 
            onClick={handleClearAll}
            className="flex-1"
            disabled={activeCount === 0}
          >
            Clear All
          </Button>
          <Button 
            onClick={handleDone}
            className="flex-1"
          >
            Done
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
