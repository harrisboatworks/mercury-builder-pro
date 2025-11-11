import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Settings2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FilterOptions {
  inStockOnly: boolean;
  hpRange: string;
  engineType: string;
}

interface MobileFilterSheetProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

export const MobileFilterSheet = ({ filters, onFiltersChange }: MobileFilterSheetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<FilterOptions>(filters);

  const hpRanges = [
    { value: '', label: 'All Horsepower' },
    { value: '2.5-20', label: 'Portable (2.5-20 HP)' },
    { value: '25-60', label: 'Mid-Range (25-60 HP)' },
    { value: '75-150', label: 'High Power (75-150 HP)' },
    { value: '175-300', label: 'V6 (175-300 HP)' },
    { value: '350+', label: 'V8 (350+ HP)' }
  ];

  const engineTypes = [
    { value: '', label: 'All Types' },
    { value: 'FourStroke', label: 'FourStroke' },
    { value: 'Verado', label: 'Verado' },
    { value: 'Pro XS', label: 'Pro XS' },
    { value: 'SeaPro', label: 'SeaPro' }
  ];

  const handleApplyFilters = () => {
    onFiltersChange(tempFilters);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      inStockOnly: false,
      hpRange: '',
      engineType: ''
    };
    setTempFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    setIsOpen(false);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.inStockOnly) count++;
    if (filters.hpRange) count++;
    if (filters.engineType) count++;
    return count;
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <button className="relative p-2 bg-gray-50 rounded-lg hover:bg-gray-100">
          <Settings2 className="w-5 h-5 text-gray-600" />
          {getActiveFilterCount() > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 text-xs flex items-center justify-center p-0 bg-blue-600">
              {getActiveFilterCount()}
            </Badge>
          )}
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Filter Motors</DrawerTitle>
        </DrawerHeader>
        <div className="p-4 space-y-4">
          {/* In Stock Toggle */}
          <div>
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={tempFilters.inStockOnly}
                onChange={(e) => setTempFilters({ ...tempFilters, inStockOnly: e.target.checked })}
                className="w-4 h-4 rounded text-green-600"
              />
              <div>
                <span className="text-sm font-medium">In Stock Only</span>
                <p className="text-xs text-gray-500">Show available motors only</p>
              </div>
            </label>
          </div>

          {/* HP Range */}
          <div>
            <label className="block text-sm font-medium mb-2">Horsepower Range</label>
            <select
              value={tempFilters.hpRange}
              onChange={(e) => setTempFilters({ ...tempFilters, hpRange: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm border-0 focus:ring-2 focus:ring-blue-500"
            >
              {hpRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          {/* Engine Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Engine Type</label>
            <select
              value={tempFilters.engineType}
              onChange={(e) => setTempFilters({ ...tempFilters, engineType: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm border-0 focus:ring-2 focus:ring-blue-500"
            >
              {engineTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clear/Apply Buttons */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={handleClearFilters}>
              Clear
            </Button>
            <Button className="flex-1 bg-blue-600 hover:opacity-90" onClick={handleApplyFilters}>
              Apply
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};