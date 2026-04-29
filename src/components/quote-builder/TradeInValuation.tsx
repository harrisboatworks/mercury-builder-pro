import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import { motion } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, DollarSign, ArrowRight, CheckCircle2, CircleCheck, AlertCircle, AlertTriangle, Info, Wrench, ChevronDown, ExternalLink, Pencil } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { decodeTradeInModel, type Confidence, type DecodeResult } from './tradeInModelDecoder';
import { estimateTradeValue, medianRoundedTo25, getBrandPenaltyFactor, fetchHBWValuation, buildHBWReportUrl, type TradeValueEstimate, type TradeInInfo, type TradeValuationConfig, type HBWValuationResult } from '@/lib/trade-valuation';
import { AnimatedPrice } from '@/components/ui/AnimatedPrice';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useTradeValuationData } from '@/hooks/useTradeValuationData';

type Confidence = 'high' | 'medium' | 'low' | 'unknown';

interface DecodeResult {
  hp: number | null;
  stroke: string | null;
  hpConfidence: Confidence;
  strokeConfidence: Confidence;
  hpReasons: string[];
  strokeReasons: string[];
  warnings: string[];
  suggestions: string[];
}

interface DecodeContext {
  brand?: string;
  year?: number;
}

const BRAND_FROM_PREFIX: Record<string, string> = {
  F: 'Yamaha',
  DF: 'Suzuki',
  BF: 'Honda',
  DT: 'Suzuki 2-stroke',
};

/**
 * Decodes a trade-in motor model string with confidence + suggestions.
 * Pattern-based heuristics only (no DB lookup).
 */
