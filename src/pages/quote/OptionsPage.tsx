import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuote } from '@/contexts/QuoteContext';
import { useMotorOptions, type MotorOption } from '@/hooks/useMotorOptions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, ChevronRight, CheckCircle2, Info } from 'lucide-react';
import { QuoteLayout } from '@/components/quote-builder/QuoteLayout';
import { toast } from 'sonner';
import { BatteryOptionPrompt, BATTERY_COST } from '@/components/quote-builder/BatteryOptionPrompt';
import { hasElectricStart } from '@/lib/motor-config-utils';
import { VisualOptionCard } from '@/components/options/VisualOptionCard';
import { OptionDetailsModal } from '@/components/options/OptionDetailsModal';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

// Categories that should display as visual cards when they have images
const VISUAL_CATEGORIES = ['electronics', 'accessory', 'maintenance'];

function isVisualOption(option: MotorOption): boolean {
  return VISUAL_CATEGORIES.includes(option.category) && !!option.image_url;
}

export default function OptionsPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useQuote();
  const [localSelectedIds, setLocalSelectedIds] = useState<Set<string>>(new Set());
  const hasNavigatedRef = useRef(false);
  const initializedRef = useRef(false);
  const { triggerHaptic } = useHapticFeedback();
  
  // Modal state for viewing option details
  const [detailsModalOption, setDetailsModalOption] = useState<MotorOption | null>(null);
  
  // Battery choice for electric start motors
  const isElectricStart = hasElectricStart(state.motor?.model || '');
  const [batteryChoice, setBatteryChoice] = useState<boolean | null>(
    state.looseMotorBattery?.wantsBattery ?? null
  );
  
  const { data: categorizedOptions, isLoading } = useMotorOptions(
    state.motor?.id,
    state.motor
  );

  // Split options into visual and list categories
  const splitOptions = useMemo(() => {
    if (!categorizedOptions) return null;
    
    const split = (options: MotorOption[]) => ({
      visual: options.filter(isVisualOption),
      list: options.filter(opt => !isVisualOption(opt)),
    });
    
    return {
      required: split(categorizedOptions.required),
      recommended: split(categorizedOptions.recommended),
      available: split(categorizedOptions.available),
    };
  }, [categorizedOptions]);

  // Initialize with required options and previously selected options (run once only)
  useEffect(() => {
    if (categorizedOptions && !initializedRef.current) {
      initializedRef.current = true;
      
      const initialIds = new Set<string>();
      
      // Always include required options
      categorizedOptions.required.forEach(opt => initialIds.add(opt.id));
      
      // Include previously selected options
      state.selectedOptions?.forEach(opt => initialIds.add(opt.optionId));
      
      // ONLY pre-select recommended items that are INCLUDED in price (e.g., fuel tanks)
      categorizedOptions.recommended.forEach(opt => {
        if (opt.is_included) {
          initialIds.add(opt.id);
        }
      });
      
      setLocalSelectedIds(initialIds);
    }
  }, [categorizedOptions]);

  // Redirect if no motor selected
  useEffect(() => {
    if (!state.motor) {
      navigate('/quote/motor-selection');
    }
  }, [state.motor, navigate]);

  // Auto-skip to purchase path if no options available AND no battery choice needed
  useEffect(() => {
    if (!isLoading && categorizedOptions && !hasNavigatedRef.current) {
      const hasOptions = 
        categorizedOptions.required.length > 0 ||
        categorizedOptions.recommended.length > 0 ||
        categorizedOptions.available.length > 0;
      
      // Only auto-skip if no options AND motor doesn't need battery question
      if (!hasOptions && !isElectricStart) {
        hasNavigatedRef.current = true;
        dispatch({ type: 'SET_SELECTED_OPTIONS', payload: [] });
        navigate('/quote/purchase-path');
      }
    }
  }, [isLoading, categorizedOptions, dispatch, navigate, isElectricStart]);

  // Sync local selections to QuoteContext for real-time bar updates
  useEffect(() => {
    if (!categorizedOptions) return;
    
    const allOptions = [
      ...categorizedOptions.required,
      ...categorizedOptions.recommended,
      ...categorizedOptions.available,
    ];

    const selectedOptions = allOptions
      .filter(opt => localSelectedIds.has(opt.id))
      .map(opt => ({
        optionId: opt.id,
        name: opt.name,
        price: opt.is_included ? 0 : (opt.price_override ?? opt.base_price),
        category: opt.category,
        assignmentType: opt.assignment_type,
        isIncluded: opt.is_included,
      }));

    dispatch({ type: 'SET_SELECTED_OPTIONS', payload: selectedOptions });
  }, [localSelectedIds, categorizedOptions, dispatch]);

  // Sync battery choice to context for real-time bar updates
  useEffect(() => {
    if (isElectricStart && batteryChoice !== null) {
      dispatch({ 
        type: 'SET_LOOSE_MOTOR_BATTERY', 
        payload: { wantsBattery: batteryChoice, batteryCost: BATTERY_COST } 
      });
    }
  }, [batteryChoice, isElectricStart, dispatch]);

  const toggleOption = (option: MotorOption) => {
    // Cannot deselect required options
    if (option.assignment_type === 'required' && localSelectedIds.has(option.id)) {
      toast.error('This option is required and cannot be removed');
      return;
    }

    triggerHaptic('addedToQuote');
    setLocalSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(option.id)) {
        newSet.delete(option.id);
      } else {
        newSet.add(option.id);
      }
      return newSet;
    });
  };

  // Block continue if electric start motor and no battery choice
  const canContinue = !isElectricStart || batteryChoice !== null;

  const handleContinue = () => {
    if (!categorizedOptions) return;
    
    // Block if battery choice required but not made
    if (isElectricStart && batteryChoice === null) {
      toast.error('Please select a battery option before continuing');
      return;
    }

    // Build selected options from all categories
    const allOptions = [
      ...categorizedOptions.required,
      ...categorizedOptions.recommended,
      ...categorizedOptions.available,
    ];

    const selectedOptions = allOptions
      .filter(opt => localSelectedIds.has(opt.id))
      .map(opt => ({
        optionId: opt.id,
        name: opt.name,
        price: opt.is_included ? 0 : (opt.price_override ?? opt.base_price),
        category: opt.category,
        assignmentType: opt.assignment_type,
        isIncluded: opt.is_included,
      }));

    dispatch({ type: 'SET_SELECTED_OPTIONS', payload: selectedOptions });
    
    // Save battery choice for electric start motors
    const batteryPayload = isElectricStart && batteryChoice !== null 
      ? { wantsBattery: batteryChoice, batteryCost: BATTERY_COST }
      : state.looseMotorBattery;
      
    if (isElectricStart && batteryChoice !== null) {
      dispatch({ 
        type: 'SET_LOOSE_MOTOR_BATTERY', 
        payload: { wantsBattery: batteryChoice, batteryCost: BATTERY_COST } 
      });
    }
    
    dispatch({ type: 'COMPLETE_STEP', payload: 2 });
    
    // CRITICAL: Force immediate save before navigation to prevent data loss
    try {
      const currentData = localStorage.getItem('quoteBuilder');
      if (currentData) {
        const parsed = JSON.parse(currentData);
        const updatedState = {
          ...parsed.state,
          selectedOptions,
          looseMotorBattery: batteryPayload,
          completedSteps: [...new Set([...(parsed.state.completedSteps || []), 2])]
        };
        localStorage.setItem('quoteBuilder', JSON.stringify({
          state: updatedState,
          timestamp: Date.now(),
          lastActivity: Date.now()
        }));
      }
    } catch (error) {
      console.error('Failed to force-save options:', error);
    }
    
    navigate('/quote/purchase-path');
  };

  const handleBack = () => {
    navigate('/quote/motor-selection');
  };

  const calculateTotal = () => {
    if (!categorizedOptions) return 0;
    
    const allOptions = [
      ...categorizedOptions.required,
      ...categorizedOptions.recommended,
      ...categorizedOptions.available,
    ];

    return allOptions
      .filter(opt => localSelectedIds.has(opt.id))
      .reduce((sum, opt) => {
        const price = opt.is_included ? 0 : (opt.price_override ?? opt.base_price);
        return sum + price;
      }, 0);
  };

  if (!state.motor) {
    return null;
  }

  if (isLoading) {
    return (
      <QuoteLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">Loading motor options...</div>
        </div>
      </QuoteLayout>
    );
  }

  const hasOptions = categorizedOptions && (
    categorizedOptions.required.length > 0 ||
    categorizedOptions.recommended.length > 0 ||
    categorizedOptions.available.length > 0
  );

  const shouldShowPage = hasOptions || isElectricStart;

  if (!shouldShowPage) {
    return null;
  }

  const optionsTotal = calculateTotal();

  return (
    <QuoteLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl pb-32">
        {/* Compact Header with Mobile Back */}
        <div className="mb-4">
          {/* Mobile Back Button - Premium Style */}
          <button 
            onClick={handleBack}
            className="md:hidden flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors active:scale-95 touch-action-manipulation min-h-[44px] mb-2"
            aria-label="Back to motor selection"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <p className="text-muted-foreground">
            Options for your {state.motor?.model || 'motor'}
          </p>
        </div>

        {/* Required Options */}
        {splitOptions && splitOptions.required.list.length > 0 && (
          <OptionsSection
            title="Required Items"
            badge={<Badge variant="destructive">Must Include</Badge>}
          >
            <div className="space-y-3">
              {splitOptions.required.list.map(option => (
                <OptionCard
                  key={option.id}
                  option={option}
                  isSelected={true}
                  onToggle={() => {}}
                  onViewDetails={() => setDetailsModalOption(option)}
                  disabled={true}
                />
              ))}
            </div>
          </OptionsSection>
        )}

        {/* Battery Requirement for Electric Start Motors */}
        {isElectricStart && (
          <OptionsSection
            title="Starting Battery"
            badge={<Badge variant="destructive">Required Answer</Badge>}
          >
            <BatteryOptionPrompt 
              onSelect={setBatteryChoice}
              selectedOption={batteryChoice}
              batteryCost={BATTERY_COST}
            />
            {batteryChoice === null && (
              <p className="text-sm text-destructive mt-2">
                Please select an option before continuing
              </p>
            )}
          </OptionsSection>
        )}

        {/* Recommended Options */}
        {splitOptions && (splitOptions.recommended.visual.length > 0 || splitOptions.recommended.list.length > 0) && (
          <OptionsSection
            title="Recommended Add-Ons"
            badge={<Badge>Pre-selected</Badge>}
          >
            {/* Visual Grid */}
            {splitOptions.recommended.visual.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-4">
                {splitOptions.recommended.visual.map(option => (
                  <VisualOptionCard
                    key={option.id}
                    option={option}
                    isSelected={localSelectedIds.has(option.id)}
                    onToggle={() => toggleOption(option)}
                    onViewDetails={() => setDetailsModalOption(option)}
                    isRecommended={true}
                  />
                ))}
              </div>
            )}
            
            {/* List */}
            {splitOptions.recommended.list.length > 0 && (
              <div className="space-y-3">
                {splitOptions.recommended.list.map(option => (
                  <OptionCard
                    key={option.id}
                    option={option}
                    isSelected={localSelectedIds.has(option.id)}
                    onToggle={() => toggleOption(option)}
                    onViewDetails={() => setDetailsModalOption(option)}
                  />
                ))}
              </div>
            )}
          </OptionsSection>
        )}

        {/* Available Options */}
        {splitOptions && (splitOptions.available.visual.length > 0 || splitOptions.available.list.length > 0) && (
          <OptionsSection title="Available Options">
            {/* Visual Grid */}
            {splitOptions.available.visual.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-4">
                {splitOptions.available.visual.map(option => (
                  <VisualOptionCard
                    key={option.id}
                    option={option}
                    isSelected={localSelectedIds.has(option.id)}
                    onToggle={() => toggleOption(option)}
                    onViewDetails={() => setDetailsModalOption(option)}
                  />
                ))}
              </div>
            )}
            
            {/* List */}
            {splitOptions.available.list.length > 0 && (
              <div className="space-y-3">
                {splitOptions.available.list.map(option => (
                  <OptionCard
                    key={option.id}
                    option={option}
                    isSelected={localSelectedIds.has(option.id)}
                    onToggle={() => toggleOption(option)}
                    onViewDetails={() => setDetailsModalOption(option)}
                  />
                ))}
              </div>
            )}
          </OptionsSection>
        )}

        {/* Sticky Footer */}
        <div className="hidden md:block fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t py-4 z-50">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">Options Total</p>
                <p className="text-2xl font-bold">
                  {optionsTotal === 0 ? 'Included' : `+$${optionsTotal.toFixed(2)}`}
                </p>
              </div>

              <Button onClick={handleContinue} disabled={!canContinue}>
                Continue
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Details Modal */}
        <OptionDetailsModal
          option={detailsModalOption}
          isOpen={!!detailsModalOption}
          onClose={() => setDetailsModalOption(null)}
          isSelected={detailsModalOption ? localSelectedIds.has(detailsModalOption.id) : false}
          onToggle={() => detailsModalOption && toggleOption(detailsModalOption)}
          disabled={detailsModalOption?.assignment_type === 'required'}
        />
      </div>
    </QuoteLayout>
  );
}

