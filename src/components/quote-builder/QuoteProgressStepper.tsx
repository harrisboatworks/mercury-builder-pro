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
  {
    id: 1,
    label: 'Motor Selection',
    shortLabel: 'Motor',
    path: '/quote/motor-selection',
  },
  {
    id: 2,
    label: 'Options',
    shortLabel: 'Options',
    path: '/quote/options',
  },
  {
    id: 3,
    label: 'Purchase Path',
    shortLabel: 'Path',
    path: '/quote/purchase-path',
  },
  {
    id: 4,
    label: 'Trade-In',
    shortLabel: 'Trade-In',
    path: '/quote/trade-in',
    isConditional: true,
    condition: (state) => state.hasTradein,
  },
  {
    id: 5,
    label: 'Fuel Tank',
    shortLabel: 'Fuel',
    path: '/quote/fuel-tank',
    isConditional: true,
    condition: (state) => state.purchasePath === 'loose' && state.motor?.isTiller,
  },
  {
    id: 6,
    label: 'Installation',
    shortLabel: 'Install',
    path: '/quote/installation',
    isConditional: true,
    condition: (state) => state.purchasePath === 'installed',
  },
  {
    id: 7,
    label: 'Summary',
    shortLabel: 'Summary',
    path: '/quote/summary',
  },
];

export const QuoteProgressStepper = () => {
  const { state, isStepAccessible } = useQuote();
  const navigate = useNavigate();
  const location = useLocation();

  // Filter steps based on conditions
  const visibleSteps = allSteps.filter(step => {
    if (step.isConditional && step.condition) {
      return step.condition(state);
    }
    return true;
  });

  const currentStepIndex = visibleSteps.findIndex(step => location.pathname === step.path);
  const isCurrentStep = (index: number) => index === currentStepIndex;
  const isCompleted = (index: number) => index < currentStepIndex;
  const isAccessible = (step: Step, index: number) => {
    // Always allow navigation to completed steps
    if (isCompleted(index)) return true;
    // Allow current step
    if (isCurrentStep(index)) return true;
    // Check if step is accessible based on context logic
    return isStepAccessible(step.id);
  };

  const handleStepClick = (step: Step, index: number) => {
    if (isAccessible(step, index)) {
      navigate(step.path);
    }
  };

  return (
    <div className="bg-background border-b border-border">
      <div className="container mx-auto px-4 py-4">
        {/* Desktop Stepper */}
        <div className="hidden md:flex items-center justify-between">
          {visibleSteps.map((step, index) => {
            const completed = isCompleted(index);
            const current = isCurrentStep(index);
            const accessible = isAccessible(step, index);
            const showConnector = index < visibleSteps.length - 1;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <button
                  onClick={() => handleStepClick(step, index)}
                  disabled={!accessible}
                  className={cn(
                    "flex items-center gap-3 transition-all duration-200",
                    accessible ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                  )}
                >
                  {/* Step Circle */}
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200",
                      completed && "bg-primary border-primary text-primary-foreground",
                      current && !completed && "border-primary text-primary bg-primary/10",
                      !completed && !current && "border-border text-muted-foreground bg-background"
                    )}
                  >
                    {completed ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>

                  {/* Step Label */}
                  <span
                    className={cn(
                      "text-sm font-medium transition-colors duration-200 whitespace-nowrap",
                      current && "text-foreground",
                      completed && "text-muted-foreground hover:text-foreground",
                      !completed && !current && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </button>

                {/* Connector Line */}
                {showConnector && (
                  <div className="flex-1 h-[2px] mx-4 bg-border">
                    <div
                      className={cn(
                        "h-full transition-all duration-300",
                        completed ? "bg-primary" : "bg-transparent"
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile Stepper */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              Step {currentStepIndex + 1} of {visibleSteps.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {visibleSteps[currentStepIndex]?.label || 'Loading...'}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentStepIndex + 1) / visibleSteps.length) * 100}%` }}
            />
          </div>

          {/* Mobile Step Dots */}
          <div className="flex items-center justify-center gap-2 mt-3 keep-flex">
            {visibleSteps.map((step, index) => {
              const completed = isCompleted(index);
              const current = isCurrentStep(index);

              return (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(step, index)}
                  disabled={!isAccessible(step, index)}
                  className={cn(
                    "w-2 h-2 !min-w-0 !min-h-0 rounded-full transition-all duration-200",
                    completed && "bg-primary w-2.5 h-2.5",
                    current && !completed && "bg-primary w-3 h-3",
                    !completed && !current && "bg-muted"
                  )}
                  aria-label={step.label}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
