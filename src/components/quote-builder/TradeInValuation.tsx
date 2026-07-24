import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import { motion } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, DollarSign, ArrowRight, CheckCircle2, CircleCheck, AlertCircle, AlertTriangle, Info, Wrench, ChevronDown, ExternalLink, Pencil, HelpCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { decodeTradeInModel, decodeTradeInModelFields, type Confidence, type DecodeResult } from './tradeInModelDecoder';
import { medianRoundedTo25, getBrandPenaltyFactor, fetchHBWValuation, buildHBWReportUrl, type TradeValueEstimate, type TradeInInfo, type HBWValuationResult } from '@/lib/trade-valuation';
import { AnimatedPrice } from '@/components/ui/AnimatedPrice';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { isSupportedTradeInYear, TRADE_IN_MIN_YEAR } from '@/lib/trade-in-state';



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
  /** The price of the motor being quoted, used to warn if trade-in exceeds it */
  selectedMotorPrice?: number;
}

export const TradeInValuation = ({ tradeInInfo, onTradeInChange, onAutoAdvance, currentMotorBrand, currentHp, currentMotorYear, customerName, standalone = false, selectedMotorPrice }: TradeInValuationProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [estimate, setEstimate] = useState<TradeValueEstimate | null>(null);
  const [apiUnavailable, setApiUnavailable] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [moreDetailsOpen, setMoreDetailsOpen] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const { triggerHaptic } = useHapticFeedback();
  const autoEstimateTriggered = useRef(false);

  // Manual overrides for the decoded HP / Stroke chips. `undefined` means
  // "no override, use parser value". `null` clears a parser value.
  const [decodeOverride, setDecodeOverride] = useState<{
    hp?: number | null;
    stroke?: '4-Stroke' | '2-Stroke' | 'OptiMax' | null;
  }>({});
  const [hpOverrideInput, setHpOverrideInput] = useState<string>('');

  // Fetch trade valuation data from Supabase (with fallback to hardcoded values)

  // Shared writer for the model input + suggestion clicks.
  const applyModelText = (raw: string) => {
    setEstimate(null);
    autoEstimateTriggered.current = false;
    setDecodeOverride({}); // fresh model text → drop any prior overrides
    const trimmed = raw.trim();
    const decodedFields = decodeTradeInModelFields(trimmed, {
      brand: tradeInInfo.brand,
      year: tradeInInfo.year,
    });
    onTradeInChange({
      ...tradeInInfo,
      model: raw,
      horsepower: decodedFields.horsepower,
      engineType: decodedFields.engineType,
    });
  };

  const strokeToEngineType = (s: '4-Stroke' | '2-Stroke' | 'OptiMax' | null | undefined):
    '4-stroke' | '2-stroke' | 'optimax' | undefined => {
    if (s === '4-Stroke') return '4-stroke';
    if (s === '2-Stroke') return '2-stroke';
    if (s === 'OptiMax') return 'optimax';
    return undefined;
  };

  const commitHpOverride = (n: number | null) => {
    setEstimate(null);
    autoEstimateTriggered.current = false;
    setDecodeOverride((prev) => ({ ...prev, hp: n }));
    if (n !== null) {
      onTradeInChange({ ...tradeInInfo, horsepower: n });
    }
  };

  const commitStrokeOverride = (s: '4-Stroke' | '2-Stroke' | 'OptiMax' | null) => {
    setEstimate(null);
    autoEstimateTriggered.current = false;
    setDecodeOverride((prev) => ({ ...prev, stroke: s }));
    const et = strokeToEngineType(s);
    onTradeInChange({ ...tradeInInfo, engineType: et });
  };

  const clearHpOverride = () => {
    setEstimate(null);
    setDecodeOverride((prev) => {
      const { hp, ...rest } = prev;
      return rest;
    });
  };

  const clearStrokeOverride = () => {
    setEstimate(null);
    setDecodeOverride((prev) => {
      const { stroke, ...rest } = prev;
      return rest;
    });
    onTradeInChange({ ...tradeInInfo, engineType: undefined });
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
  const currentYear = new Date().getFullYear();
  const hasValidYear = isSupportedTradeInYear(tradeInInfo.year, currentYear);

  useEffect(() => {
    if (showValidation && tradeInInfo.brand && hasValidYear && hasModelOrHp && tradeInInfo.condition) {
      setShowValidation(false);
    }
  }, [tradeInInfo.brand, hasValidYear, hasModelOrHp, tradeInInfo.condition, showValidation]);

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
    year: !hasValidYear,
    horsepower: !hasModelOrHp,
    condition: !tradeInInfo.condition
  };
  const hasMissingFields = Object.values(missingFields).some(Boolean);

  const brandOptions = [
    'Mercury', 'Yamaha', 'Honda', 'Suzuki', 'Tohatsu', 'Evinrude', 'Johnson', 'OMC', 'Mariner', 'Force', 'Other'
  ];

  const conditionOptions = [
    { value: 'excellent', label: 'Excellent', description: 'Like new, 0–100 hours, no issues' },
    { value: 'good', label: 'Good', description: '100–500 hours, well maintained' },
    { value: 'fair', label: 'Fair', description: '500–1,000 hours, needs minor work' },
    { value: 'poor', label: 'Poor', description: '1,000+ hours or needs major repair' }
  ];

  const handleGetEstimate = async () => {
    console.log('Getting estimate - Current tradeInInfo:', tradeInInfo);
    
    if (!tradeInInfo.brand || !hasValidYear || !hasModelOrHp || !tradeInInfo.condition) {
      console.log('Missing required fields');
      return;
    }

    setIsLoading(true);
    setApiUnavailable(false);

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
      // Live valuation API unreachable. We deliberately do NOT fall back to the
      // local table — it drifts out of sync with the canonical HBW engine
      // (hbw-valuation on Vercel) and quietly shows customers numbers we never
      // quoted. Fail honestly: offer retry + a direct line instead.
      console.warn('⚠️ HBW valuation API unavailable — showing retry/contact message (no local fallback)');
      setApiUnavailable(true);
      setEstimate(null);
      setIsLoading(false);
      return;
    }

    setEstimate(tradeEstimate);
    
    // Update the trade-in info with the rounded median value ($25 increments)
    const finalValue = medianRoundedTo25(tradeEstimate.low, tradeEstimate.high);
    // Build report URL for persistence, let the API decode stroke from model.
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
      <Card className="rounded-sm border border-repower-navy-900/10 bg-repower-cream p-6 shadow-none md:p-8">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="font-display text-3xl font-bold tracking-[-0.025em] text-repower-navy-900">
                Trade-In Valuation
              </h2>
              <p className="font-sans text-base text-repower-navy-900/65">
                Get an instant estimate for your current motor.
              </p>
            </div>
          </div>
            
          {!standalone && (
          <div className="flex flex-col gap-4 mt-6">
              <p className="font-display text-xl font-semibold tracking-[-0.01em] text-repower-navy-900">Do you have a motor to trade?</p>
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
                  className={`group premium-lift relative rounded-sm border bg-repower-paper p-6 text-left transition-all duration-300 ${
                    !tradeInInfo.hasTradeIn 
                      ? 'border-repower-mercury-red shadow-[inset_3px_0_0_0_hsl(var(--repower-mercury-red))] premium-selected'
                      : 'border-repower-navy-900/20 hover:border-repower-gold'
                  }`}
                  type="button"
                >
                  <ArrowRight className={`w-6 h-6 mb-3 transition-transform ${
                    !tradeInInfo.hasTradeIn ? 'text-repower-navy-900' : 'text-repower-navy-900/40'
                  }`} />
                  <div className="font-display text-lg font-semibold text-repower-navy-900">No trade-in</div>
                  <div className="mt-1 font-sans text-sm text-repower-navy-900/70">Skip and continue.</div>
                  <div className="mt-2 font-sans text-xs text-repower-navy-900/55">Most customers skip this step.</div>
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
                      ...tradeInInfo,
                      hasTradeIn: true,
                      condition: tradeInInfo.condition || 'good',
                      estimatedValue: 0,
                      confidenceLevel: tradeInInfo.confidenceLevel || 'medium'
                    });
                  }}
                  aria-pressed={tradeInInfo.hasTradeIn}
                  className={`group premium-lift relative rounded-sm border bg-repower-paper p-6 text-left transition-all duration-300 ${
                    tradeInInfo.hasTradeIn 
                      ? 'border-repower-mercury-red shadow-[inset_3px_0_0_0_hsl(var(--repower-mercury-red))] premium-selected'
                      : 'border-repower-navy-900/20 hover:border-repower-gold'
                  }`}
                  type="button"
                >
                  <CheckCircle2 className={`w-6 h-6 mb-3 transition-transform ${
                    tradeInInfo.hasTradeIn ? 'text-repower-navy-900 animate-check-pop' : 'text-repower-navy-900/40'
                  }`} />
                  <div className="font-display text-lg font-semibold text-repower-navy-900">Yes, I have a trade-in</div>
                  <div className="mt-1 font-sans text-sm text-repower-navy-900/70">We'll estimate your value instantly.</div>
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
              {currentMotorBrand && currentMotorBrand !== 'No Current Motor' && Boolean(
                tradeInInfo.brand || tradeInInfo.year || tradeInInfo.horsepower || tradeInInfo.model
              ) && (
                <div className="bg-repower-navy-900/[0.04] border border-repower-navy-900/10 rounded-sm p-4">
                  <div className="flex items-center gap-2 text-repower-navy-900">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-sans text-sm">Pre-filled from your current motor details</span>
                  </div>
                  <p className="text-xs font-normal text-repower-navy-900/65 mt-1">You can adjust any details below if needed.</p>
                </div>
              )}
              
              {/* Required fields: Brand, Year, HP, Engine Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="trade-brand" className="font-sans font-semibold text-[12px] uppercase tracking-[0.14em] text-repower-navy-900/70">
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
                    <SelectTrigger className={`min-h-[48px] rounded-sm bg-repower-paper font-sans ${
                      showValidation && missingFields.brand 
                        ? 'border-repower-mercury-red ring-1 ring-repower-mercury-red focus-visible:ring-repower-mercury-red' 
                        : 'border-repower-navy-900/20'
                    }`}>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brandOptions.map(brand => (
                        <SelectItem key={brand} value={brand} className="font-sans">{brand}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {showValidation && missingFields.brand && (
                    <p className="font-sans text-[12px] font-medium text-repower-mercury-red mt-1.5 inline-flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />Required</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trade-year" className="font-sans font-semibold text-[12px] uppercase tracking-[0.14em] text-repower-navy-900/70 inline-flex items-center gap-1.5">
                    Year *
                    <TooltipProvider delayDuration={150}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label="Why year matters"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="start" className="max-w-xs text-xs leading-relaxed">
                          <p className="font-medium mb-1">Why the year matters</p>
                          <p className="font-sans">
                            For Mercury motors, a bare HP number (like "90") can use the year as a
                            clue. Other brands still need the full model or an explicit "4S" / "2S".
                          </p>
                          <ul className="mt-1 list-disc space-y-0.5 pl-4 font-sans">
                            <li><span className="font-medium">Mercury, 2007 or newer</span> → likely 4-Stroke</li>
                            <li><span className="font-medium">Mercury, before 2000</span> → likely 2-Stroke</li>
                            <li><span className="font-medium">Any uncertainty</span> → add the full model, "4S", or "2S"</li>
                          </ul>
                          <p className="mt-1 font-sans">
                            Picking a year updates the "Based on" reasons under the model field automatically.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    id="trade-year"
                    type="number"
                    inputMode="numeric"
                    min={TRADE_IN_MIN_YEAR}
                    max={currentYear}
                    value={tradeInInfo.year || ''}
                    onChange={(event) => {
                      setEstimate(null);
                      autoEstimateTriggered.current = false;
                      const year = Number.parseInt(event.target.value, 10);
                      onTradeInChange({ ...tradeInInfo, year: Number.isFinite(year) ? year : 0 });
                    }}
                    placeholder="e.g. 2003"
                    aria-describedby={showValidation && missingFields.year ? 'trade-year-error' : undefined}
                    className={`min-h-[48px] rounded-sm bg-repower-paper font-sans ${
                      showValidation && missingFields.year 
                        ? 'border-repower-mercury-red ring-1 ring-repower-mercury-red focus-visible:ring-repower-mercury-red' 
                        : 'border-repower-navy-900/20'
                    }`}
                  />
                  {showValidation && missingFields.year && (
                    <p id="trade-year-error" className="font-sans text-[12px] font-medium text-repower-mercury-red mt-1.5 inline-flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />Enter a year from {TRADE_IN_MIN_YEAR} to {currentYear}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trade-model" className="font-sans font-semibold text-[12px] uppercase tracking-[0.14em] text-repower-navy-900/70">
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
                    className={`min-h-[48px] rounded-sm bg-repower-paper font-sans ${
                      showValidation && missingFields.horsepower 
                        ? 'border-repower-mercury-red ring-1 ring-repower-mercury-red focus-visible:ring-repower-mercury-red' 
                        : 'border-repower-navy-900/20'
                    }`}
                  />
                  {showValidation && missingFields.horsepower && (
                    <p className="font-sans text-[12px] font-medium text-repower-mercury-red mt-1.5 inline-flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />Required</p>
                  )}
                  {(() => {
                    const raw = (tradeInInfo.model || '').trim();
                    if (!raw) return null;
                    const decoded = decodeTradeInModel(raw, { brand: tradeInInfo.brand, year: tradeInInfo.year });

                    // Apply manual overrides
                    const hpOverridden = decodeOverride.hp !== undefined;
                    const strokeOverridden = decodeOverride.stroke !== undefined;
                    const hp = hpOverridden ? decodeOverride.hp! : decoded.hp;
                    const stroke = strokeOverridden ? decodeOverride.stroke! : decoded.stroke;
                    const hpConfidence: Confidence = hpOverridden ? 'high' : decoded.hpConfidence;
                    const strokeConfidence: Confidence = strokeOverridden ? 'high' : decoded.strokeConfidence;

                    // Recompute warnings/suggestions to drop entries the user resolved
                    let warnings = decoded.warnings;
                    if (hpOverridden) {
                      warnings = warnings.filter((w) => !/HP|Multiple numbers|outside typical/i.test(w));
                    }
                    if (strokeOverridden) {
                      warnings = warnings.filter((w) => !/stroke/i.test(w));
                    }
                    let suggestions = decoded.suggestions;
                    if (hpOverridden) suggestions = [];

                    const hpReasons = hpOverridden
                      ? ['Manually set by you (click chip again to clear)']
                      : decoded.hpReasons;
                    const strokeReasons = strokeOverridden
                      ? ['Manually set by you (click chip again to clear)']
                      : decoded.strokeReasons;

                    if (!hp && !stroke && warnings.length === 0 && suggestions.length === 0) return null;

                    const chipClass = (conf: Confidence, base: 'hp' | 'stroke', overridden: boolean) => {
                      if (overridden) {
                        return base === 'hp'
                          ? 'bg-primary/10 text-primary border border-primary/30'
                          : 'bg-repower-navy-900/[0.06] text-repower-navy-900/75 border border-repower-navy-900/20';
                      }
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
                    const prefix = (conf: Confidence, overridden: boolean) =>
                      overridden ? '' : conf === 'high' ? '' : conf === 'medium' ? '~ ' : '? ';
                    const badgeFor = (conf: Confidence, overridden: boolean) => {
                      if (overridden) return { label: 'Manual', cls: 'bg-repower-navy-900/[0.06] text-repower-navy-900/75 border-repower-navy-900/20' };
                      if (conf === 'high') return { label: 'High', cls: 'bg-repower-cream text-repower-mercury-red border-repower-navy-900/10' };
                      if (conf === 'medium') return { label: 'Medium', cls: 'bg-repower-cream text-repower-gold border-repower-gold/30' };
                      if (conf === 'low') return { label: 'Low', cls: 'bg-repower-mercury-red/5 text-repower-mercury-red border-repower-mercury-red/20' };
                      return null;
                    };
                    const hpBadge = hp !== null ? badgeFor(hpConfidence, hpOverridden) : null;
                    const strokeBadge = stroke ? badgeFor(strokeConfidence, strokeOverridden) : null;
                    const hasReasons = hpReasons.length > 0 || strokeReasons.length > 0;

                    const baseHp = hp ?? 25;
                    const quickHps = Array.from(new Set(
                      [baseHp - 25, baseHp - 10, baseHp, baseHp + 10, baseHp + 25]
                        .map((n) => Math.max(2, Math.min(450, Math.round(n))))
                    ));

                    const showStrokePrompt = !stroke && strokeConfidence === 'low' && hp !== null;
                    const visibleWarnings = showStrokePrompt
                      ? warnings.filter((w) => !/stroke unclear/i.test(w))
                      : warnings;
                    return (
                      <div className="mt-1.5 space-y-1.5">
                        <div className="font-sans text-[11px] uppercase tracking-[0.14em] text-repower-navy-900/55">
                          Model read
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {hp !== null && (
                            <span className="inline-flex items-center gap-1">
                              <Popover onOpenChange={(open) => { if (open) setHpOverrideInput(String(hp)); }}>
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    aria-label="Override detected HP"
                                    title="Click to override detected HP"
                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors hover:brightness-95 ${chipClass(hpConfidence, 'hp', hpOverridden)}`}
                                  >
                                    {prefix(hpConfidence, hpOverridden)}{hp} HP
                                    <Pencil className="h-3 w-3 opacity-70" aria-hidden="true" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-3 space-y-2" align="start">
                                  <div className="text-xs font-medium">Override HP</div>
                                  <div className="flex items-center gap-1.5">
                                    <Input
                                      type="number"
                                      min={2}
                                      max={450}
                                      step="0.1"
                                      value={hpOverrideInput}
                                      onChange={(e) => setHpOverrideInput(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          const n = parseFloat(hpOverrideInput);
                                          if (!isNaN(n) && n >= 2 && n <= 450) commitHpOverride(n);
                                        }
                                      }}
                                      className="h-8 text-sm"
                                    />
                                    <Button
                                      type="button"
                                      size="sm"
                                      className="h-8"
                                      onClick={() => {
                                        const n = parseFloat(hpOverrideInput);
                                        if (!isNaN(n) && n >= 2 && n <= 450) commitHpOverride(n);
                                      }}
                                    >
                                      Apply
                                    </Button>
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {quickHps.map((q) => (
                                      <button
                                        key={q}
                                        type="button"
                                        onClick={() => commitHpOverride(q)}
                                        className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-xs hover:bg-muted"
                                      >
                                        {q}
                                      </button>
                                    ))}
                                  </div>
                                  {hpOverridden && (
                                    <button
                                      type="button"
                                      onClick={clearHpOverride}
                                      className="text-xs text-muted-foreground underline hover:text-foreground"
                                    >
                                      Clear override
                                    </button>
                                  )}
                                </PopoverContent>
                              </Popover>
                              {hpBadge && (
                                <span className={`inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide ${hpBadge.cls}`}>
                                  {hpBadge.label}
                                </span>
                              )}
                            </span>
                          )}
                          {(stroke || hp !== null) && (
                            <span className="inline-flex items-center gap-1">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    aria-label="Override detected stroke type"
                                    title="Click to override detected stroke"
                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors hover:brightness-95 ${chipClass(strokeConfidence, 'stroke', strokeOverridden)}`}
                                  >
                                    {stroke ? `${prefix(strokeConfidence, strokeOverridden)}${stroke}` : 'Set stroke'}
                                    <Pencil className="h-3 w-3 opacity-70" aria-hidden="true" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-2 space-y-1" align="start">
                                  <div className="text-xs font-medium px-1 pb-1">Override stroke</div>
                                  {(['4-Stroke', '2-Stroke', 'OptiMax'] as const).map((s) => (
                                    <button
                                      key={s}
                                      type="button"
                                      onClick={() => commitStrokeOverride(s)}
                                      className={`block w-full text-left rounded-sm px-2 py-1 text-sm hover:bg-muted ${stroke === s ? 'bg-muted font-medium' : ''}`}
                                    >
                                      {s}
                                    </button>
                                  ))}
                                  {strokeOverridden && (
                                    <button
                                      type="button"
                                      onClick={clearStrokeOverride}
                                      className="block w-full text-left rounded-sm px-2 py-1 text-xs text-muted-foreground underline hover:text-foreground"
                                    >
                                      Clear override
                                    </button>
                                  )}
                                </PopoverContent>
                              </Popover>
                              {strokeBadge && (
                                <span className={`inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide ${strokeBadge.cls}`}>
                                  {strokeBadge.label}
                                </span>
                              )}
                            </span>
                          )}
                          {(hp !== null || stroke) && (
                            <span className="self-center font-sans text-xs text-repower-navy-900/55">
                              {(hpOverridden || strokeOverridden) ? '(manual override)' : '(auto-detected, click to edit)'}
                            </span>
                          )}
                        </div>
                        {hasReasons && (
                          <div className="flex items-start gap-1.5 font-sans text-xs text-repower-navy-900/55">
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
                          <div key={i} className="flex items-start gap-1.5 font-sans text-xs text-repower-gold">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                            <span>{w}</span>
                          </div>
                        ))}
                        {suggestions.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span className="font-sans text-xs text-repower-navy-900/55">Did you mean:</span>
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
                <Label className="font-sans font-semibold text-[12px] uppercase tracking-[0.14em] text-repower-navy-900/70">
                  Motor Condition *
                </Label>
                <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 ${
                  showValidation && missingFields.condition ? 'ring-2 ring-repower-mercury-red rounded-sm p-2' : ''
                }`}>
                  {conditionOptions.map((option) => (
                    <motion.button
                      type="button"
                      key={option.value}
                      whileTap={{ scale: 0.98 }}
                      className={`cursor-pointer rounded-sm border bg-repower-paper p-4 text-center transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 ${
                        tradeInInfo.condition === option.value 
                          ? 'border-repower-navy-900 bg-repower-navy-900 text-white ring-2 ring-repower-navy-900/15'
                          : 'border-repower-navy-900/20 hover:border-repower-gold'
                      }`}
                      onClick={() => {
                        triggerHaptic('light');
                        setEstimate(null);
                        autoEstimateTriggered.current = false;
                        onTradeInChange({ ...tradeInInfo, condition: option.value as any });
                      }}
                    >
                      <div className={`font-display text-lg font-semibold ${tradeInInfo.condition === option.value ? 'text-white' : 'text-repower-navy-900'}`}>{option.label}</div>
                      <div className={`text-xs font-normal mt-1 ${tradeInInfo.condition === option.value ? 'text-repower-cream/85' : 'text-repower-navy-900/65'}`}>{option.description}</div>
                    </motion.button>
                  ))}
                </div>
                {showValidation && missingFields.condition && (
                  <p className="font-sans text-[12px] font-medium text-repower-mercury-red mt-1.5 inline-flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />Please select a condition</p>
                )}
              </div>

              {/* Collapsible optional fields */}
              <Collapsible open={moreDetailsOpen} onOpenChange={setMoreDetailsOpen}>
                <CollapsibleTrigger className="flex cursor-pointer items-center gap-2 font-sans text-sm font-semibold text-repower-navy-900/65 transition-colors hover:text-repower-navy-900">
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${moreDetailsOpen ? 'rotate-180' : ''}`} />
                  Add more details for a better estimate
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="trade-start-type" className="font-sans font-semibold text-[12px] uppercase tracking-[0.14em] text-repower-navy-900/70">
                        Start Type
                      </Label>
                      <Select 
                        value={tradeInInfo.startType || ''} 
                        onValueChange={(value) => onTradeInChange({ ...tradeInInfo, startType: value as TradeInInfo['startType'] })}
                      >
                        <SelectTrigger className="min-h-[48px] rounded-sm border-repower-navy-900/20 bg-repower-paper font-sans">
                          <SelectValue placeholder="Manual (default)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual" className="font-sans">Manual (Pull Start)</SelectItem>
                          <SelectItem value="electric" className="font-sans">Electric Start</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="trade-hours" className="font-sans font-semibold text-[12px] uppercase tracking-[0.14em] text-repower-navy-900/70">
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
                        className="min-h-[48px] rounded-sm border-repower-navy-900/20 bg-repower-paper font-sans"
                      />
                      <p className="font-sans text-xs text-repower-navy-900/40">Not sure? Leave blank—it's optional.</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="trade-serial" className="font-sans font-semibold text-[12px] uppercase tracking-[0.14em] text-repower-navy-900/70">
                        Serial Number
                      </Label>
                      <Input
                        id="trade-serial"
                        value={tradeInInfo.serialNumber}
                        onChange={(e) => onTradeInChange({ ...tradeInInfo, serialNumber: e.target.value })}
                        placeholder="Motor serial number"
                        className="min-h-[48px] rounded-sm border-repower-navy-900/20 bg-repower-paper font-sans"
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
                  className="mt-2 min-h-[52px] w-full gap-2 rounded-sm bg-repower-mercury-red font-sans text-[13px] font-bold uppercase tracking-[0.14em] text-repower-cream transition-colors hover:bg-repower-mercury-red-deep active:scale-[0.98]"
                >
                  <DollarSign className="w-5 h-5" />
                  Get My Estimate
                </Button>
              )}

              {/* Loading indicator */}
              {isLoading && (
                <div className="pt-4 flex items-center justify-center gap-3 text-repower-navy-900/65">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-sans text-base">Calculating your estimate...</span>
                </div>
              )}

              {/* Valuation service unavailable — honest failure, no stale fallback numbers */}
              {apiUnavailable && !isLoading && !estimate && (
                <Card className="p-6 bg-amber-50 border-amber-200 space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <h3 className="font-display text-lg font-semibold text-repower-navy-900">Live estimate temporarily unavailable</h3>
                      <p className="font-sans text-sm leading-relaxed text-repower-navy-900/70">
                        We couldn't reach our valuation service just now. Try again in a minute — or send us your motor details and we'll usually reply with a real number within one business day.
                      </p>
                      <p className="font-sans text-sm text-repower-navy-900/70">
                        Call <a href="tel:9053422153" className="underline font-medium">(905) 342-2153</a> or text <a href="sms:6479522153" className="underline font-medium">(647) 952-2153</a>
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGetEstimate}
                    className="min-h-[44px] w-full font-sans font-semibold"
                  >
                    Try again
                  </Button>
                </Card>
              )}

              {/* Database Estimate Result */}
              {estimate && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <Card className="rounded-sm border-repower-gold/30 bg-repower-paper p-6 shadow-none">
                    <div className="flex items-center gap-3 mb-4">
                      <CircleCheck className="w-6 h-6 text-repower-gold" />
                      <h3 className="font-display text-lg font-semibold text-repower-navy-900">Your estimated trade value</h3>
                      {/* Confidence badge */}
                      <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
                        estimate.confidence === 'high' ? 'bg-repower-gold/15 text-repower-navy-900' :
                        estimate.confidence === 'medium' ? 'bg-repower-cream text-repower-gold' :
                        'bg-repower-navy-900/[0.08] text-repower-navy-900/65'
                      }`}>
                        {estimate.confidence === 'high' ? 'High' : estimate.confidence === 'medium' ? 'Medium' : 'Low'} confidence
                      </span>
                    </div>
                    
                    <div className="text-center space-y-2">
                      <div className="font-display text-4xl font-bold tracking-[-0.025em] text-repower-navy-900">
                        <AnimatedPrice value={medianValue} prefix="$" duration={0.8} />
                      </div>
                      <div className="text-sm font-normal text-repower-navy-900/75">
                        Range: ${Math.round(estimate.low).toLocaleString()}, ${Math.round(estimate.high).toLocaleString()}
                      </div>
                    </div>

                    {/* HBW-specific extras, corrected private sale framing */}
                    {(estimate as HBWValuationResult).fromHBW && (estimate as HBWValuationResult).hstSavings > 0 && (
                      <div className="mt-4 space-y-3">
                        <div className="rounded-sm border border-repower-navy-900/10 bg-repower-cream p-3 font-sans text-sm leading-relaxed text-repower-navy-900/75">
                          {selectedMotorPrice ? (
                            <>
                              Private sale might get you <strong className="font-medium">${Math.round((estimate as HBWValuationResult).listingValue).toLocaleString()}</strong>, but you'd owe <strong className="font-medium">${Math.round((estimate as HBWValuationResult).hstSavings).toLocaleString()}</strong> more in HST on your new motor. Trading in puts <strong className="font-medium">${medianValue.toLocaleString()} + ${Math.round((estimate as HBWValuationResult).hstSavings).toLocaleString()} in savings</strong> in your pocket.
                            </>
                          ) : (
                            <>
                              When you trade in instead of selling privately, you save <strong className="font-medium">${Math.round((estimate as HBWValuationResult).hstSavings).toLocaleString()}</strong> in HST on your new motor, because you only pay tax on the difference.
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {(estimate as any).penaltyMessage && (
                      <div className="mt-4 p-3 bg-repower-cream border border-repower-gold/30 rounded-sm">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-repower-gold mt-0.5 flex-shrink-0" />
                          <p className="font-sans text-sm text-repower-gold">{(estimate as any).penaltyMessage}</p>
                        </div>
                      </div>
                    )}

                    {/* Warning: trade-in exceeds motor price */}
                    {selectedMotorPrice && medianValue > selectedMotorPrice && (
                      <div className="mt-4 p-3 bg-repower-cream border border-repower-gold/30 rounded-sm">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-repower-gold mt-0.5 flex-shrink-0" />
                          <p className="font-sans text-sm text-repower-gold">
                            Your trade-in value exceeds the cost of your selected motor. The credit will be capped at the motor price, no cash refunds on trade-ins.
                          </p>
                        </div>
                      </div>
                    )}
                  </Card>

                  {/* View Full Report, subtle text link */}
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
                        className="inline-flex items-center gap-1.5 font-sans text-sm text-repower-navy-900/55 underline underline-offset-2 transition-colors hover:text-repower-navy-900"
                      >
                        View detailed valuation report
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}

                  <Alert className="border-repower-navy-900/10 bg-repower-cream">
                    <Wrench className="w-4 h-4 text-repower-mercury-red" />
                    <AlertDescription className="font-sans text-sm text-repower-navy-900/75">
                      Final trade value confirmed after in-person inspection. This estimate helps you plan your budget.
                    </AlertDescription>
                  </Alert>

                  {/* Continue button */}
                  <Button
                    type="button"
                    onClick={() => onAutoAdvance?.()}
                    className="mt-4 min-h-[52px] w-full rounded-sm bg-repower-mercury-red font-sans text-[13px] font-bold uppercase tracking-[0.14em] text-repower-cream transition-colors hover:bg-repower-mercury-red-deep active:scale-[0.98]"
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
