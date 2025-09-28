import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FilterChipsProps {
  searchTerm: string;
  selectedHpRange: { min: number; max: number };
  inStockOnly: boolean;
  onSearchChange?: (term: string) => void;
  onHpRangeChange?: (range: { min: number; max: number }) => void;
  onInStockChange?: (inStock: boolean) => void;
  mobile?: boolean;
}

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

export function FilterChips({
  searchTerm,
  selectedHpRange,
  inStockOnly,
  onSearchChange,
  onHpRangeChange,
  onInStockChange,
  mobile = false
}: FilterChipsProps) {
  
  const getHpRangeLabel = () => {
    const range = HP_RANGES.find(r => r.min === selectedHpRange.min && r.max === selectedHpRange.max);
    return range?.label || 'All HP';
  };

  const hasActiveFilters = () => {
    return (selectedHpRange.min !== 0 || selectedHpRange.max !== Infinity) || inStockOnly;
  };

  const handleReset = () => {
    onHpRangeChange?.({ min: 0, max: Infinity });
    onInStockChange?.(false);
    onSearchChange?.('');
  };

  if (mobile) {
    return (
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 px-4 -webkit-overflow-scrolling-touch" style={{ scrollSnapType: 'x proximity' }}>
        {/* HP Range Chips */}
        {HP_RANGES.slice(0, 6).map(range => {
          const isSelected = selectedHpRange.min === range.min && selectedHpRange.max === range.max;
          return (
            <button
              key={range.id}
              onClick={() => onHpRangeChange?.(range)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap border ${
                isSelected
                  ? 'bg-luxury-ink text-white border-luxury-ink'
                  : 'bg-white text-luxury-gray hover:bg-luxury-stage border-luxury-hairline'
              }`}
              style={{ scrollSnapAlign: 'start' }}
            >
              {range.label}
            </button>
          );
        })}

        {/* In Stock Chip */}
        <button
          onClick={() => onInStockChange?.(!inStockOnly)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap border ${
            inStockOnly
              ? 'bg-luxury-ink text-white border-luxury-ink'
              : 'bg-white text-luxury-gray hover:bg-luxury-stage border-luxury-hairline'
          }`}
          style={{ scrollSnapAlign: 'start' }}
        >
          In Stock
        </button>

        {/* Reset */}
        {hasActiveFilters() && (
          <button
            onClick={handleReset}
            className="flex-shrink-0 px-3 py-2 text-sm text-luxury-gray hover:text-luxury-ink"
          >
            Reset
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* HP Range Dropdown */}
      <div className="relative">
        <select
          value={`${selectedHpRange.min}-${selectedHpRange.max}`}
          onChange={(e) => {
            const [min, max] = e.target.value.split('-').map(v => v === 'Infinity' ? Infinity : Number(v));
            onHpRangeChange?.({ min, max });
          }}
          className="appearance-none bg-luxury-stage text-luxury-ink border border-luxury-hairline rounded-full px-4 py-2 pr-8 text-sm font-medium hover:bg-luxury-hairline transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-luxury-gray/20"
        >
          {HP_RANGES.map(range => (
            <option key={range.id} value={`${range.min}-${range.max}`}>
              {range.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-3 h-3 text-luxury-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* In Stock Toggle */}
      <button
        onClick={() => onInStockChange?.(!inStockOnly)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          inStockOnly
            ? 'bg-luxury-ink text-white'
            : 'bg-luxury-stage text-luxury-gray hover:bg-luxury-hairline border border-luxury-hairline'
        }`}
      >
        In Stock Only
      </button>

      {/* Reset Button */}
      {hasActiveFilters() && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="text-luxury-gray hover:text-luxury-ink px-3 py-2 h-auto"
        >
          Reset
        </Button>
      )}
    </div>
  );
}