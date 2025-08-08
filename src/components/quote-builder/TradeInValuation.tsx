import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, DollarSign, Star, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { estimateTradeValue, getTradeValueFactors, type TradeValueEstimate, type TradeInInfo } from '@/lib/trade-valuation';

interface TradeInValuationProps {
  tradeInInfo: TradeInInfo;
  onTradeInChange: (tradeInfo: TradeInInfo) => void;
  currentMotorBrand?: string;
  currentHp?: number;
}

export const TradeInValuation = ({ tradeInInfo, onTradeInChange, currentMotorBrand, currentHp }: TradeInValuationProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [estimate, setEstimate] = useState<TradeValueEstimate | null>(null);

  // Auto-populate trade-in info when component mounts
  React.useEffect(() => {
    if (tradeInInfo.hasTradeIn && currentMotorBrand && currentMotorBrand !== 'No Current Motor' && currentHp) {
      onTradeInChange({
        ...tradeInInfo,
        brand: tradeInInfo.brand || currentMotorBrand,
        horsepower: tradeInInfo.horsepower || currentHp
      });
    }
  }, [currentMotorBrand, currentHp, tradeInInfo.hasTradeIn]);

  const brandOptions = [
    'Mercury', 'Yamaha', 'Honda', 'Suzuki', 'Evinrude', 'Johnson', 'OMC', 'Mariner', 'Force', 'Other'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear - i);

  const conditionOptions = [
    { value: 'excellent', label: 'Excellent', description: 'Like new, low hours' },
    { value: 'good', label: 'Good', description: 'Normal wear, well maintained' },
    { value: 'fair', label: 'Fair', description: 'Higher hours, needs minor work' },
    { value: 'poor', label: 'Poor', description: 'Needs repair' }
  ];

  const handleGetEstimate = async () => {
    console.log('Button clicked - Current tradeInInfo:', tradeInInfo);
    
    if (!tradeInInfo.brand || !tradeInInfo.year || !tradeInInfo.horsepower || !tradeInInfo.condition) {
      console.log('Missing required fields:', {
        brand: tradeInInfo.brand,
        year: tradeInInfo.year,
        horsepower: tradeInInfo.horsepower,
        condition: tradeInInfo.condition
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const tradeEstimate = estimateTradeValue(tradeInInfo);
    setEstimate(tradeEstimate);
    
    // Update the trade-in info with the estimated value
    onTradeInChange({
      ...tradeInInfo,
      estimatedValue: tradeEstimate.average,
      confidenceLevel: tradeEstimate.confidence
    });
    
    setIsLoading(false);
  };

  const getConfidenceStars = (confidence: string) => {
    const starCount = confidence === 'high' ? 3 : confidence === 'medium' ? 2 : 1;
    return Array.from({ length: 3 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < starCount ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
      />
    ));
  };

  const factors = getTradeValueFactors();

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Trade-In Valuation
          </Label>
          <div className="flex items-center space-x-2">
            <Label htmlFor="trade-toggle" className="text-sm">I have a motor to trade</Label>
            <Switch
              id="trade-toggle"
              checked={tradeInInfo.hasTradeIn}
              onCheckedChange={(checked) => 
                onTradeInChange({ 
                  ...tradeInInfo, 
                  hasTradeIn: checked,
                  estimatedValue: checked ? tradeInInfo.estimatedValue : 0
                })
              }
            />
          </div>
        </div>

        {tradeInInfo.hasTradeIn && (
          <div className="space-y-6 animate-fade-in">
            {/* Smart Auto-Population Logic */}
            {currentMotorBrand && currentMotorBrand !== 'No Current Motor' && currentHp ? (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                <CheckCircle2 className="w-4 h-4" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  ✅ Using your current motor details for trade-in valuation: {currentMotorBrand} {currentHp}HP
                </AlertDescription>
              </Alert>
            ) : null}
            
            {/* Trade-In Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trade-brand">Brand *</Label>
                <Select 
                  value={tradeInInfo.brand} 
                  onValueChange={(value) => onTradeInChange({ ...tradeInInfo, brand: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brandOptions.map(brand => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trade-year">Year *</Label>
                <Select 
                  value={tradeInInfo.year?.toString() || ''} 
                  onValueChange={(value) => onTradeInChange({ ...tradeInInfo, year: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trade-hp">Horsepower *</Label>
                <Input
                  id="trade-hp"
                  type="number"
                  value={tradeInInfo.horsepower || ''}
                  onChange={(e) => onTradeInChange({ ...tradeInInfo, horsepower: parseInt(e.target.value) || 0 })}
                  placeholder="e.g., 115"
                  min="1"
                  max="600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trade-model">Model (Optional)</Label>
                <Input
                  id="trade-model"
                  value={tradeInInfo.model}
                  onChange={(e) => onTradeInChange({ ...tradeInInfo, model: e.target.value })}
                  placeholder="e.g., OptiMax Pro XS"
                />
              </div>
            </div>

            {/* Enhanced Condition Selection */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Motor Condition *</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {conditionOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`condition-card cursor-pointer border-2 rounded-xl p-4 text-center transition-all duration-300 hover:shadow-lg ${
                      tradeInInfo.condition === option.value 
                        ? 'border-primary bg-primary/10 shadow-md transform scale-105' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => onTradeInChange({ ...tradeInInfo, condition: option.value as any })}
                  >
                    {/* Emoji based on condition */}
                    <div className="text-3xl mb-2">
                      {option.value === 'excellent' && '😍'}
                      {option.value === 'good' && '😊'}
                      {option.value === 'fair' && '😐'}
                      {option.value === 'poor' && '😟'}
                    </div>
                    <div className="font-bold text-lg">{option.label}</div>
                    <div className="text-sm text-muted-foreground mt-1">{option.description}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {option.value === 'excellent' && '<100 hours'}
                      {option.value === 'good' && '100-500 hours'}
                      {option.value === 'fair' && '500-1000 hours'}
                      {option.value === 'poor' && '1000+ hours'}
                    </div>
                    
                    {/* Selection indicator */}
                    {tradeInInfo.condition === option.value && (
                      <div className="mt-2 text-primary">
                        <CheckCircle2 className="w-5 h-5 mx-auto" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Serial Number */}
            <div className="space-y-2">
              <Label htmlFor="trade-serial">Serial Number (Optional)</Label>
              <Input
                id="trade-serial"
                value={tradeInInfo.serialNumber}
                onChange={(e) => onTradeInChange({ ...tradeInInfo, serialNumber: e.target.value })}
                placeholder="Motor serial number"
              />
            </div>

            {/* Get Estimate Button */}
            <Button 
              onClick={handleGetEstimate}
              disabled={!tradeInInfo.brand || !tradeInInfo.year || !tradeInInfo.horsepower || !tradeInInfo.condition || isLoading}
              className={`w-full ${
                !tradeInInfo.brand || !tradeInInfo.year || !tradeInInfo.horsepower || !tradeInInfo.condition || isLoading
                  ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                  : 'bg-primary hover:bg-primary/90'
              }`}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Calculating Value...
                </>
              ) : (
                'Get Instant Estimate'
              )}
            </Button>

            {/* Trade Value Display */}
            {estimate && (
              <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 animate-scale-in">
                <div className="p-6 space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                      ESTIMATED TRADE VALUE
                    </h3>
                    <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                      ${estimate.low.toLocaleString()} - ${estimate.high.toLocaleString()}
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      *Based on {tradeInInfo.condition} condition
                    </p>
                  </div>

                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-sm font-medium">Confidence Level:</span>
                    <div className="flex space-x-1">
                      {getConfidenceStars(estimate.confidence)}
                    </div>
                    <span className="text-sm capitalize">{estimate.confidence}</span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Value Factors:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {factors.map((factor, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                          <span>{factor}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {estimate.factors.length > 0 && (
                    <div className="pt-3 border-t border-green-200 dark:border-green-800">
                      <p className="text-sm font-medium mb-1">Applied Adjustments:</p>
                      <ul className="text-sm space-y-1">
                        {estimate.factors.map((factor, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                            <span>{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription className="text-orange-800 dark:text-orange-200">
                      Final value subject to in-person inspection by our certified technicians.
                    </AlertDescription>
                  </Alert>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};