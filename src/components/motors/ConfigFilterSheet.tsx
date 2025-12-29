import React, { useState } from 'react';
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
import { ConfigFilterPills, ConfigFiltersState } from './ConfigFilterPills';
import { cn } from '@/lib/utils';
import type { Motor } from '@/lib/motor-helpers';

// HP filter options
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

  // Count HP as 1 if active, plus config filter keys
  const hpActive = activeHpFilter ? 1 : 0;
  const configActive = filters ? Object.keys(filters).length : 0;
  const activeCount = hpActive + configActive;

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

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={cn("gap-2 h-8", className)}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Filters</span>
          {activeCount > 0 && (
            <Badge 
              variant="secondary" 
              className="h-5 min-w-5 px-1.5 text-xs bg-primary text-primary-foreground"
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
        <div className="px-4 pb-4 space-y-6">
          {/* HP Filter Section */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Horsepower</h4>
            <div className="flex flex-wrap gap-2">
              {HP_FILTERS.map(({ label, value }) => {
                const isActive = activeHpFilter === value || (value === '' && !activeHpFilter);
                const hasStock = hasMotors(value);
                
                return (
                  <button
                    key={value}
                    onClick={() => onHpFilterChange(value)}
                    disabled={!hasStock && value !== ''}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-light',
                      'transition-all duration-200',
                      isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : hasStock
                          ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                          : 'bg-muted/50 text-muted-foreground/50 cursor-not-allowed'
                    )}
                  >
                    {label === 'All' ? 'All' : `${label} HP`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Config Filters Section */}
          <ConfigFilterPills 
            filters={filters} 
            onFilterChange={onFilterChange}
          />
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
