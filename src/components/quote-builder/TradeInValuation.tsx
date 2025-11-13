import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

import { motion } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, DollarSign, AlertTriangle, CheckCircle2, Sparkles, CircleCheck, AlertCircle, Wrench } from 'lucide-react';
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-8 border-gray-200">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-3xl font-light tracking-wide text-gray-900 dark:text-gray-100">
                Trade-In Valuation
              </h2>
              <p className="text-base font-light text-gray-600 dark:text-gray-400">
                Get an instant estimate for your current motor
              </p>
            </div>
            
            <div className="flex flex-col gap-4 mt-6">
              <p className="text-lg font-light text-gray-900 dark:text-gray-100">Do you have a motor to trade?</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
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
                  className={`relative p-6 border-2 rounded-sm transition-all bg-white dark:bg-gray-900 text-left group ${
                    tradeInInfo.hasTradeIn 
                      ? 'border-gray-900 dark:border-gray-100 shadow-lg' 
                      : 'border-gray-300 dark:border-gray-700 hover:border-gray-900 dark:hover:border-gray-100 hover:shadow-lg'
                  }`}
                  type="button"
                >
                  <CheckCircle2 className={`w-6 h-6 mb-3 transition-transform ${
                    tradeInInfo.hasTradeIn ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-600'
                  }`} />
                  <div className="font-light text-lg text-gray-900 dark:text-gray-100 tracking-wide">Yes, I have a trade-in</div>
                  <div className="text-sm font-light text-gray-600 dark:text-gray-400 mt-1">We'll estimate your value instantly</div>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    console.log('❌ No trade-in clicked, clearing all trade-in data');
                    const cleanTradeInInfo: TradeInInfo = { 
                      hasTradeIn: false,
                      brand: '',
                      year: 0,
                      horsepower: 0,
                      model: '',
                      serialNumber: '',
                      condition: 'good' as const,
                      estimatedValue: 0,
                      confidenceLevel: 'medium' as const,
                      // Clear audit fields
                      rangePrePenaltyLow: undefined,
                      rangePrePenaltyHigh: undefined,
                      rangeFinalLow: undefined,
                      rangeFinalHigh: undefined,
                      tradeinValuePrePenalty: undefined,
                      tradeinValueFinal: undefined,
                      penaltyApplied: undefined,
                      penaltyFactor: undefined
                    };
                    onTradeInChange(cleanTradeInInfo);
                    console.log('✅ onTradeInChange called with clean state:', cleanTradeInInfo);
                    onAutoAdvance?.();
                    console.log('🚀 onAutoAdvance called');
                  }}
                  aria-pressed={!tradeInInfo.hasTradeIn}
                  className={`relative p-6 border-2 rounded-sm transition-all bg-white dark:bg-gray-900 text-left group ${
                    !tradeInInfo.hasTradeIn 
                      ? 'border-gray-900 dark:border-gray-100 shadow-lg' 
                      : 'border-gray-300 dark:border-gray-700 hover:border-gray-900 dark:hover:border-gray-100 hover:shadow-lg'
                  }`}
                  type="button"
                >
                  <AlertTriangle className={`w-6 h-6 mb-3 transition-transform ${
                    !tradeInInfo.hasTradeIn ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-600'
                  }`} />
                  <div className="font-light text-lg text-gray-900 dark:text-gray-100 tracking-wide">No trade-in</div>
                  <div className="text-sm font-light text-gray-600 dark:text-gray-400 mt-1">Skip valuation and continue</div>
                </motion.button>
              </div>
            </div>
          </div>

          {tradeInInfo.hasTradeIn && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              
              {/* Pre-filled notice */}
              {currentMotorBrand && currentMotorBrand !== 'No Current Motor' && (
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-sm p-4">
                  <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-light">Pre-filled from your current motor details</span>
                  </div>
                  <p className="text-xs font-light text-gray-600 dark:text-gray-400 mt-1">You can adjust any details below if needed.</p>
                </div>
              )}
              
              {/* Trade-In Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="trade-brand" className="text-sm font-light tracking-wide text-gray-900 dark:text-gray-100">
                    Brand *
                  </Label>
                  <Select 
                    value={tradeInInfo.brand} 
                    onValueChange={(value) => onTradeInChange({ ...tradeInInfo, brand: value })}
                  >
                    <SelectTrigger className="min-h-[48px] rounded-sm border-gray-300 dark:border-gray-700 font-light">
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brandOptions.map(brand => (
                        <SelectItem key={brand} value={brand} className="font-light">{brand}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trade-year" className="text-sm font-light tracking-wide text-gray-900 dark:text-gray-100">
                    Year *
                  </Label>
                  <Select 
                    value={tradeInInfo.year?.toString() || ''} 
                    onValueChange={(value) => onTradeInChange({ ...tradeInInfo, year: parseInt(value) })}
                  >
                    <SelectTrigger className="min-h-[48px] rounded-sm border-gray-300 dark:border-gray-700 font-light">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(year => (
                        <SelectItem key={year} value={year.toString()} className="font-light">{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trade-hp" className="text-sm font-light tracking-wide text-gray-900 dark:text-gray-100">
                    Horsepower *
                  </Label>
                  <Input
                    id="trade-hp"
                    type="number"
                    value={tradeInInfo.horsepower || ''}
                    onChange={(e) => onTradeInChange({ ...tradeInInfo, horsepower: parseInt(e.target.value) || 0 })}
                    placeholder="e.g., 115"
                    min="1"
                    max="600"
                    className="min-h-[48px] rounded-sm border-gray-300 dark:border-gray-700 font-light"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trade-model" className="text-sm font-light tracking-wide text-gray-900 dark:text-gray-100">
                    Model (Optional)
                  </Label>
                  <Input
                    id="trade-model"
                    value={tradeInInfo.model}
                    onChange={(e) => onTradeInChange({ ...tradeInInfo, model: e.target.value })}
                    placeholder="e.g., OptiMax Pro XS"
                    className="min-h-[48px] rounded-sm border-gray-300 dark:border-gray-700 font-light"
                  />
                </div>

                {/* Serial Number */}
                <div className="space-y-2">
                  <Label htmlFor="trade-serial" className="text-sm font-light tracking-wide text-gray-900 dark:text-gray-100">
                    Serial Number (Optional)
                  </Label>
                  <Input
                    id="trade-serial"
                    value={tradeInInfo.serialNumber}
                    onChange={(e) => onTradeInChange({ ...tradeInInfo, serialNumber: e.target.value })}
                    placeholder="Motor serial number"
                    className="min-h-[48px] rounded-sm border-gray-300 dark:border-gray-700 font-light"
                  />
                </div>
              </div>

              {/* Enhanced Condition Selection */}
              <div className="space-y-4">
                <Label className="text-base font-light tracking-wide text-gray-900 dark:text-gray-100">
                  Motor Condition *
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {conditionOptions.map((option) => (
                    <motion.div
                      key={option.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`cursor-pointer border-2 rounded-sm p-4 text-center transition-all duration-300 ${
                        tradeInInfo.condition === option.value 
                          ? 'border-gray-900 dark:border-gray-100 bg-gray-50 dark:bg-gray-800 shadow-lg' 
                          : 'border-gray-300 dark:border-gray-700 hover:border-gray-900 dark:hover:border-gray-100 hover:shadow-md'
                      }`}
                      onClick={() => onTradeInChange({ ...tradeInInfo, condition: option.value as any })}
                    >
                      {/* Icon based on condition */}
                      <div className="mb-3 flex justify-center">
                        {option.value === 'excellent' && <Sparkles className="w-8 h-8 text-gray-900 dark:text-gray-100" strokeWidth={1.5} />}
                        {option.value === 'good' && <CircleCheck className="w-8 h-8 text-gray-900 dark:text-gray-100" strokeWidth={1.5} />}
                        {option.value === 'fair' && <AlertCircle className="w-8 h-8 text-gray-900 dark:text-gray-100" strokeWidth={1.5} />}
                        {option.value === 'poor' && <Wrench className="w-8 h-8 text-gray-900 dark:text-gray-100" strokeWidth={1.5} />}
                      </div>
                      <div className="font-light text-base tracking-wide text-gray-900 dark:text-gray-100">{option.label}</div>
                      <div className="text-sm font-light text-gray-600 dark:text-gray-400 mt-1">{option.description}</div>
                      <div className="text-xs font-light text-gray-500 dark:text-gray-400 mt-1">
                        {option.value === 'excellent' && '<100 hours'}
                        {option.value === 'good' && '100-500 hours'}
                        {option.value === 'fair' && '500-1000 hours'}
                        {option.value === 'poor' && '1000+ hours'}
                      </div>
                      
                      {/* Selection indicator */}
                      {tradeInInfo.condition === option.value && (
                        <div className="mt-2 text-gray-900 dark:text-gray-100">
                          <CheckCircle2 className="w-5 h-5 mx-auto" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Get Estimate Button */}
              <Button 
                onClick={handleGetEstimate}
                disabled={!tradeInInfo.brand || !tradeInInfo.year || !tradeInInfo.horsepower || !tradeInInfo.condition || isLoading}
                className={`w-full min-h-[56px] border-2 rounded-sm font-light text-base tracking-widest uppercase transition-all ${
                  !tradeInInfo.brand || !tradeInInfo.year || !tradeInInfo.horsepower || !tradeInInfo.condition || isLoading
                    ? 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                    : 'border-gray-900 dark:border-gray-100 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900'
                }`}
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
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                    <div className="p-6 space-y-6">
                      <div className="text-center space-y-3">
                        <h3 className="text-sm font-light tracking-widest uppercase text-gray-600 dark:text-gray-400">
                          ESTIMATED TRADE VALUE
                        </h3>
                        <div className="text-5xl font-light text-gray-900 dark:text-gray-100 tracking-tight">
                          ${medianValue.toLocaleString()}
                        </div>
                        <p className="text-sm font-light text-gray-600 dark:text-gray-400">
                          Based on {tradeInInfo.condition} condition
                        </p>
                      </div>

                      <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-light tracking-wide text-gray-900 dark:text-gray-100">We pay more for:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {tradeInInfo.brand && tradeInInfo.brand.toLowerCase() === 'mercury' && (
                            <div className="flex items-center space-x-2 text-sm font-light">
                              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300">Mercury motors (bonus applied!)</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2 text-sm font-light">
                            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">Recent service history</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm font-light">
                            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">Low hours</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm font-light">
                            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">Power trim/tilt models</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-sm p-4">
                        <p className="text-sm font-light text-green-700 dark:text-green-300">
                          💰 Excellent condition could add 10–15% more
                        </p>
                      </div>

                      {/* Brand penalty notice */}
                      {getBrandPenaltyFactor(tradeInInfo.brand) < 1 && (
                        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-sm p-4">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-4 h-4 text-orange-700 dark:text-orange-300 flex-shrink-0 mt-0.5" />
                            <span className="text-sm font-light text-orange-700 dark:text-orange-300">
                              Adjusted for brand (-50%) — Manufacturer out of business; parts & service availability limited.
                            </span>
                          </div>
                        </div>
                      )}

                      {estimate.factors.length > 0 && (
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-light tracking-wide text-gray-900 dark:text-gray-100 mb-2">Applied Adjustments:</p>
                          <ul className="text-sm font-light space-y-2">
                            {estimate.factors.map((factor, index) => (
                              <li key={index} className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                                <div className="w-1.5 h-1.5 bg-gray-900 dark:bg-gray-100 rounded-full flex-shrink-0"></div>
                                <span>{factor}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <Alert className="border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        <AlertTriangle className="w-4 h-4 text-gray-900 dark:text-gray-100" />
                        <AlertDescription className="text-gray-700 dark:text-gray-300 font-light">
                          Final value subject to in-person inspection by our certified technicians.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Repower Center Authority */}
              <div className="text-center">
                <img
                  src="/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png"
                  alt="Official Mercury Repower Center badge"
                  loading="lazy"
                  className="h-12 mx-auto mb-3 w-auto"
                />
                <p className="font-light tracking-wide text-gray-900 dark:text-gray-100 text-base mb-2">
                  As a Certified Mercury Repower Center, we offer:
                </p>
                <ul className="space-y-1.5 text-sm font-light text-gray-700 dark:text-gray-300">
                  <li>✓ Competitive trade-in options</li>
                  <li>✓ Expert repower consultation</li>
                  <li>✓ Up to $1,000 in Mercury rebates</li>
                </ul>
              </div>

              {/* Continue Button - shown after estimate */}
              {estimate && (
                <Button 
                  onClick={onAutoAdvance}
                  className="w-full min-h-[56px] border-2 rounded-sm font-light text-base tracking-widest uppercase transition-all border-gray-900 dark:border-gray-100 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900"
                >
                  Continue to Next Step
                </Button>
              )}
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};