export function decodeTradeInModel(raw: string, ctx: DecodeContext = {}): DecodeResult {
  const { brand, year } = ctx;
  const result: DecodeResult = {
    hp: null,
    stroke: null,
    hpConfidence: 'unknown',
    strokeConfidence: 'unknown',
    hpReasons: [],
    strokeReasons: [],
    warnings: [],
    suggestions: [],
  };
  const trimmed = (raw || '').trim();
  if (!trimmed) return result;
  const upper = trimmed.toUpperCase();

  // ---- HP extraction ----
  const strong = upper.match(/^(?:F|DF|BF|DT)?(\d{1,3}(?:\.\d)?)/);
  const embedded = Array.from(upper.matchAll(/\b(\d{1,3}(?:\.\d)?)\b/g))
    .map((m) => parseFloat(m[1]))
    .filter((n) => n >= 2 && n <= 450 && !(n >= 1950 && n <= 2050));

  if (strong) {
    const n = parseFloat(strong[1]);
    if (n >= 2 && n <= 450) {
      result.hp = n;
      const prefixMatch = upper.match(/^(F|DF|BF|DT)\d/);
      if (prefixMatch) {
        result.hpConfidence = 'high';
        result.hpReasons.push(`"${prefixMatch[1]}${n}" prefix is a standard ${BRAND_FROM_PREFIX[prefixMatch[1]]} HP code`);
      } else if (/^\d/.test(upper)) {
        result.hpConfidence = 'high';
        result.hpReasons.push(`Leading number "${n}" parsed as HP`);
      } else {
        result.hpConfidence = 'medium';
        result.hpReasons.push(`Number "${n}" found near start of model text`);
      }
    } else {
      result.hp = n;
      result.hpConfidence = 'low';
      result.hpReasons.push(`Number "${n}" found but outside plausible HP range`);
      result.warnings.push(`HP "${n}" outside typical 2–450 range`);
    }
  } else if (embedded.length === 1) {
    result.hp = embedded[0];
    result.hpConfidence = 'medium';
    result.hpReasons.push(`Single number "${embedded[0]}" embedded in model text`);
  } else if (embedded.length > 1) {
    result.hp = embedded[0];
    result.hpConfidence = 'low';
    result.hpReasons.push(`${embedded.length} numbers found (${embedded.join(', ')}) — picked first`);
    result.warnings.push(`Multiple numbers found — using ${embedded[0]} HP`);
  }

  // ---- Stroke detection ----
  const fourStrokeHit = upper.match(/^(?:DF|F|BF)\d|4S\b|FOURSTROKE|FOUR.STROKE/);
  const optiHit = upper.match(/OPTIMAX|OPTI\b/);
  const twoStrokeHit = upper.match(/2S\b|TWOSTROKE|TWO.STROKE|^DT\d/);

  if (fourStrokeHit) {
    result.stroke = '4-Stroke';
    result.strokeConfidence = 'high';
    result.strokeReasons.push(`Matched "${fourStrokeHit[0]}" in model text → 4-Stroke marker`);
  } else if (optiHit) {
    result.stroke = 'OptiMax';
    result.strokeConfidence = 'high';
    result.strokeReasons.push(`Matched "${optiHit[0]}" → Mercury OptiMax`);
  } else if (twoStrokeHit) {
    result.stroke = '2-Stroke';
    result.strokeConfidence = 'high';
    result.strokeReasons.push(`Matched "${twoStrokeHit[0]}" → 2-Stroke marker`);
  } else if (/^\d/.test(upper) && result.hp) {
    // Bare number — try to use year as a tiebreaker
    if (year && year >= 2007) {
      result.stroke = '4-Stroke';
      result.strokeConfidence = 'medium';
      result.strokeReasons.push(`Bare HP + year ${year} (≥ 2007) → likely 4-Stroke (modern Mercury era)`);
    } else if (year && year < 2000) {
      result.stroke = '2-Stroke';
      result.strokeConfidence = 'medium';
      result.strokeReasons.push(`Bare HP + year ${year} (< 2000) → likely 2-Stroke era`);
    } else {
      result.stroke = null;
      result.strokeConfidence = 'low';
      result.strokeReasons.push('Bare HP with no year — stroke ambiguous');
      result.warnings.push("Stroke unclear from bare HP — enter year to refine, or add '4S' / '2S'");
    }
  }

  // ---- Unrecognized ----
  if (!result.hp && !result.stroke) {
    result.warnings.push('Couldn\'t recognize this code — try "F115", "150 ELPT", or just the HP number');
  }

  // ---- Suggestions ----
  const numericOnly = /^\d+(\.\d+)?$/.test(trimmed);
  if (numericOnly && result.hp) {
    const n = result.hp;
    const brandLower = (brand || '').toLowerCase();
    const all = [
      { tag: 'mercury', text: `${n} ELPT` },
      { tag: 'yamaha', text: `F${n}` },
      { tag: 'suzuki', text: `DF${n}` },
      { tag: 'honda', text: `BF${n}` },
    ];
    if (brandLower) {
      const matched = all.find((s) => s.tag === brandLower);
      if (matched) result.suggestions = [matched.text];
      else result.suggestions = all.slice(0, 3).map((s) => s.text);
    } else {
      result.suggestions = all.slice(0, 3).map((s) => s.text);
    }
  } else if (/^F[\s-]+\d/.test(upper) || /^DF[\s-]+\d/.test(upper) || /^BF[\s-]+\d/.test(upper)) {
    const normalized = upper.replace(/[\s-]+/g, '');
    result.suggestions = [normalized];
  }

  return result;
}


interface TradeInValuationProps {
  tradeInInfo: TradeInInfo;
  onTradeInChange: (tradeInfo: TradeInInfo) => void;
  onAutoAdvance?: () => void;
  currentMotorBrand?: string;
  currentHp?: number;
  currentMotorYear?: number;
  /** Customer name from quote context for personalized HBW report */
  customerName?: string;
  /** When true, skip the Yes/No toggle and show the form immediately */
  standalone?: boolean;
  /** The price of the motor being quoted — used to warn if trade-in exceeds it */
  selectedMotorPrice?: number;
}

