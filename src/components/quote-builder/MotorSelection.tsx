import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Filter, Grid, List, Zap, Anchor } from 'lucide-react';
import { Motor } from '../QuoteBuilder';

interface MotorSelectionProps {
  onStepComplete: (motor: Motor) => void;
}

// Mock data - will be replaced with real scraped data
const mockMotors: Motor[] = [
  {
    id: '1',
    model: 'Mercury 9.9HP FourStroke',
    hp: 9.9,
    price: 4299,
    image: '/placeholder.svg',
    stockStatus: 'In Stock',
    category: 'portable',
    type: 'FourStroke',
    specs: 'Portable, lightweight design perfect for small boats'
  },
  {
    id: '2',
    model: 'Mercury 60HP FourStroke',
    hp: 60,
    price: 12750,
    image: '/placeholder.svg',
    stockStatus: 'In Stock',
    category: 'mid-range',
    type: 'FourStroke',
    specs: 'Reliable mid-range power for fishing and recreational boats'
  },
  {
    id: '3',
    model: 'Mercury 150HP Pro XS',
    hp: 150,
    price: 18990,
    image: '/placeholder.svg',
    stockStatus: 'On Order',
    category: 'high-performance',
    type: 'Pro XS',
    specs: 'High-performance engine for serious anglers and speed enthusiasts'
  },
  {
    id: '4',
    model: 'Mercury 300HP Verado',
    hp: 300,
    price: 28500,
    image: '/placeholder.svg',
    stockStatus: 'In Stock',
    category: 'v8-racing',
    type: 'Verado',
    specs: 'Premium supercharged V8 power for ultimate performance'
  }
];

export const MotorSelection = ({ onStepComplete }: MotorSelectionProps) => {
  const [selectedMotor, setSelectedMotor] = useState<Motor | null>(null);
  const [filters, setFilters] = useState({
    category: 'all',
    stockStatus: 'all',
    priceRange: [0, 50000]
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categories = [
    { key: 'all', label: 'All Motors', color: 'primary' },
    { key: 'portable', label: 'Portable (2.5-20hp)', color: 'portable' },
    { key: 'mid-range', label: 'Mid-Range (25-100hp)', color: 'mid-range' },
    { key: 'high-performance', label: 'High Performance (115-200hp)', color: 'high-performance' },
    { key: 'v8-racing', label: 'V8 & Racing (225-600hp)', color: 'v8-racing' }
  ];

  const filteredMotors = mockMotors.filter(motor => {
    if (filters.category !== 'all' && motor.category !== filters.category) return false;
    if (filters.stockStatus !== 'all' && motor.stockStatus !== filters.stockStatus) return false;
    if (motor.price < filters.priceRange[0] || motor.price > filters.priceRange[1]) return false;
    return true;
  });

  const getStockBadgeColor = (status: string) => {
    switch (status) {
      case 'In Stock': return 'in-stock';
      case 'On Order': return 'on-order';
      case 'Out of Stock': return 'out-of-stock';
      default: return 'secondary';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'portable': return 'portable';
      case 'mid-range': return 'mid-range';
      case 'high-performance': return 'high-performance';
      case 'v8-racing': return 'v8-racing';
      default: return 'primary';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-foreground">Select Your Mercury Outboard</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Choose from our current inventory of Mercury outboard motors. All prices and availability are updated in real-time.
        </p>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter Motors
            </h3>
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
          </div>

          {/* Category Filter */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Motor Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <Button
                  key={category.key}
                  variant={filters.category === category.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, category: category.key }))}
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              Price Range: ${filters.priceRange[0].toLocaleString()} - ${filters.priceRange[1].toLocaleString()}
            </label>
            <Slider
              value={filters.priceRange}
              onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value }))}
              max={50000}
              min={0}
              step={500}
              className="w-full"
            />
          </div>
        </div>
      </Card>

      {/* Motors Grid */}
      <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
        {filteredMotors.map(motor => (
          <Card 
            key={motor.id}
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
              selectedMotor?.id === motor.id ? 'ring-2 ring-primary shadow-lg' : ''
            }`}
            onClick={() => setSelectedMotor(motor)}
          >
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <Badge className={`bg-${getCategoryColor(motor.category)} text-${getCategoryColor(motor.category)}-foreground`}>
                  {motor.hp}HP
                </Badge>
                <Badge className={`bg-${getStockBadgeColor(motor.stockStatus)} text-${getStockBadgeColor(motor.stockStatus)}-foreground`}>
                  {motor.stockStatus}
                </Badge>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">{motor.model}</h3>
                <p className="text-muted-foreground">{motor.specs}</p>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-foreground">
                    ${motor.price.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">CAD</p>
                </div>
                <div className="flex items-center gap-2">
                  <Anchor className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">{motor.type}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Continue Button */}
      {selectedMotor && (
        <div className="flex justify-center pt-8">
          <Button 
            onClick={() => onStepComplete(selectedMotor)}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
          >
            Continue with {selectedMotor.model}
            <Zap className="w-5 h-5 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
};