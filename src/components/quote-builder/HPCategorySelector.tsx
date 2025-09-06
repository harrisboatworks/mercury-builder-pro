import { ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// HP Category definitions inspired by Porsche's model line approach
export interface HPCategory {
  id: string;
  name: string;
  tagline: string;
  hpRange: { min: number; max: number };
  idealFor: string;
  startingPrice: string;
  heroImage: string;
  modelCount: number;
}

export const HP_CATEGORIES: HPCategory[] = [
  {
    id: 'portable-power',
    name: 'Portable Power',
    tagline: 'Lightweight & Versatile',
    hpRange: { min: 2.5, max: 6 },
    idealFor: 'Dinghies, canoes, tender duty',
    startingPrice: 'Starting at $1,270',
    heroImage: '/boat-types/jon-boat.svg',
    modelCount: 4
  },
  {
    id: 'lake-cruising',
    name: 'Lake Cruising',
    tagline: 'Perfect Balance',
    hpRange: { min: 9.9, max: 30 },
    idealFor: 'Aluminum boats, small pontoons',
    startingPrice: 'Starting at $6,415',
    heroImage: '/boat-types/aluminum-fishing.svg',
    modelCount: 15
  },
  {
    id: 'family-performance',
    name: 'Family Performance',
    tagline: 'Power Meets Versatility',
    hpRange: { min: 40, max: 90 },
    idealFor: 'Family pontoons, bass boats, runabouts',
    startingPrice: 'Starting at $17,270',
    heroImage: '/boat-types/pontoon.svg',
    modelCount: 8
  },
  {
    id: 'high-performance',
    name: 'High Performance',
    tagline: 'Tournament Ready',
    hpRange: { min: 115, max: 250 },
    idealFor: 'Offshore fishing, performance boats',
    startingPrice: 'Starting at $19,220',
    heroImage: '/boat-types/center-console.svg',
    modelCount: 12
  },
  {
    id: 'ultimate-power',
    name: 'Ultimate Power',
    tagline: 'Maximum Performance',
    hpRange: { min: 300, max: 600 },
    idealFor: 'High-performance boats, commercial use',
    startingPrice: 'Contact for pricing',
    heroImage: '/boat-types/bowrider.svg',
    modelCount: 5
  }
];

interface HPCategorySelectorProps {
  onCategorySelect: (category: HPCategory) => void;
  onBack?: () => void;
  showBackButton?: boolean;
}

export const HPCategorySelector = ({ 
  onCategorySelect, 
  onBack, 
  showBackButton = false 
}: HPCategorySelectorProps) => {
  return (
    <div className="space-y-8">
      {/* Header with optional back navigation */}
      <div className="space-y-4">
        {showBackButton && onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        )}
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
            Choose Your Power Category
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select the horsepower range that matches your boating needs. 
            Each category is designed for specific boat types and uses.
          </p>
        </div>
      </div>

      {/* Category Grid - Porsche-inspired layout */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
        {HP_CATEGORIES.map((category) => (
          <Card
            key={category.id}
            className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-0 bg-gradient-to-br from-background to-muted/30 overflow-hidden"
            onClick={() => onCategorySelect(category)}
          >
            <CardContent className="p-0">
              {/* Hero Image Section */}
              <div className="relative h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <img
                  src={category.heroImage}
                  alt={`${category.name} boat type`}
                  className="w-24 h-24 object-contain opacity-80 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110"
                />
                
                {/* HP Range Badge */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-primary">
                  {category.hpRange.min}{category.hpRange.max > 600 ? '+' : `-${category.hpRange.max}`} HP
                </div>
              </div>

              {/* Content Section */}
              <div className="p-6 space-y-4">
                {/* Category Name & Tagline */}
                <div className="space-y-1">
                  <h3 className="text-xl font-bold tracking-tight">
                    {category.name}
                  </h3>
                  <p className="text-sm text-primary font-medium">
                    {category.tagline}
                  </p>
                </div>

                {/* Ideal For */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {category.idealFor}
                </p>

                {/* Bottom Section: Price & Model Count */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-semibold">
                    {category.startingPrice}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {category.modelCount} models
                  </span>
                </div>

                {/* Hover CTA */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="text-xs text-primary font-medium text-center pt-2">
                    View Motors →
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom Info Section */}
      <div className="text-center space-y-4 pt-8 border-t">
        <p className="text-sm text-muted-foreground">
          Not sure which category is right for you? Our motor finder can help recommend 
          the perfect horsepower for your specific boat and usage.
        </p>
      </div>
    </div>
  );
};