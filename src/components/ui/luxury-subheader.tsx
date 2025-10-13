import { useState, useEffect } from 'react';
import { FilterChips } from './filter-chips';

interface LuxurySubheaderProps {
  title: string;
  searchTerm?: string;
  selectedHpRange?: { min: number; max: number };
  inStockOnly?: boolean;
  onSearchChange?: (term: string) => void;
  onHpRangeChange?: (range: { min: number; max: number }) => void;
  onInStockChange?: (inStock: boolean) => void;
  showFilters?: boolean;
}

export function LuxurySubheader({ 
  title, 
  searchTerm = '',
  selectedHpRange = { min: 0, max: Infinity },
  inStockOnly = false,
  onSearchChange,
  onHpRangeChange,
  onInStockChange,
  showFilters = true
}: LuxurySubheaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-luxury-hairline shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between py-4">
          {/* Left: Page Title */}
          <div>
            <h1 className="text-xl font-light text-luxury-ink tracking-wide">
              {title}
            </h1>
          </div>

          {/* Right: Filter Chips */}
          {showFilters && (
            <FilterChips
              searchTerm={searchTerm}
              selectedHpRange={selectedHpRange}
              inStockOnly={inStockOnly}
              onSearchChange={onSearchChange}
              onHpRangeChange={onHpRangeChange}
              onInStockChange={onInStockChange}
            />
          )}
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden">
          {/* Filter Chips - Horizontal Scroller */}
          {showFilters && (
            <div className="py-3 -mx-6">
              <div className="px-6">
                <FilterChips
                  searchTerm={searchTerm}
                  selectedHpRange={selectedHpRange}
                  inStockOnly={inStockOnly}
                  onSearchChange={onSearchChange}
                  onHpRangeChange={onHpRangeChange}
                  onInStockChange={onInStockChange}
                  mobile
                />
              </div>
            </div>
          )}
          
          {/* Page Title - Above Content */}
          <div className="py-4">
            <h1 className="text-base font-light text-luxury-ink tracking-wide">
              {title}
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}