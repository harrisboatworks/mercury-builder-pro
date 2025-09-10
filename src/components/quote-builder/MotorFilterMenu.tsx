import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import ToggleSwitch from '@/components/ui/toggle-switch';

const HP_RANGES = [
  { id: 'all', label: 'All HP', min: 0, max: Infinity },
  { id: '15-25', label: '15-25 HP', min: 15, max: 25 },
  { id: '25-60', label: '25-60 HP', min: 25, max: 60 },
  { id: '60-115', label: '60-115 HP', min: 60, max: 115 },
  { id: '115-200', label: '115-200 HP', min: 115, max: 200 },
  { id: '200-300', label: '200-300 HP', min: 200, max: 300 },
  { id: '300-400', label: '300-400 HP', min: 300, max: 400 },
  { id: '400-600', label: '400-600 HP', min: 400, max: 600 }
];

interface MotorFilterMenuProps {
  searchTerm: string;
  selectedHpRange: { min: number; max: number };
  inStockOnly: boolean;
  onSearchChange: (term: string) => void;
  onHpRangeChange: (range: { min: number; max: number }) => void;
  onInStockChange: (inStock: boolean) => void;
}

export default function MotorFilterMenu({
  searchTerm,
  selectedHpRange,
  inStockOnly,
  onSearchChange,
  onHpRangeChange,
  onInStockChange
}: MotorFilterMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedHpRange.min !== 0 || selectedHpRange.max !== Infinity) count++;
    if (inStockOnly) count++;
    return count;
  };

  const handleHpRangeSelect = (range: { min: number; max: number }) => {
    onHpRangeChange(range);
  };

  const handleClearFilters = () => {
    onHpRangeChange({ min: 0, max: Infinity });
    onInStockChange(false);
    setIsOpen(false);
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="relative flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          <span>Filter</span>
          {activeFilterCount > 0 && (
            <Badge 
              variant="secondary" 
              className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-left">Filter Motors</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6">
          {/* HP Range Filter */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Horsepower Range</h3>
            <div className="grid gap-2">
              {HP_RANGES.map(range => {
                const isSelected = selectedHpRange.min === range.min && selectedHpRange.max === range.max;
                return (
                  <Button
                    key={range.id}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className="justify-start"
                    onClick={() => handleHpRangeSelect({ min: range.min, max: range.max })}
                  >
                    {range.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Stock Filter */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Availability</h3>
            <ToggleSwitch
              checked={inStockOnly}
              onChange={onInStockChange}
              label="In Stock Only"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleClearFilters}
            >
              Clear All
            </Button>
            <Button 
              className="flex-1"
              onClick={() => setIsOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}