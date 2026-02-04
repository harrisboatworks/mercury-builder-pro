import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { motion } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, DollarSign, AlertTriangle, CheckCircle2, CircleCheck, AlertCircle, Wrench } from 'lucide-react';
import { estimateTradeValue, medianRoundedTo25, getBrandPenaltyFactor, type TradeValueEstimate, type TradeInInfo, type TradeValuationConfig } from '@/lib/trade-valuation';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useTradeValuationData } from '@/hooks/useTradeValuationData';

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
  const [showValidation, setShowValidation] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const { triggerHaptic } = useHapticFeedback();
  
  // Fetch trade valuation data from Supabase (with fallback to hardcoded values)
  const { data: valuationData } = useTradeValuationData();

  // Auto-scroll to form when "Yes, I have a trade-in" is clicked
  useEffect(() => {
    if (tradeInInfo.hasTradeIn && formRef.current) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
  }, [tradeInInfo.hasTradeIn]);

  // Clear validation when all required fields are filled
  useEffect(() => {
    if (showValidation && tradeInInfo.brand && tradeInInfo.year && tradeInInfo.horsepower && tradeInInfo.condition) {
      setShowValidation(false);
    }
  }, [tradeInInfo.brand, tradeInInfo.year, tradeInInfo.horsepower, tradeInInfo.condition, showValidation]);

  // Check if required fields are missing
  const missingFields = {
    brand: !tradeInInfo.brand,
    year: !tradeInInfo.year,
    horsepower: !tradeInInfo.horsepower,
    condition: !tradeInInfo.condition
  };
  const hasMissingFields = Object.values(missingFields).some(Boolean);

  const handleValidatedEstimate = () => {
    if (hasMissingFields) {
      setShowValidation(true);
      return;
    }
    handleGetEstimate();
  };


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
    
    // Build config from database data
    const config: TradeValuationConfig | undefined = valuationData?.config ? {
      BRAND_PENALTY_JOHNSON: valuationData.config.BRAND_PENALTY_JOHNSON as { factor: number } | undefined,
      BRAND_PENALTY_EVINRUDE: valuationData.config.BRAND_PENALTY_EVINRUDE as { factor: number } | undefined,
      BRAND_PENALTY_OMC: valuationData.config.BRAND_PENALTY_OMC as { factor: number } | undefined,
      MERCURY_BONUS_YEARS: valuationData.config.MERCURY_BONUS_YEARS as { max_age: number; factor: number } | undefined,
      MIN_TRADE_VALUE: valuationData.config.MIN_TRADE_VALUE as { value: number } | undefined,
    } : undefined;
    
    const tradeEstimate = estimateTradeValue(tradeInInfo, {
      brackets: valuationData?.brackets,
      config
    });
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
      <Card className="p-8 border-gray-200 bg-white">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-3xl font-light tracking-wide text-gray-900">
                Trade-In Valuation
              </h2>
              <p className="text-base font-light text-gray-600">
                Get an instant estimate for your current motor
              </p>
            </div>
            
            <div className="flex flex-col gap-4 mt-6">
              <p className="text-lg font-light text-gray-900">Do you have a motor to trade?</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    triggerHaptic('light');
                    onTradeInChange({
                      hasTradeIn: true,
                      brand: '',
                      year: 0,
                      horsepower: 0,
                      model: '',
                      serialNumber: '',
                      condition: 'good' as const,
                      estimatedValue: 0,
                      confidenceLevel: 'medium' as const
                    });
                  }}
                  aria-pressed={tradeInInfo.hasTradeIn}
                  className={`relative p-6 border-2 rounded-sm transition-all duration-300 bg-white text-left group premium-lift ${
                    tradeInInfo.hasTradeIn 
                      ? 'border-gray-900 shadow-xl premium-selected' 
                      : 'border-gray-300 hover:border-gray-900 hover:shadow-xl'
                  }`}
                  type="button"
                >
                  <CheckCircle2 className={`w-6 h-6 mb-3 transition-transform ${
                    tradeInInfo.hasTradeIn ? 'text-gray-900 animate-check-pop' : 'text-gray-400'
                  }`} />
                  <div className="font-light text-lg text-gray-900 tracking-wide">Yes, I have a trade-in</div>
                  <div className="text-sm font-light text-gray-600 mt-1">We'll estimate your value instantly</div>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    triggerHaptic('light');
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
                    
                    // Aggressively clear trade-in from localStorage
                    try {
                      const stored = localStorage.getItem('quoteBuilder');
                      if (stored) {
                        const parsed = JSON.parse(stored);
                        if (parsed.state) {
                          parsed.state.tradeInInfo = cleanTradeInInfo;
                          parsed.state.hasTradein = false;
                          localStorage.setItem('quoteBuilder', JSON.stringify(parsed));
                          console.log('🧹 Cleared trade-in from localStorage immediately');
                        }
                      }
                    } catch (e) {
                      console.error('Failed to clear localStorage:', e);
                    }
                    
                    onAutoAdvance?.();
                    console.log('🚀 onAutoAdvance called');
                  }}
                  aria-pressed={!tradeInInfo.hasTradeIn}
                  className={`relative p-6 border-2 rounded-sm transition-all duration-300 bg-white text-left group premium-lift ${
                    !tradeInInfo.hasTradeIn 
                      ? 'border-gray-900 shadow-xl premium-selected' 
                      : 'border-gray-300 hover:border-gray-900 hover:shadow-xl'
                  }`}
                  type="button"
                >
                  <AlertTriangle className={`w-6 h-6 mb-3 transition-transform ${
                    !tradeInInfo.hasTradeIn ? 'text-gray-900' : 'text-gray-400'
                  }`} />
                  <div className="font-light text-lg text-gray-900 tracking-wide">No trade-in</div>
                  <div className="text-sm font-light text-gray-600 mt-1">Skip valuation and continue</div>
                </motion.button>
              </div>
            </div>
          </div>

          {tradeInInfo.hasTradeIn && (
            <motion.div 
              ref={formRef}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              
              {/* Pre-filled notice */}
              {currentMotorBrand && currentMotorBrand !== 'No Current Motor' && (
                <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
                  <div className="flex items-center gap-2 text-gray-900">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-light">Pre-filled from your current motor details</span>
                  </div>
                  <p className="text-xs font-light text-gray-600 mt-1">You can adjust any details below if needed.</p>
                </div>
              )}
              
              {/* Trade-In Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="trade-brand" className="text-sm font-light tracking-wide text-gray-900">
                    Brand *
                  </Label>
                  <Select 
                    value={tradeInInfo.brand} 
                    onValueChange={(value) => onTradeInChange({ ...tradeInInfo, brand: value })}
                  >
                    <SelectTrigger className={`min-h-[48px] rounded-sm font-light ${
                      showValidation && missingFields.brand 
                        ? 'border-red-500 ring-1 ring-red-500' 
                        : 'border-gray-300'
                    }`}>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brandOptions.map(brand => (
                        <SelectItem key={brand} value={brand} className="font-light">{brand}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {showValidation && missingFields.brand && (
                    <p className="text-sm text-red-600 font-light mt-1">Required</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trade-year" className="text-sm font-light tracking-wide text-gray-900">
                    Year *
                  </Label>
                  <Select 
                    value={tradeInInfo.year?.toString() || ''} 
                    onValueChange={(value) => onTradeInChange({ ...tradeInInfo, year: parseInt(value) })}
                  >
                    <SelectTrigger className={`min-h-[48px] rounded-sm font-light ${
                      showValidation && missingFields.year 
                        ? 'border-red-500 ring-1 ring-red-500' 
                        : 'border-gray-300'
                    }`}>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(year => (
                        <SelectItem key={year} value={year.toString()} className="font-light">{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {showValidation && missingFields.year && (
                    <p className="text-sm text-red-600 font-light mt-1">Required</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trade-hp" className="text-sm font-light tracking-wide text-gray-900">
                    Horsepower *
                  </Label>
                  <Input
                    id="trade-hp"
                    type="number"
                    step="0.1"
                    value={tradeInInfo.horsepower || ''}
                    onChange={(e) => onTradeInChange({ ...tradeInInfo, horsepower: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g., 9.9 or 115"
                    min="1"
                    max="600"
                    className={`min-h-[48px] rounded-sm font-light ${
                      showValidation && missingFields.horsepower 
                        ? 'border-red-500 ring-1 ring-red-500' 
                        : 'border-gray-300'
                    }`}
                  />
                  {showValidation && missingFields.horsepower && (
                    <p className="text-sm text-red-600 font-light mt-1">Required</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trade-model" className="text-sm font-light tracking-wide text-gray-900">
                    Model (Optional)
                  </Label>
                  <Input
                    id="trade-model"
                    value={tradeInInfo.model}
                    onChange={(e) => onTradeInChange({ ...tradeInInfo, model: e.target.value })}
                    placeholder="e.g., OptiMax Pro XS"
                    className="min-h-[48px] rounded-sm border-gray-300 font-light"
                  />
                </div>

                {/* Serial Number */}
                <div className="space-y-2">
                  <Label htmlFor="trade-serial" className="text-sm font-light tracking-wide text-gray-900">
                    Serial Number (Optional)
                  </Label>
                  <Input
                    id="trade-serial"
                    value={tradeInInfo.serialNumber}
                    onChange={(e) => onTradeInChange({ ...tradeInInfo, serialNumber: e.target.value })}
                    placeholder="Motor serial number"
                    className="min-h-[48px] rounded-sm border-gray-300 font-light"
                  />
                </div>
              </div>

              {/* Enhanced Condition Selection */}
              <div className="space-y-4">
                <Label className="text-base font-light tracking-wide text-gray-900">
                  Motor Condition *
                </Label>
                <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${
                  showValidation && missingFields.condition ? 'ring-2 ring-red-500 rounded-sm p-2' : ''
                }`}>
                  {conditionOptions.map((option) => (
                    <motion.div
                      key={option.value}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className={`cursor-pointer border-2 rounded-sm p-4 text-center transition-all duration-300 premium-lift ${
                        tradeInInfo.condition === option.value 
                          ? 'border-gray-900 bg-gray-50 shadow-lg premium-selected' 
                          : 'border-gray-300 hover:border-gray-900 hover:shadow-md'
                      }`}
                      onClick={() => onTradeInChange({ ...tradeInInfo, condition: option.value as any })}
                    >
                      <div className="font-light text-lg text-gray-900">{option.label}</div>
                      <div className="text-xs font-light text-gray-500 mt-1">{option.description}</div>
                    </motion.div>
                  ))}
                </div>
                {showValidation && missingFields.condition && (
                  <p className="text-sm text-red-600 font-light">Please select a condition</p>
                )}
              </div>

              {/* Get Estimate Button */}
              <div className="pt-4">
                <Button
                  type="button"
                  onClick={handleValidatedEstimate}
                  disabled={isLoading}
                  className="w-full min-h-[56px] text-lg font-light bg-gray-900 hover:bg-gray-800 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-5 h-5 mr-2" />
                      Get Instant Estimate
                    </>
                  )}
                </Button>
              </div>

              {/* Estimate Result */}
              {estimate && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <Card className="p-6 bg-green-50 border-green-200">
                    <div className="flex items-center gap-3 mb-4">
                      <CircleCheck className="w-6 h-6 text-green-600" />
                      <h3 className="text-lg font-light text-gray-900">Your Estimated Trade Value</h3>
                    </div>
                    
                    <div className="text-center space-y-2">
                      <div className="text-4xl font-light text-green-700">
                        ${medianValue.toLocaleString()}
                      </div>
                      <div className="text-sm font-light text-gray-600">
                        Range: ${estimate.low.toLocaleString()} - ${estimate.high.toLocaleString()}
                      </div>
                    </div>

                    {(estimate as any).penaltyMessage && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-sm">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm font-light text-amber-800">{(estimate as any).penaltyMessage}</p>
                        </div>
                      </div>
                    )}
                  </Card>

                  <Alert className="border-blue-200 bg-blue-50">
                    <Wrench className="w-4 h-4 text-blue-600" />
                    <AlertDescription className="text-sm font-light text-blue-800">
                      Final trade value confirmed after in-person inspection. This estimate helps you plan your budget.
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};
