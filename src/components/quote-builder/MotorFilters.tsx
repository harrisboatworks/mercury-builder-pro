import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Filter, Grid, List, X } from 'lucide-react';

type FilterMotor = {
  hp?: number;
  horsepower?: number;
  price?: number;
  in_stock?: boolean;
  stockStatus?: string;
};

interface FilterState {
  category: string;
  stockStatus: string;
  priceRange: [number, number];
  hpRange: [number, number];
}

interface MotorFiltersProps {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  resultsCount: number;
  isOpen: boolean;
  onToggle: () => void;
  categoryCounts?: Record<string, number>;
  /** Optional cached inventory used to compute live HP/price/stock match counts. */
  motors?: FilterMotor[];
}

export const MotorFilters = ({ 
  filters, 
  setFilters, 
  viewMode, 
  setViewMode, 
  resultsCount,
  isOpen,
  onToggle,
  categoryCounts,
  motors,
}: MotorFiltersProps) => {
  // Live count for the current HP/price/stock combo, validated against cached inventory.
  const liveMatchCount = useMemo(() => {
    if (!motors || motors.length === 0) return resultsCount;
    const [hpMin, hpMax] = filters.hpRange;
    const [priceMin, priceMax] = filters.priceRange;
    const wantInStock = filters.stockStatus === 'In Stock';
    const wantOnOrder = filters.stockStatus === 'On Order' || filters.stockStatus === 'Order Now';
    return motors.reduce((acc, m) => {
      const hp = (m.hp ?? m.horsepower ?? 0) as number;
      const price = (m.price ?? 0) as number;
      if (hp < hpMin || hp > hpMax) return acc;
      if (price < priceMin || price > priceMax) return acc;
      if (wantInStock && !m.in_stock) return acc;
      if (wantOnOrder && m.in_stock) return acc;
      return acc + 1;
    }, 0);
  }, [motors, filters.hpRange, filters.priceRange, filters.stockStatus, resultsCount]);

  // Per-stock-status counts (independent of stockStatus filter, but respect HP + price ranges)
  const stockCounts = useMemo(() => {
    const base: Record<string, number> = { all: 0, 'In Stock': 0, 'On Order': 0, 'Order Now': 0 };
    if (!motors || motors.length === 0) return base;
    const [hpMin, hpMax] = filters.hpRange;
    const [priceMin, priceMax] = filters.priceRange;
    for (const m of motors) {
      const hp = (m.hp ?? m.horsepower ?? 0) as number;
      const price = (m.price ?? 0) as number;
      if (hp < hpMin || hp > hpMax) continue;
      if (price < priceMin || price > priceMax) continue;
      base.all += 1;
      if (m.in_stock) base['In Stock'] += 1;
      else {
        base['On Order'] += 1;
        base['Order Now'] += 1;
      }
    }
    return base;
  }, [motors, filters.hpRange, filters.priceRange]);

  const categories = [
    { key: 'all', label: 'All Motors', color: 'primary' },
    { key: 'portable', label: 'Portable (2.5-20hp)', color: 'portable' },
    { key: 'mid-range', label: 'Mid-Range (25-100hp)', color: 'mid-range' },
    { key: 'high-performance', label: 'High Performance (115-200hp)', color: 'high-performance' },
    { key: 'v8-racing', label: 'V8 & Racing (225-600hp)', color: 'v8-racing' }
  ];

  const clearFilters = () => {
    setFilters({
      category: 'all',
      stockStatus: 'all',
      priceRange: [0, 50000],
      hpRange: [2.5, 600]
    });
  };

  return (
    <div className={`${isOpen ? 'w-80' : 'w-16'} transition-all duration-300 flex-shrink-0`}>
      <Card className="h-fit sticky top-4">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            {isOpen && (
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters ({resultsCount})
              </h3>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="ml-auto"
            >
              {isOpen ? <X className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
            </Button>
          </div>

          {isOpen && (
            <div className="space-y-6">
              {/* View Mode */}
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>

              {/* HP Range */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Horsepower: {filters.hpRange[0]}HP - {filters.hpRange[1]}HP
                </Label>
                <Slider
                  value={filters.hpRange}
                  onValueChange={(value) => setFilters({ ...filters, hpRange: value as [number, number] })}
                  max={600}
                  min={2.5}
                  step={2.5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>2.5HP</span>
                  <span>600HP</span>
                </div>
              </div>

              {/* Category Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Motor Category</Label>
                <div className="flex flex-col gap-2">
                  {categories.map(category => (
                    <Button
                      key={category.key}
                      variant={filters.category === category.key ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilters({ ...filters, category: category.key })}
                      className="justify-start text-xs"
                    >
                      <span className="flex-1 text-left">{category.label}</span>
                      <span className="ml-2 text-muted-foreground">({(categoryCounts?.[category.key] ?? 0) as number})</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Stock Status Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Stock Status</Label>
                <div className="flex flex-col gap-2">
                  {['all', 'In Stock', 'On Order', 'Order Now'].map(status => (
                    <Button
                      key={status}
                      variant={filters.stockStatus === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilters({ ...filters, stockStatus: status })}
                      className="justify-start text-xs"
                    >
                      {status === 'all' ? 'All' : status}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Price: ${filters.priceRange[0].toLocaleString()} - ${filters.priceRange[1].toLocaleString()}
                </Label>
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) => setFilters({ ...filters, priceRange: value as [number, number] })}
                  max={50000}
                  min={0}
                  step={500}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>$0</span>
                  <span>$50k</span>
                </div>
              </div>

              {/* Clear Filters */}
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="w-full"
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};