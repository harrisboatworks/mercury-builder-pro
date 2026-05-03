import { useNavigate, useLocation } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useQuote } from '@/contexts/QuoteContext';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  label: string;
  shortLabel: string;
  path: string;
  isConditional?: boolean;
  condition?: (state: any) => boolean;
}

const allSteps: Step[] = [
  { id: 1, label: 'Motor Selection', shortLabel: 'Motor', path: '/quote/motor-selection' },
  { id: 2, label: 'Options', shortLabel: 'Options', path: '/quote/options' },
  { id: 3, label: 'Purchase Path', shortLabel: 'Path', path: '/quote/purchase-path' },
  { id: 4, label: 'Boat Info', shortLabel: 'Boat', path: '/quote/boat-info' },
  {
    id: 5,
    label: 'Trade-In',
    shortLabel: 'Trade-In',
    path: '/quote/trade-in',
    isConditional: true,
    condition: (state) => state.hasTradein,
  },
  {
    id: 6,
    label: 'Fuel Tank',
    shortLabel: 'Fuel',
    path: '/quote/fuel-tank',
    isConditional: true,
    condition: (state) => state.purchasePath === 'loose' && state.motor?.isTiller,
  },
  {
    id: 7,
    label: 'Installation',
    shortLabel: 'Install',
    path: '/quote/installation',
    isConditional: true,
    condition: (state) => state.purchasePath === 'installed',
  },
  { id: 8, label: 'Promo', shortLabel: 'Promo', path: '/quote/promo-selection' },
  { id: 9, label: 'Summary', shortLabel: 'Summary', path: '/quote/summary' },
];

export const QuoteProgressStepper = () => {
  const { state, isStepAccessible } = useQuote();
  const navigate = useNavigate();
  const location = useLocation();

  const visibleSteps = allSteps.filter((step) => {
    if (step.isConditional && step.condition) return step.condition(state);
    return true;
  });

  const currentStepIndex = visibleSteps.findIndex((step) => location.pathname === step.path);
  const safeIndex = currentStepIndex < 0 ? 0 : currentStepIndex;
  const isCurrentStep = (index: number) => index === currentStepIndex;
  const isCompleted = (index: number) => index < currentStepIndex;
  const isAccessible = (step: Step, index: number) => {
    if (isCompleted(index)) return true;
    if (isCurrentStep(index)) return true;
    return isStepAccessible(step.id);
  };

  const handleStepClick = (step: Step, index: number) => {
    if (isAccessible(step, index)) navigate(step.path);
  };

  const currentLabel = visibleSteps[safeIndex]?.label || '';
  const progressPct = ((safeIndex + 1) / visibleSteps.length) * 100;

  return (
    <div className="bg-repower-paper border-y border-repower-navy-900/10">
      <div className="container mx-auto px-6 py-4">
        {/* Desktop */}
        <div className="hidden md:flex items-center justify-between">
          {visibleSteps.map((step, index) => {
            const completed = isCompleted(index);
            const current = isCurrentStep(index);
            const accessible = isAccessible(step, index);
            const showConnector = index < visibleSteps.length - 1;
            const nextCompleted = isCompleted(index + 1);

            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <button
                  onClick={() => handleStepClick(step, index)}
                  disabled={!accessible}
                  className={cn(
                    'flex flex-col items-center gap-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-repower-gold/40 rounded',
                    accessible ? 'cursor-pointer' : 'cursor-not-allowed'
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center justify-center w-9 h-9 rounded-full border-2 transition-colors duration-200',
                      current && 'bg-repower-navy-900 border-repower-navy-900 text-repower-cream',
                      completed && 'bg-transparent border-repower-gold text-repower-gold',
                      !current && !completed && 'bg-transparent border-repower-navy-900/20 text-repower-navy-900/30'
                    )}
                  >
                    {completed ? (
                      <Check className="w-4 h-4" strokeWidth={2.5} />
                    ) : (
                      <span className="font-sans text-[13px] font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'font-sans text-[11px] font-semibold uppercase tracking-[0.12em] whitespace-nowrap transition-colors duration-200',
                      current && 'text-repower-navy-900',
                      completed && 'text-repower-navy-900/60',
                      !current && !completed && 'text-repower-navy-900/30'
                    )}
                  >
                    {step.shortLabel}
                  </span>
                </button>
                {showConnector && (
                  <div
                    className={cn(
                      'flex-1 h-px mx-3 transition-colors duration-200',
                      completed && nextCompleted ? 'bg-repower-gold' : 'bg-repower-navy-900/10'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile: compact label + progress bar */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="font-sans text-[12px] font-semibold uppercase tracking-[0.12em] text-repower-navy-900">
              Step {safeIndex + 1} of {visibleSteps.length}
            </span>
            <span className="font-sans text-[12px] text-repower-navy-900/60 truncate ml-3">
              {currentLabel}
            </span>
          </div>
          <div className="w-full h-[2px] bg-repower-navy-900/10 overflow-hidden">
            <div
              className="h-full bg-repower-navy-900 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
