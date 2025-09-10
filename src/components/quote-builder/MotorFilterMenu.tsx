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
          className="relative h-12 px-6 rounded-full border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
        >
          <Filter className="h-4 w-4 mr-2" />
          <span className="font-medium">Filter</span>
          {activeFilterCount > 0 && (
            <div className="absolute -top-1 -right-1 h-5 w-5 bg-gray-900 text-white text-xs rounded-full flex items-center justify-center">
              {activeFilterCount}
            </div>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:max-w-md bg-white">
        <SheetHeader className="pb-8">
          <SheetTitle className="text-left text-xl font-light text-gray-900">Filter</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-8">
          {/* HP Range Filter */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Horsepower</h3>
            <div className="space-y-2">
              {HP_RANGES.map(range => {
                const isSelected = selectedHpRange.min === range.min && selectedHpRange.max === range.max;
                return (
                  <button
                    key={range.id}
                    className={`w-full text-left py-3 px-0 text-base transition-colors border-b border-gray-100 ${
                      isSelected 
                        ? 'text-gray-900 font-medium' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => handleHpRangeSelect({ min: range.min, max: range.max })}
                  >
                    {range.label}
                    {isSelected && <span className="float-right">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stock Filter */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Availability</h3>
            <button
              className={`w-full text-left py-3 px-0 text-base transition-colors border-b border-gray-100 ${
                inStockOnly 
                  ? 'text-gray-900 font-medium' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => onInStockChange(!inStockOnly)}
            >
              In Stock Only
              {inStockOnly && <span className="float-right">✓</span>}
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-8">
            <Button 
              variant="outline" 
              className="flex-1 h-12 rounded-full border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={handleClearFilters}
            >
              Clear All
            </Button>
            <Button 
              className="flex-1 h-12 rounded-full bg-gray-900 hover:bg-gray-800 text-white"
              onClick={() => setIsOpen(false)}
            >
              Apply
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}