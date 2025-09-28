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
    <div 
      className="sticky z-40 bg-white/90 backdrop-blur-md border-b border-luxury-hairline transition-all duration-200"
      style={{ 
        top: isScrolled ? 'calc(var(--safe-top) + 56px)' : 'calc(var(--safe-top) + 72px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between h-14">
          {/* Left: Page Title */}
          <div>
            <h1 className="text-lg font-light text-luxury-ink tracking-wide">
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
            <div className="h-11 flex items-center">
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
          )}
        </div>
      </div>
    </div>
  );
}