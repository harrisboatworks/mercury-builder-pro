import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { money, calculateMonthly, PACKAGE_CONFIGS, type PackageConfig, type PricingBreakdown } from '@/lib/quote-utils';

interface PackageCardsProps {
  basePricing: PricingBreakdown;
  onPackageSelect: (packageId: string) => void;
  selectedPackage?: string;
  rate?: number;
}

export function PackageCards({ 
  basePricing, 
  onPackageSelect, 
  selectedPackage = 'better',
  rate = 7.99 
}: PackageCardsProps) {
  const [hoveredPackage, setHoveredPackage] = useState<string | null>(null);

  const calculatePackagePrice = (pkg: PackageConfig) => {
    const packageTotal = basePricing.total + pkg.additionalCost;
    const packageSavings = basePricing.savings;
    const monthlyPayment = calculateMonthly(packageTotal, rate);
    
    return {
      total: packageTotal,
      savings: packageSavings,
      monthly: monthlyPayment
    };
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-primary mb-2">
          Choose Your Package
        </h3>
        <p className="text-muted-foreground text-sm">
          Select the option that best fits your needs
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-4">
        {PACKAGE_CONFIGS.map((pkg) => {
          const pricing = calculatePackagePrice(pkg);
          const isSelected = selectedPackage === pkg.id;
          const isHovered = hoveredPackage === pkg.id;
          
          return (
            <Card
              key={pkg.id}
              className={`relative cursor-pointer transition-all duration-200 ${
                isSelected 
                  ? 'ring-2 ring-primary border-primary bg-primary/5' 
                  : 'hover:shadow-lg hover:border-primary/50'
              } ${
                isHovered ? 'scale-105' : ''
              }`}
              onMouseEnter={() => setHoveredPackage(pkg.id)}
              onMouseLeave={() => setHoveredPackage(null)}
              onClick={() => onPackageSelect(pkg.id)}
            >
              {pkg.recommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Recommended
                  </Badge>
                </div>
              )}
              
              <div className="p-6 space-y-4">
                {/* Package Header */}
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-primary">
                    {pkg.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {pkg.description}
                  </p>
                </div>

                {/* Pricing */}
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-primary">
                    {money(pricing.total)}
                  </div>
                  {pricing.savings > 0 && (
                    <div className="text-sm text-green-600">
                      You save {money(pricing.savings)} vs MSRP
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    From {money(pricing.monthly.amount)}/mo
                  </div>
                </div>

                {/* Inclusions */}
                <div className="space-y-2">
                  {pkg.inclusions.map((inclusion, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>{inclusion}</span>
                    </div>
                  ))}
                </div>

                {/* Selection Button */}
                <Button
                  variant={isSelected ? "default" : "outline"}
                  className="w-full"
                  size="sm"
                >
                  {isSelected ? 'Selected' : 'Select Package'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}