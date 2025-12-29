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

interface ConfigFilterSheetProps {
  filters: ConfigFiltersState | null;
  onFilterChange: (filters: ConfigFiltersState | null) => void;
  className?: string;
}

export function ConfigFilterSheet({ filters, onFilterChange, className }: ConfigFilterSheetProps) {
  const [open, setOpen] = useState(false);

  const activeCount = filters ? Object.keys(filters).length : 0;

  const handleClearAll = () => {
    onFilterChange(null);
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
        <div className="px-4 pb-4">
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
