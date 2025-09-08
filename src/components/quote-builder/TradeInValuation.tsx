import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

import { motion } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, DollarSign, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { estimateTradeValue, medianRoundedTo25, getBrandPenaltyFactor, type TradeValueEstimate, type TradeInInfo } from '@/lib/trade-valuation';

interface TradeInValuationProps {
  tradeInInfo: TradeInInfo;
  onTradeInChange: (tradeInfo: TradeInInfo) => void;
  onAutoAdvance?: () => void;
  currentMotorBrand?: string;
  currentHp?: number;
  currentMotorYear?: number;
}

export const TradeInValuation = ({ tradeInInfo, onTradeInChange, onAutoAdvance, currentMotorBrand, currentHp, currentMotorYear }: TradeInValuationProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [estimate, setEstimate] = useState<TradeValueEstimate | null>(null);


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
    
    // Update the trade-in info with the rounded median value ($25 increments)
    onTradeInChange({
      ...tradeInInfo,
      estimatedValue: medianRoundedTo25(tradeEstimate.low, tradeEstimate.high),
      confidenceLevel: tradeEstimate.confidence,
      // Audit fields
      rangePrePenaltyLow: tradeEstimate.prePenaltyLow,
      rangePrePenaltyHigh: tradeEstimate.prePenaltyHigh,
      rangeFinalLow: tradeEstimate.low,
      rangeFinalHigh: tradeEstimate.high,
      tradeinValuePrePenalty: (tradeEstimate.prePenaltyLow !== undefined && tradeEstimate.prePenaltyHigh !== undefined)
        ? medianRoundedTo25(tradeEstimate.prePenaltyLow, tradeEstimate.prePenaltyHigh)
        : medianRoundedTo25(tradeEstimate.low, tradeEstimate.high),
      tradeinValueFinal: medianRoundedTo25(tradeEstimate.low, tradeEstimate.high),
      penaltyApplied: getBrandPenaltyFactor(tradeInInfo.brand) < 1,
      penaltyFactor: getBrandPenaltyFactor(tradeInInfo.brand)
    });
    
    setIsLoading(false);
  };

  // Confidence meter removed per UX update

  const medianValue = estimate ? medianRoundedTo25(estimate.low, estimate.high) : 0;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Trade-In Valuation
          </Label>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-lg font-bold text-foreground">Do you have a motor to trade?</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full md:w-auto">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                   // Auto-populate from current motor details if available
                   const autoPopulatedInfo = {
                     ...tradeInInfo,
                     hasTradeIn: true,
                     ...(currentMotorBrand && currentMotorBrand !== 'No Current Motor' && {
                       brand: currentMotorBrand,
                       horsepower: currentHp || 0,
                       year: currentMotorYear || 0
                     })
                   };
                   onTradeInChange(autoPopulatedInfo);
                 }}
                aria-pressed={tradeInInfo.hasTradeIn}
                className={`relative p-6 border-2 rounded-3xl transition-all bg-white text-left group ${tradeInInfo.hasTradeIn ? 'border-blue-500 shadow-2xl' : 'border-gray-200 hover:border-blue-500 hover:shadow-2xl'}`}
                type="button"
              >
                <CheckCircle2 className="w-8 h-8 mb-2 text-blue-600 group-hover:scale-110 transition-transform" />
                <div className="font-bold text-lg">Yes, I have a trade-in</div>
                <div className="text-sm text-muted-foreground">We'll estimate your value instantly</div>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  console.log('No trade-in clicked, resetting tradeInInfo');
                  onTradeInChange({ 
                    hasTradeIn: false,
                    brand: '',
                    year: 0,
                    horsepower: 0,
                    model: '',
                    serialNumber: '',
                    condition: 'good' as const,
                    estimatedValue: 0,
                    confidenceLevel: 'medium' as const
                  });
                  onAutoAdvance?.();
                }}
                aria-pressed={!tradeInInfo.hasTradeIn}
                className={`relative p-6 border-2 rounded-3xl transition-all bg-white text-left group ${!tradeInInfo.hasTradeIn ? 'border-blue-500 shadow-2xl' : 'border-gray-200 hover:border-blue-500 hover:shadow-2xl'}`}
                type="button"
              >
                <AlertTriangle className="w-8 h-8 mb-2 text-blue-600 group-hover:scale-110 transition-transform" />
                <div className="font-bold text-lg">No trade-in</div>
                <div className="text-sm text-muted-foreground">Skip valuation and continue</div>
              </motion.button>
            </div>
          </div>
        </div>

        {tradeInInfo.hasTradeIn && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Pre-filled notice */}
            {currentMotorBrand && currentMotorBrand !== 'No Current Motor' && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Pre-filled from your current motor details</span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">You can adjust any details below if needed.</p>
              </div>
            )}
            
            {/* Trade-In Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trade-brand">Brand *</Label>
                <Select 
                  value={tradeInInfo.brand} 
                  onValueChange={(value) => onTradeInChange({ ...tradeInInfo, brand: value })}
                >
                  <SelectTrigger className="w-full min-h-[44px] py-3 px-4 rounded-lg bg-white text-black border border-gray-300">
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
                  <SelectTrigger className="w-full min-h-[44px] py-3 px-4 rounded-lg bg-white text-black border border-gray-300">
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
                  className="w-full min-h-[44px] py-3 px-4 rounded-lg bg-white text-black border border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trade-model">Model (Optional)</Label>
                <Input
                  id="trade-model"
                  value={tradeInInfo.model}
                  onChange={(e) => onTradeInChange({ ...tradeInInfo, model: e.target.value })}
                  placeholder="e.g., OptiMax Pro XS"
                  className="w-full min-h-[44px] py-3 px-4 rounded-lg bg-white text-black border border-gray-300"
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
                className="w-full min-h-[44px] py-3 px-4 rounded-lg bg-white text-black border border-gray-300"
              />
            </div>

            {/* Get Estimate Button */}
            <Button 
              onClick={handleGetEstimate}
              disabled={!tradeInInfo.brand || !tradeInInfo.year || !tradeInInfo.horsepower || !tradeInInfo.condition || isLoading}
              className={`w-full py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors ${
                !tradeInInfo.brand || !tradeInInfo.year || !tradeInInfo.horsepower || !tradeInInfo.condition || isLoading
                  ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                  : ''
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
                    <div className="text-4xl font-extrabold text-green-900 dark:text-green-100 tracking-tight">
                      ${medianValue.toLocaleString()}
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      *Based on {tradeInInfo.condition} condition
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">We pay more for:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {tradeInInfo.brand && tradeInInfo.brand.toLowerCase() === 'mercury' && (
                        <div className="flex items-center space-x-2 text-sm">
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                          <span>Mercury motors (brand bonus applied!)</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2 text-sm">
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                        <span>Recent service history</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                        <span>Low hours</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                        <span>Power trim/tilt models</span>
                      </div>
                    </div>
                  </div>

                  <div className="upside-message">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      💰 Excellent condition could add 10–15% more
                    </p>
                  </div>

                  {/* Brand penalty notice */}
                  {getBrandPenaltyFactor(tradeInInfo.brand) < 1 && (
                    <div className="mt-2 text-xs text-orange-700 dark:text-orange-300 flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Adjusted for brand (-50%) — Manufacturer out of business; parts & service availability limited.</span>
                    </div>
                  )}

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

            {/* Repower Center Authority */}
            <div className="repower-authority text-center mt-4">
                <img
                  src="/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png"
                  alt="Official Mercury Repower Center badge"
                  loading="lazy"
                  className="h-12 mx-auto mb-2 w-auto"
                />
              <p className="font-semibold text-foreground">As a Certified Mercury Repower Center, we offer:</p>
              <ul className="mt-2 space-y-1 text-sm text-foreground/90">
                <li>✓ Competitive trade-in options</li>
                <li>✓ Expert repower consultation</li>
                <li>✓ Up to $1,000 in Mercury rebates</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};