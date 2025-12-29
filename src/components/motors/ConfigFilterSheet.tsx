import React, { useState, useEffect, useRef, useMemo } from 'react';
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

// Popular HP values based on common motor recommendations
const POPULAR_HPS = new Set([25, 40, 60]);

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

  // Generate HP filters dynamically from available motors
  const hpFilters = useMemo(() => {
    const hpSet = new Set<number>();
    motors.forEach(m => hpSet.add(m.hp));
    const uniqueHps = Array.from(hpSet).sort((a, b) => a - b);
    
    const filters: { label: string; value: string; popular: boolean }[] = [
      { label: 'All', value: '', popular: false }
    ];
    
    // Add each unique HP (excluding 300+ which goes in bucket)
    uniqueHps.filter(hp => hp < 300).forEach(hp => {
      filters.push({
        label: String(hp),
        value: String(hp),
        popular: POPULAR_HPS.has(hp)
      });
    });
    
    // Add 300+ bucket if any motors have HP >= 300
    if (uniqueHps.some(hp => hp >= 300)) {
      filters.push({ label: '300+', value: 'hp:>299', popular: false });
    }
    
    return filters;
  }, [motors]);

  // Calculate counts for each HP filter
  const getHpCount = (filter: string): number => {
    if (filter === '') return motors.length;
    if (filter === 'hp:>299') return motors.filter(m => m.hp >= 300).length;
    const hp = parseFloat(filter);
    return motors.filter(m => m.hp === hp).length;
  };

  // Calculate filter counts for config filters
  const filterCounts = useMemo(() => {
    const parseStartType = (model: string, hp: number): 'electric' | 'manual' => {
      if (hp >= 150) return 'electric';
      return model.includes('E') ? 'electric' : 'manual';
    };
    
    const parseControlType = (model: string, hp: number): 'tiller' | 'remote' => {
      if (hp >= 150) return 'remote';
      return model.includes('M') ? 'tiller' : 'remote';
    };
    
    const parseShaftLength = (model: string): 'short' | 'long' | 'xl' | 'xxl' => {
      if (model.includes('XXL')) return 'xxl';
      if (model.includes('XL')) return 'xl';
      if (model.includes('L')) return 'long';
      return 'short';
    };
    
    return {
      inStock: motors.filter(m => m.inStock).length,
      electric: motors.filter(m => parseStartType(m.model, m.hp) === 'electric').length,
      manual: motors.filter(m => parseStartType(m.model, m.hp) === 'manual').length,
      tiller: motors.filter(m => parseControlType(m.model, m.hp) === 'tiller').length,
      remote: motors.filter(m => parseControlType(m.model, m.hp) === 'remote').length,
      short: motors.filter(m => parseShaftLength(m.model) === 'short').length,
      long: motors.filter(m => parseShaftLength(m.model) === 'long').length,
      xl: motors.filter(m => parseShaftLength(m.model) === 'xl').length,
      xxl: motors.filter(m => parseShaftLength(m.model) === 'xxl').length,
    };
  }, [motors]);

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
    count,
    isActive, 
    onClick 
  }: { 
    label: string; 
    count?: number;
    isActive: boolean; 
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      style={{ width: 'auto', display: 'inline-flex' }}
      className={cn(
        'inline-flex items-center gap-1.5 w-auto max-w-fit px-3 py-1.5 rounded-full text-sm font-light',
        'shrink-0 whitespace-nowrap',
        'transition-all duration-200',
        isActive 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      )}
    >
      {label}
      {count !== undefined && (
        <span className={cn(
          'text-xs',
          isActive ? 'text-primary-foreground/70' : 'text-muted-foreground/60'
        )}>
          ({count})
        </span>
      )}
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
          <div className="flex items-center justify-between">
            <DrawerTitle>Filter Motors</DrawerTitle>
            {activeCount > 0 && (
              <button
                onClick={handleClearAll}
                className="text-sm text-primary hover:underline font-medium"
              >
                Reset all
              </button>
            )}
          </div>
        </DrawerHeader>
        <div className="px-4 pb-4 space-y-5 overflow-y-auto max-h-[60vh]">
          {/* HP Filter Section */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Horsepower</h4>
            <div className="flex flex-wrap gap-1.5">
              {hpFilters.map(({ label, value, popular }) => {
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
            <div className="flex flex-row flex-wrap gap-2">
              <FilterPill 
                label="In Stock" 
                count={filterCounts.inStock}
                isActive={filters?.inStock === true}
                onClick={() => toggleFilter('inStock', true)}
              />
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Start Type */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Start Type</h4>
            <div className="flex flex-row flex-wrap gap-2">
              <FilterPill 
                label="Electric" 
                count={filterCounts.electric}
                isActive={filters?.startType === 'electric'}
                onClick={() => toggleFilter('startType', 'electric')}
              />
              <FilterPill 
                label="Pull-Start" 
                count={filterCounts.manual}
                isActive={filters?.startType === 'manual'}
                onClick={() => toggleFilter('startType', 'manual')}
              />
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Control Type */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Control</h4>
            <div className="flex flex-row flex-wrap gap-2">
              <FilterPill 
                label="Tiller" 
                count={filterCounts.tiller}
                isActive={filters?.controlType === 'tiller'}
                onClick={() => toggleFilter('controlType', 'tiller')}
              />
              <FilterPill 
                label="Remote" 
                count={filterCounts.remote}
                isActive={filters?.controlType === 'remote'}
                onClick={() => toggleFilter('controlType', 'remote')}
              />
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Shaft Length */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Shaft Length</h4>
            <div className="flex flex-row flex-wrap gap-2">
              <FilterPill 
                label="15&quot; Short" 
                count={filterCounts.short}
                isActive={filters?.shaftLength === 'short'}
                onClick={() => toggleFilter('shaftLength', 'short')}
              />
              <FilterPill 
                label="20&quot; Long" 
                count={filterCounts.long}
                isActive={filters?.shaftLength === 'long'}
                onClick={() => toggleFilter('shaftLength', 'long')}
              />
              <FilterPill 
                label="25&quot; XL" 
                count={filterCounts.xl}
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