export const TradeInValuation = ({ tradeInInfo, onTradeInChange, onAutoAdvance, currentMotorBrand, currentHp, currentMotorYear, customerName, standalone = false, selectedMotorPrice }: TradeInValuationProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [estimate, setEstimate] = useState<TradeValueEstimate | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [moreDetailsOpen, setMoreDetailsOpen] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const { triggerHaptic } = useHapticFeedback();
  const autoEstimateTriggered = useRef(false);
  
  // Fetch trade valuation data from Supabase (with fallback to hardcoded values)
  const { data: valuationData } = useTradeValuationData();

  // Shared writer for the model input + suggestion clicks.
  const applyModelText = (raw: string) => {
    setEstimate(null);
    autoEstimateTriggered.current = false;
    const trimmed = raw.trim();
    const numericOnly = /^\d+(\.\d+)?$/.test(trimmed);
    onTradeInChange({
      ...tradeInInfo,
      model: raw,
      horsepower: numericOnly ? parseFloat(trimmed) : 0,
    });
  };

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

  // A "model or hp" identifier counts as filled when either model text exists
  // or a numeric HP has been parsed from it.
  const hasModelOrHp = Boolean((tradeInInfo.model && tradeInInfo.model.trim()) || tradeInInfo.horsepower);

  // Clear validation when all required fields are filled
  useEffect(() => {
    if (showValidation && tradeInInfo.brand && tradeInInfo.year && hasModelOrHp && tradeInInfo.condition) {
      setShowValidation(false);
    }
  }, [tradeInInfo.brand, tradeInInfo.year, hasModelOrHp, tradeInInfo.condition, showValidation]);

  // Reset estimate when fields change so button is shown again
  useEffect(() => {
    if (estimate) {
      setEstimate(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradeInInfo.brand, tradeInInfo.year, tradeInInfo.horsepower, tradeInInfo.model, tradeInInfo.condition]);


  // Check if required fields are missing
  const missingFields = {
    brand: !tradeInInfo.brand,
    year: !tradeInInfo.year,
    horsepower: !hasModelOrHp,
    condition: !tradeInInfo.condition
  };
  const hasMissingFields = Object.values(missingFields).some(Boolean);

  const brandOptions = [
    'Mercury', 'Yamaha', 'Honda', 'Suzuki', 'Tohatsu', 'Evinrude', 'Johnson', 'OMC', 'Mariner', 'Force', 'Other'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear - i);

  const conditionOptions = [
    { value: 'excellent', label: 'Excellent', description: 'Like new, 0–100 hours, no issues' },
    { value: 'good', label: 'Good', description: '100–500 hours, well maintained' },
    { value: 'fair', label: 'Fair', description: '500–1,000 hours, needs minor work' },
    { value: 'poor', label: 'Poor', description: '1,000+ hours or needs major repair' }
  ];

  const handleGetEstimate = async () => {
    console.log('Getting estimate - Current tradeInInfo:', tradeInInfo);
    
    if (!tradeInInfo.brand || !tradeInInfo.year || !hasModelOrHp || !tradeInInfo.condition) {
      console.log('Missing required fields');
      return;
    }

    setIsLoading(true);

    // Stroke is always inferred by the HBW API from the model code.
    const hbwResult = await fetchHBWValuation({
      brand: tradeInInfo.brand,
      year: tradeInInfo.year,
      horsepower: tradeInInfo.horsepower,
      condition: tradeInInfo.condition,
      hours: tradeInInfo.engineHours,
      model: tradeInInfo.model,
    });

    let tradeEstimate: TradeValueEstimate & { listingValue?: number; hstSavings?: number; fromHBW?: boolean };

    if (hbwResult) {
      console.log('✅ HBW API returned valuation:', hbwResult);
      tradeEstimate = hbwResult;
    } else {
      console.log('⚠️ HBW API unavailable, using local fallback');
      // Simulate brief delay for local calc
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Build config from database data
      const config: TradeValuationConfig | undefined = valuationData?.config ? {
        BRAND_PENALTY_JOHNSON: valuationData.config.BRAND_PENALTY_JOHNSON as { factor: number } | undefined,
        BRAND_PENALTY_EVINRUDE: valuationData.config.BRAND_PENALTY_EVINRUDE as { factor: number } | undefined,
        BRAND_PENALTY_OMC: valuationData.config.BRAND_PENALTY_OMC as { factor: number } | undefined,
        MERCURY_BONUS_YEARS: valuationData.config.MERCURY_BONUS_YEARS as { max_age: number; factor: number } | undefined,
        MIN_TRADE_VALUE: valuationData.config.MIN_TRADE_VALUE as { value: number } | undefined,
        HP_CLASS_FLOORS: valuationData.config.HP_CLASS_FLOORS as Record<string, number> | undefined,
        TWO_STROKE_PENALTY: valuationData.config.TWO_STROKE_PENALTY as { factor: number } | undefined,
        HOURS_ADJUSTMENT: valuationData.config.HOURS_ADJUSTMENT as TradeValuationConfig['HOURS_ADJUSTMENT'] | undefined,
        MSRP_TRADE_PERCENTAGES: valuationData.config.MSRP_TRADE_PERCENTAGES as unknown as Record<string, Record<string, number>> | undefined,
      } : undefined;
      
      tradeEstimate = {
        ...estimateTradeValue(tradeInInfo, {
          brackets: valuationData?.brackets,
          config,
          referenceMsrps: valuationData?.referenceMsrps,
          referenceMsrpsMax: valuationData?.referenceMsrpsMax,
        }),
        fromHBW: false,
      };
    }

    setEstimate(tradeEstimate);
    
    // Update the trade-in info with the rounded median value ($25 increments)
    const finalValue = medianRoundedTo25(tradeEstimate.low, tradeEstimate.high);
    // Build report URL for persistence — let the API decode stroke from model.
    const reportUrl = (tradeEstimate as HBWValuationResult).fromHBW
      ? buildHBWReportUrl({
          brand: tradeInInfo.brand,
          year: tradeInInfo.year,
          hp: tradeInInfo.horsepower,
          condition: tradeInInfo.condition,
          hours: tradeInInfo.engineHours,
          model: tradeInInfo.model,
          name: customerName || undefined,
        })
      : undefined;

    onTradeInChange({
      ...tradeInInfo,
      estimatedValue: finalValue,
      confidenceLevel: tradeEstimate.confidence,
      rangePrePenaltyLow: tradeEstimate.prePenaltyLow,
      rangePrePenaltyHigh: tradeEstimate.prePenaltyHigh,
      rangeFinalLow: tradeEstimate.low,
      rangeFinalHigh: tradeEstimate.high,
      tradeinValuePrePenalty: (tradeEstimate.prePenaltyLow !== undefined && tradeEstimate.prePenaltyHigh !== undefined)
        ? medianRoundedTo25(tradeEstimate.prePenaltyLow, tradeEstimate.prePenaltyHigh)
        : finalValue,
      tradeinValueFinal: finalValue,
      penaltyApplied: getBrandPenaltyFactor(tradeInInfo.brand) < 1,
      penaltyFactor: getBrandPenaltyFactor(tradeInInfo.brand),
      valuationReportUrl: reportUrl,
    });
    
    setIsLoading(false);
  };

  const medianValue = estimate 
    ? medianRoundedTo25(estimate.low, estimate.high) 
    : 0;

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
              <p className="text-base font-normal text-gray-700">
                Get an instant estimate for your current motor
              </p>
            </div>
          </div>
            
          {!standalone && (
          <div className="flex flex-col gap-4 mt-6">
              <p className="text-lg font-light text-gray-900">Do you have a motor to trade?</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* "No trade-in" card first */}
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
                  <ArrowRight className={`w-6 h-6 mb-3 transition-transform ${
                    !tradeInInfo.hasTradeIn ? 'text-gray-900' : 'text-gray-400'
                  }`} />
                  <div className="font-light text-lg text-gray-900 tracking-wide">No trade-in</div>
                  <div className="text-sm font-normal text-gray-700 mt-1">Skip and continue</div>
                  <div className="text-xs font-normal text-gray-500 mt-2">Most customers skip this step</div>
                </motion.button>

                {/* "Yes" card second */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    triggerHaptic('light');
                    setEstimate(null);
                    autoEstimateTriggered.current = false;
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
                  <div className="text-sm font-normal text-gray-700 mt-1">We'll estimate your value instantly</div>
                </motion.button>
              </div>
            </div>
          )}



          {(standalone || tradeInInfo.hasTradeIn) && (
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
                  <p className="text-xs font-normal text-gray-600 mt-1">You can adjust any details below if needed.</p>
                </div>
              )}
              
              {/* Required fields: Brand, Year, HP, Engine Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="trade-brand" className="text-sm font-light tracking-wide text-gray-900">
                    Brand *
                  </Label>
                  <Select 
                    value={tradeInInfo.brand} 
                    onValueChange={(value) => {
                      setEstimate(null);
                      autoEstimateTriggered.current = false;
                      onTradeInChange({ ...tradeInInfo, brand: value });
                    }}
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
                    onValueChange={(value) => {
                      setEstimate(null);
                      autoEstimateTriggered.current = false;
                      onTradeInChange({ ...tradeInInfo, year: parseInt(value) });
                    }}
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
                  <Label htmlFor="trade-model" className="text-sm font-light tracking-wide text-gray-900">
                    Model or HP *
                  </Label>
                  <Input
                    id="trade-model"
                    type="text"
                    value={tradeInInfo.model || (tradeInInfo.horsepower ? String(tradeInInfo.horsepower) : '')}
                    onChange={(e) => {
                      applyModelText(e.target.value);
                    }}
                    placeholder="e.g. 150 ELPT, F115LB, or just 150"
                    maxLength={120}
                    className={`min-h-[48px] rounded-sm font-light ${
                      showValidation && missingFields.horsepower 
                        ? 'border-red-500 ring-1 ring-red-500' 
                        : 'border-gray-300'
                    }`}
                  />
                  {showValidation && missingFields.horsepower && (
                    <p className="text-sm text-red-600 font-light mt-1">Required</p>
                  )}
                  {(() => {
                    const raw = (tradeInInfo.model || '').trim();
                    if (!raw) return null;
                    const decoded = decodeTradeInModel(raw, { brand: tradeInInfo.brand, year: tradeInInfo.year });
                    const { hp, stroke, hpConfidence, strokeConfidence, hpReasons, strokeReasons, warnings, suggestions } = decoded;
                    if (!hp && !stroke && warnings.length === 0 && suggestions.length === 0) return null;

                    const chipClass = (conf: Confidence, base: 'hp' | 'stroke') => {
                      if (conf === 'high') {
                        return base === 'hp'
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'bg-muted text-muted-foreground border border-border';
                      }
                      if (conf === 'medium') {
                        return 'bg-background text-foreground border border-border';
                      }
                      return 'bg-muted/50 text-muted-foreground border border-dashed border-border';
                    };
                    const prefix = (conf: Confidence) =>
                      conf === 'high' ? '' : conf === 'medium' ? '~ ' : '? ';
                    const badgeFor = (conf: Confidence) => {
                      if (conf === 'high') return { label: 'High', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
                      if (conf === 'medium') return { label: 'Medium', cls: 'bg-amber-100 text-amber-700 border-amber-200' };
                      if (conf === 'low') return { label: 'Low', cls: 'bg-rose-100 text-rose-700 border-rose-200' };
                      return null;
                    };
                    const hpBadge = hp !== null ? badgeFor(hpConfidence) : null;
                    const strokeBadge = stroke ? badgeFor(strokeConfidence) : null;
                    const hasReasons = hpReasons.length > 0 || strokeReasons.length > 0;

                    return (
                      <div className="mt-1.5 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {hp !== null && (
                            <span className="inline-flex items-center gap-1">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${chipClass(hpConfidence, 'hp')}`}>
                                {prefix(hpConfidence)}{hp} HP
                              </span>
                              {hpBadge && (
                                <span className={`inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide ${hpBadge.cls}`}>
                                  {hpBadge.label}
                                </span>
                              )}
                            </span>
                          )}
                          {stroke && (
                            <span className="inline-flex items-center gap-1">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${chipClass(strokeConfidence, 'stroke')}`}>
                                {prefix(strokeConfidence)}{stroke}
                              </span>
                              {strokeBadge && (
                                <span className={`inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide ${strokeBadge.cls}`}>
                                  {strokeBadge.label}
                                </span>
                              )}
                            </span>
                          )}
                          {(hp !== null || stroke) && (
                            <span className="text-xs text-muted-foreground font-light self-center">
                              (auto-detected)
                            </span>
                          )}
                        </div>
                        {hasReasons && (
                          <div className="flex items-start gap-1.5 text-xs text-muted-foreground font-light">
                            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                            <div className="space-y-0.5">
                              <div>Based on:</div>
                              <ul className="list-disc pl-4 space-y-0.5">
                                {hpReasons.map((r, i) => (
                                  <li key={`hp-${i}`}><span className="font-medium">HP:</span> {r}</li>
                                ))}
                                {strokeReasons.map((r, i) => (
                                  <li key={`st-${i}`}><span className="font-medium">Stroke:</span> {r}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                        {warnings.map((w, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-xs text-amber-700 font-light">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                            <span>{w}</span>
                          </div>
                        ))}
                        {suggestions.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span className="text-xs text-muted-foreground font-light">Did you mean:</span>
                            {suggestions.map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => applyModelText(s)}
                                className="inline-flex items-center rounded-full border border-primary/40 bg-background px-2.5 py-0.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Condition Selection */}
              <div className="space-y-4">
                <Label className="text-base font-light tracking-wide text-gray-900">
                  Motor Condition *
                </Label>
                <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 ${
                  showValidation && missingFields.condition ? 'ring-2 ring-red-500 rounded-sm p-2' : ''
                }`}>
                  {conditionOptions.map((option) => (
                    <motion.button
                      type="button"
                      key={option.value}
                      whileTap={{ scale: 0.98 }}
                      className={`cursor-pointer border-2 rounded-sm p-4 text-center transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 ${
                        tradeInInfo.condition === option.value 
                          ? 'border-gray-900 bg-gray-900 text-white shadow-lg ring-2 ring-gray-900 ring-offset-2' 
                          : 'border-gray-300 hover:border-gray-900 hover:shadow-md'
                      }`}
                      onClick={() => {
                        triggerHaptic('light');
                        setEstimate(null);
                        autoEstimateTriggered.current = false;
                        onTradeInChange({ ...tradeInInfo, condition: option.value as any });
                      }}
                    >
                      <div className={`font-light text-lg ${tradeInInfo.condition === option.value ? 'text-white' : 'text-gray-900'}`}>{option.label}</div>
                      <div className={`text-xs font-normal mt-1 ${tradeInInfo.condition === option.value ? 'text-gray-300' : 'text-gray-600'}`}>{option.description}</div>
                    </motion.button>
                  ))}
                </div>
                {showValidation && missingFields.condition && (
                  <p className="text-sm text-red-600 font-light">Please select a condition</p>
                )}
              </div>

              {/* Collapsible optional fields */}
              <Collapsible open={moreDetailsOpen} onOpenChange={setMoreDetailsOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-light text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${moreDetailsOpen ? 'rotate-180' : ''}`} />
                  Add more details for a better estimate
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="trade-start-type" className="text-sm font-light tracking-wide text-gray-900">
                        Start Type
                      </Label>
                      <Select 
                        value={tradeInInfo.startType || ''} 
                        onValueChange={(value) => onTradeInChange({ ...tradeInInfo, startType: value as TradeInInfo['startType'] })}
                      >
                        <SelectTrigger className="min-h-[48px] rounded-sm font-light border-gray-300">
                          <SelectValue placeholder="Manual (default)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual" className="font-light">Manual (Pull Start)</SelectItem>
                          <SelectItem value="electric" className="font-light">Electric Start</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="trade-hours" className="text-sm font-light tracking-wide text-gray-900">
                        Engine Hours
                      </Label>
                      <Input
                        id="trade-hours"
                        type="number"
                        value={tradeInInfo.engineHours || ''}
                        onChange={(e) => onTradeInChange({ ...tradeInInfo, engineHours: parseFloat(e.target.value) || undefined })}
                        placeholder="e.g., 250"
                        min="0"
                        max="20000"
                        className="min-h-[48px] rounded-sm border-gray-300 font-light"
                      />
                      <p className="text-xs text-gray-400 font-light">Not sure? Leave blank — it's optional</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="trade-serial" className="text-sm font-light tracking-wide text-gray-900">
                        Serial Number
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
                </CollapsibleContent>
              </Collapsible>

              {/* Get Estimate button */}
              {!estimate && !isLoading && !hasMissingFields && (
                <Button
                  type="button"
                  onClick={handleGetEstimate}
                  className="w-full min-h-[56px] text-lg font-light mt-2 bg-[hsl(var(--luxury-black))] text-white rounded-[10px] hover:opacity-90 active:scale-[0.97] transition-all duration-200 gap-2"
                >
                  <DollarSign className="w-5 h-5" />
                  Get My Estimate
                </Button>
              )}

              {/* Loading indicator */}
              {isLoading && (
                <div className="pt-4 flex items-center justify-center gap-3 text-gray-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-lg font-light">Calculating your estimate...</span>
                </div>
              )}

              {/* Database Estimate Result */}
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
                      {/* Confidence badge */}
                      <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
                        estimate.confidence === 'high' ? 'bg-green-200 text-green-800' :
                        estimate.confidence === 'medium' ? 'bg-amber-200 text-amber-800' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {estimate.confidence === 'high' ? 'High' : estimate.confidence === 'medium' ? 'Medium' : 'Low'} confidence
                      </span>
                    </div>
                    
                    <div className="text-center space-y-2">
                      <div className="text-4xl font-light text-green-700">
                        <AnimatedPrice value={medianValue} prefix="$" duration={0.8} />
                      </div>
                      <div className="text-sm font-normal text-gray-700">
                        Range: ${Math.round(estimate.low).toLocaleString()} – ${Math.round(estimate.high).toLocaleString()}
                      </div>
                    </div>

                    {/* HBW-specific extras — corrected private sale framing */}
                    {(estimate as HBWValuationResult).fromHBW && (estimate as HBWValuationResult).hstSavings > 0 && (
                      <div className="mt-4 space-y-3">
                        <div className="text-sm font-light text-gray-700 bg-green-100 rounded-sm p-3 leading-relaxed">
                          {selectedMotorPrice ? (
                            <>
                              Private sale might get you <strong className="font-medium">${Math.round((estimate as HBWValuationResult).listingValue).toLocaleString()}</strong> — but you'd owe <strong className="font-medium">${Math.round((estimate as HBWValuationResult).hstSavings).toLocaleString()}</strong> more in HST on your new motor. Trading in puts <strong className="font-medium">${medianValue.toLocaleString()} + ${Math.round((estimate as HBWValuationResult).hstSavings).toLocaleString()} in savings</strong> in your pocket.
                            </>
                          ) : (
                            <>
                              When you trade in instead of selling privately, you save <strong className="font-medium">${Math.round((estimate as HBWValuationResult).hstSavings).toLocaleString()}</strong> in HST on your new motor — because you only pay tax on the difference.
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {(estimate as any).penaltyMessage && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-sm">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm font-light text-amber-800">{(estimate as any).penaltyMessage}</p>
                        </div>
                      </div>
                    )}

                    {/* Warning: trade-in exceeds motor price */}
                    {selectedMotorPrice && medianValue > selectedMotorPrice && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-sm">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm font-light text-amber-800">
                            Your trade-in value exceeds the cost of your selected motor. The credit will be capped at the motor price — no cash refunds on trade-ins.
                          </p>
                        </div>
                      </div>
                    )}
                  </Card>

                  {/* View Full Report — subtle text link */}
                  {(estimate as HBWValuationResult).fromHBW && (
                    <div className="text-center">
                      <a
                        href={tradeInInfo.valuationReportUrl || buildHBWReportUrl({
                          brand: tradeInInfo.brand,
                          year: tradeInInfo.year,
                          hp: tradeInInfo.horsepower,
                          condition: tradeInInfo.condition,
                          hours: tradeInInfo.engineHours,
                          model: tradeInInfo.model,
                          name: customerName || undefined,
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-light text-gray-500 hover:text-gray-900 underline underline-offset-2 transition-colors"
                      >
                        View detailed valuation report
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}

                  <Alert className="border-blue-200 bg-blue-50">
                    <Wrench className="w-4 h-4 text-blue-600" />
                    <AlertDescription className="text-sm font-light text-blue-800">
                      Final trade value confirmed after in-person inspection. This estimate helps you plan your budget.
                    </AlertDescription>
                  </Alert>

                  {/* Continue button */}
                  <Button
                    type="button"
                    onClick={() => onAutoAdvance?.()}
                    className="w-full min-h-[56px] text-lg font-light mt-4 bg-[hsl(var(--luxury-black))] text-white rounded-[10px] hover:opacity-90 active:scale-[0.97] transition-all duration-200"
                  >
                    Continue →
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};
