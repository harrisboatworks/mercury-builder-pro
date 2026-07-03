import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuote } from '@/contexts/QuoteContext';
import { useMotorOptions, type MotorOption } from '@/hooks/useMotorOptions';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { QuoteLayout } from '@/components/quote-builder/QuoteLayout';
import { toast } from 'sonner';
import { BatteryOptionPrompt, BATTERY_COST } from '@/components/quote-builder/BatteryOptionPrompt';
import { hasElectricStart } from '@/lib/motor-config-utils';
import { VisualOptionCard } from '@/components/options/VisualOptionCard';
import { OptionDetailsModal } from '@/components/options/OptionDetailsModal';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { QuotePageShell } from '@/components/quote-builder/redesign/QuotePageShell';
import { QuoteStepNav } from '@/components/quote-builder/redesign/QuoteStepNav';
import { QuoteRadioTile } from '@/components/quote-builder/redesign/QuoteRadioTile';
import { QuoteCheckbox } from '@/components/quote-builder/redesign/QuoteCheckbox';

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

  const [detailsModalOption, setDetailsModalOption] = useState<MotorOption | null>(null);

  const isElectricStart = hasElectricStart(state.motor?.model || '');
  const [batteryChoice, setBatteryChoice] = useState<boolean | null>(
    state.looseMotorBattery?.decision === 'later'
      ? null
      : state.looseMotorBattery?.wantsBattery ?? null
  );

  const { data: categorizedOptions, isLoading } = useMotorOptions(
    state.motor?.id,
    state.motor
  );

  const splitOptions = useMemo(() => {
    if (!categorizedOptions) return null;
    const split = (options: MotorOption[]) => ({
      visual: options.filter(isVisualOption),
      list: options.filter((opt) => !isVisualOption(opt)),
    });
    return {
      required: split(categorizedOptions.required),
      recommended: split(categorizedOptions.recommended),
      available: split(categorizedOptions.available),
    };
  }, [categorizedOptions]);

  useEffect(() => {
    if (categorizedOptions && !initializedRef.current) {
      initializedRef.current = true;
      const initialIds = new Set<string>();
      categorizedOptions.required.forEach((opt) => initialIds.add(opt.id));
      state.selectedOptions?.forEach((opt) => initialIds.add(opt.optionId));
      categorizedOptions.recommended.forEach((opt) => {
        if (opt.is_included) initialIds.add(opt.id);
      });
      setLocalSelectedIds(initialIds);
    }
  }, [categorizedOptions]);

  useEffect(() => {
    if (!state.motor) navigate('/quote/motor-selection');
  }, [state.motor, navigate]);

  useEffect(() => {
    if (!isLoading && categorizedOptions && !hasNavigatedRef.current) {
      const hasOptions =
        categorizedOptions.required.length > 0 ||
        categorizedOptions.recommended.length > 0 ||
        categorizedOptions.available.length > 0;
      if (!hasOptions && !isElectricStart) {
        hasNavigatedRef.current = true;
        dispatch({ type: 'SET_SELECTED_OPTIONS', payload: [] });
        navigate('/quote/purchase-path');
      }
    }
  }, [isLoading, categorizedOptions, dispatch, navigate, isElectricStart]);

  useEffect(() => {
    if (!categorizedOptions) return;
    const allOptions = [
      ...categorizedOptions.required,
      ...categorizedOptions.recommended,
      ...categorizedOptions.available,
    ];
    const selectedOptions = allOptions
      .filter((opt) => localSelectedIds.has(opt.id))
      .map((opt) => ({
        optionId: opt.id,
        name: opt.name,
        price: opt.is_included ? 0 : (opt.price_override ?? opt.base_price),
        category: opt.category,
        assignmentType: opt.assignment_type,
        isIncluded: opt.is_included,
      }));
    dispatch({ type: 'SET_SELECTED_OPTIONS', payload: selectedOptions });
  }, [localSelectedIds, categorizedOptions, dispatch]);

  useEffect(() => {
    if (isElectricStart) {
      dispatch({
        type: 'SET_LOOSE_MOTOR_BATTERY',
        payload: {
          wantsBattery: batteryChoice === true,
          batteryCost: BATTERY_COST,
          decision: batteryChoice === true ? 'add' : batteryChoice === false ? 'own' : 'later',
        },
      });
    }
  }, [batteryChoice, isElectricStart, dispatch]);

  const toggleOption = (option: MotorOption) => {
    if (option.assignment_type === 'required' && localSelectedIds.has(option.id)) {
      toast.error('This option is required and cannot be removed');
      return;
    }
    triggerHaptic('addedToQuote');
    setLocalSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(option.id)) newSet.delete(option.id);
      else newSet.add(option.id);
      return newSet;
    });
  };

  const canContinue = true;

  const handleContinue = () => {
    if (!categorizedOptions) return;
    const allOptions = [
      ...categorizedOptions.required,
      ...categorizedOptions.recommended,
      ...categorizedOptions.available,
    ];
    const selectedOptions = allOptions
      .filter((opt) => localSelectedIds.has(opt.id))
      .map((opt) => ({
        optionId: opt.id,
        name: opt.name,
        price: opt.is_included ? 0 : (opt.price_override ?? opt.base_price),
        category: opt.category,
        assignmentType: opt.assignment_type,
        isIncluded: opt.is_included,
      }));
    dispatch({ type: 'SET_SELECTED_OPTIONS', payload: selectedOptions });
    const batteryPayload = isElectricStart
      ? {
          wantsBattery: batteryChoice === true,
          batteryCost: BATTERY_COST,
          decision: (batteryChoice === true ? 'add' : batteryChoice === false ? 'own' : 'later') as 'add' | 'later' | 'own',
        }
      : state.looseMotorBattery;
    if (isElectricStart) {
      dispatch({
        type: 'SET_LOOSE_MOTOR_BATTERY',
        payload: batteryPayload,
      });
    }
    dispatch({ type: 'COMPLETE_STEP', payload: 2 });
    try {
      const currentData = localStorage.getItem('quoteBuilder');
      if (currentData) {
        const parsed = JSON.parse(currentData);
        const updatedState = {
          ...parsed.state,
          selectedOptions,
          looseMotorBattery: batteryPayload,
          completedSteps: [...new Set([...(parsed.state.completedSteps || []), 2])],
        };
        localStorage.setItem('quoteBuilder', JSON.stringify({
          state: updatedState,
          timestamp: Date.now(),
          lastActivity: Date.now(),
        }));
      }
    } catch (error) {
      console.error('Failed to force-save options:', error);
    }
    navigate('/quote/purchase-path');
  };

  const handleBack = () => navigate('/quote/motor-selection');

  const calculateTotal = () => {
    if (!categorizedOptions) return 0;
    const allOptions = [
      ...categorizedOptions.required,
      ...categorizedOptions.recommended,
      ...categorizedOptions.available,
    ];
    return allOptions
      .filter((opt) => localSelectedIds.has(opt.id))
      .reduce((sum, opt) => sum + (opt.is_included ? 0 : (opt.price_override ?? opt.base_price)), 0);
  };

  if (!state.motor) return null;

  if (isLoading) {
    return (
      <QuoteLayout>
        <QuotePageShell eyebrow="STEP 2 · OPTIONS">
          <div className="text-center py-12 text-repower-navy-900/60">Loading motor options...</div>
        </QuotePageShell>
      </QuoteLayout>
    );
  }

  const hasOptions = categorizedOptions && (
    categorizedOptions.required.length > 0 ||
    categorizedOptions.recommended.length > 0 ||
    categorizedOptions.available.length > 0
  );

  const shouldShowPage = hasOptions || isElectricStart;
  if (!shouldShowPage) return null;

  const optionsTotal = calculateTotal();

  const totalReadout = (
    <div className="text-center md:text-right">
      <p className="font-sans text-[11px] uppercase tracking-[0.14em] text-repower-navy-900/55">Options Total</p>
      <p className="font-display font-bold text-repower-navy-900 text-[22px] leading-tight">
        {optionsTotal === 0 ? 'Included' : `+$${optionsTotal.toFixed(2)}`}
      </p>
    </div>
  );

  return (
    <QuoteLayout>
      <QuotePageShell
        eyebrow="STEP 2 · OPTIONS"
        title={`Options for your ${state.motor?.model || 'motor'}`}
      >
        {/* Required Options */}
        {splitOptions && splitOptions.required.list.length > 0 && (
          <OptionsSection
            title="Required Items"
            badge={<Badge variant="destructive">Must Include</Badge>}
          >
            <div className="space-y-3">
              {splitOptions.required.list.map((option) => (
                <OptionTile
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

        {/* Battery */}
        {isElectricStart && (
          <OptionsSection
            title="Starting Battery"
            badge={<Badge variant="secondary">Optional</Badge>}
          >
            <BatteryOptionPrompt
              onSelect={setBatteryChoice}
              selectedOption={batteryChoice}
              batteryCost={BATTERY_COST}
            />
          </OptionsSection>
        )}

        {/* Recommended */}
        {splitOptions && (splitOptions.recommended.visual.length > 0 || splitOptions.recommended.list.length > 0) && (
          <OptionsSection
            title="Recommended Add-Ons"
            badge={
              [...categorizedOptions!.recommended].some((opt) => opt.is_included)
                ? <Badge>Pre-selected</Badge>
                : <Badge variant="secondary">Suggested</Badge>
            }
          >
            {splitOptions.recommended.visual.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-4">
                {splitOptions.recommended.visual.map((option) => (
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
            {splitOptions.recommended.list.length > 0 && (
              <div className="space-y-3">
                {splitOptions.recommended.list.map((option) => (
                  <OptionTile
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

        {/* Available */}
        {splitOptions && (splitOptions.available.visual.length > 0 || splitOptions.available.list.length > 0) && (
          <OptionsSection title="Available Options">
            {splitOptions.available.visual.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-4">
                {splitOptions.available.visual.map((option) => (
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
            {splitOptions.available.list.length > 0 && (
              <div className="space-y-3">
                {splitOptions.available.list.map((option) => (
                  <OptionTile
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

        <QuoteStepNav
          onBack={handleBack}
          onContinue={handleContinue}
          continueDisabled={!canContinue}
          rightSlot={totalReadout}
        />

        <OptionDetailsModal
          option={detailsModalOption}
          isOpen={!!detailsModalOption}
          onClose={() => setDetailsModalOption(null)}
          isSelected={detailsModalOption ? localSelectedIds.has(detailsModalOption.id) : false}
          onToggle={() => detailsModalOption && toggleOption(detailsModalOption)}
          disabled={detailsModalOption?.assignment_type === 'required'}
        />
      </QuotePageShell>
    </QuoteLayout>
  );
}

interface OptionsSectionProps {
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}

function OptionsSection({ title, badge, children }: OptionsSectionProps) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-repower-navy-900/70">
          {title}
        </h2>
        {badge}
        <div className="flex-1 h-px bg-repower-navy-900/10" aria-hidden />
      </div>
      {children}
    </section>
  );
}

interface OptionTileProps {
  option: MotorOption;
  isSelected: boolean;
  onToggle: () => void;
  onViewDetails: () => void;
  disabled?: boolean;
}

function OptionTile({ option, isSelected, onToggle, onViewDetails, disabled }: OptionTileProps) {
  const effectivePrice = option.is_included ? 0 : (option.price_override ?? option.base_price);

  const priceTag = option.is_included ? (
    <span className="font-sans text-[12px] font-semibold uppercase tracking-[0.12em] text-repower-navy-900/60">Included</span>
  ) : (
    <span>${effectivePrice.toFixed(2)}</span>
  );

  return (
    <QuoteRadioTile
      multi
      selected={isSelected}
      onClick={disabled ? undefined : onToggle}
      disabled={disabled}
      icon={
        <QuoteCheckbox
          checked={isSelected}
          onCheckedChange={() => !disabled && onToggle()}
          onClick={(e) => e.stopPropagation()}
          disabled={disabled}
        />
      }
      label={option.name}
      description={
        <>
          {option.short_description && <span className="block">{option.short_description}</span>}
          {option.part_number && (
            <span className="block text-[12px] text-repower-navy-900/45 mt-0.5">Part: {option.part_number}</span>
          )}
        </>
      }
      priceTag={
        <div className="flex flex-col items-end gap-1">
          <div className="font-display font-bold text-[18px]">{priceTag}</div>
          {option.msrp && !option.is_included && option.msrp > effectivePrice && (
            <div className="font-sans text-[11px] text-repower-navy-900/45 line-through">
              ${option.msrp.toFixed(2)}
            </div>
          )}
        </div>
      }
    >
      <div className="flex items-center justify-between mt-3 gap-2">
        {option.features && option.features.length > 0 ? (
          <p className="text-xs text-repower-navy-900/55 line-clamp-1 flex-1 font-sans">
            {option.features.slice(0, 3).join(' • ')}
          </p>
        ) : (
          <div />
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails();
          }}
          className="text-xs text-repower-mercury-red hover:underline flex items-center gap-1 ml-2 shrink-0 font-sans font-semibold uppercase tracking-[0.1em]"
        >
          <Info className="w-3 h-3" />
          Details
        </button>
      </div>
    </QuoteRadioTile>
  );
}
