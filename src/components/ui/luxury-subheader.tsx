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

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:block subheader">
        <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-6">
          <div>
            <h1 className="text-lg font-light text-luxury-ink tracking-wide">
              {title}
            </h1>
          </div>

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
      </div>

      {/* Mobile Layout - Only Filter Chips */}
      <div className="md:hidden subheader">
        {showFilters && (
          <FilterChips
            searchTerm={searchTerm}
            selectedHpRange={selectedHpRange}
            inStockOnly={inStockOnly}
            onSearchChange={onSearchChange}
            onHpRangeChange={onHpRangeChange}
            onInStockChange={onInStockChange}
            mobile
          />
        )}
      </div>
    </>
  );
}