// Section wrapper component
interface OptionsSectionProps {
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}

function OptionsSection({ title, badge, children }: OptionsSectionProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        {badge}
      </div>
      {children}
    </div>
  );
}

// Option Card Component (compact list style)
interface OptionCardProps {
  option: MotorOption;
  isSelected: boolean;
  onToggle: () => void;
  onViewDetails: () => void;
  disabled?: boolean;
}

function OptionCard({ option, isSelected, onToggle, onViewDetails, disabled }: OptionCardProps) {
  const effectivePrice = option.is_included ? 0 : (option.price_override ?? option.base_price);

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewDetails();
  };

  return (
    <Card 
      className={`cursor-pointer transition-all ${
        isSelected ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/50'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      onClick={disabled ? undefined : onToggle}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {!disabled && (
            <div className="pt-1">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggle()}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          {disabled && (
            <div className="pt-1">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold">{option.name}</h3>
                {option.short_description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{option.short_description}</p>
                )}
                {option.part_number && (
                  <p className="text-xs text-muted-foreground mt-1">Part: {option.part_number}</p>
                )}
              </div>
              
              <div className="text-right shrink-0">
                {option.is_included ? (
                  <Badge variant="secondary">Included</Badge>
                ) : (
                  <p className="text-lg font-bold">
                    ${effectivePrice.toFixed(2)}
                  </p>
                )}
                {option.msrp && !option.is_included && option.msrp > effectivePrice && (
                  <p className="text-xs text-muted-foreground line-through">
                    ${option.msrp.toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            {/* Features preview and View Details button */}
            <div className="flex items-center justify-between mt-2">
              {option.features && option.features.length > 0 ? (
                <p className="text-xs text-muted-foreground line-clamp-1 flex-1">
                  {option.features.slice(0, 3).join(' • ')}
                </p>
              ) : (
                <div />
              )}
              
              <button
                onClick={handleDetailsClick}
                className="text-xs text-primary hover:underline flex items-center gap-1 ml-2 shrink-0 min-h-[44px] px-2 -mr-2"
              >
                <Info className="w-3 h-3" />
                Details
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
