import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import MotorFilterMenu from '@/components/quote-builder/MotorFilterMenu';

interface StickySearchProps {
  searchTerm: string;
  selectedHpRange: { min: number; max: number };
  inStockOnly: boolean;
  onSearchChange: (term: string) => void;
  onHpRangeChange: (range: { min: number; max: number }) => void;
  onInStockChange: (inStock: boolean) => void;
}

export function StickySearch({
  searchTerm,
  selectedHpRange,
  inStockOnly,
  onSearchChange,
  onHpRangeChange,
  onInStockChange
}: StickySearchProps) {
  return (
    <div className="flex items-center">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search motors by HP, model, or keyword…"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-12 pr-4 h-12 rounded-l-full rounded-r-none border-gray-300 border-r-0 bg-white shadow-sm focus:border-gray-400 focus:ring-gray-400 text-base"
          aria-label="Search motors by horsepower, model, or keyword"
        />
      </div>
      <div className="flex-shrink-0">
        <MotorFilterMenu
          searchTerm={searchTerm}
          selectedHpRange={selectedHpRange}
          inStockOnly={inStockOnly}
          onSearchChange={onSearchChange}
          onHpRangeChange={onHpRangeChange}
          onInStockChange={onInStockChange}
        />
      </div>
    </div>
  );
}