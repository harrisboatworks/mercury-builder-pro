import { Progress } from "@/components/ui/progress";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: Record<number, string>;
  completedSteps: number[];
}

export function FormProgressIndicator({
  currentStep,
  totalSteps,
  stepTitles,
  completedSteps,
}: FormProgressIndicatorProps) {
  const progress = (completedSteps.length / totalSteps) * 100;

  return (
    <div className="space-y-4 mb-8">
      {/* Mobile-friendly compact progress */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-xs text-muted-foreground">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">
          {stepTitles[currentStep]}
        </p>
      </div>

      {/* Desktop full progress with all steps */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-foreground">Financing Application</h1>
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}% Complete
          </span>
        </div>
        
        <Progress value={progress} className="h-2 mb-4" />
        
        {/* Step indicators */}
        <div className="grid grid-cols-7 gap-2 text-xs">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
            const isCompleted = completedSteps.includes(step);
            const isCurrent = step === currentStep;
            
            return (
              <div
                key={step}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                  isCurrent && "bg-primary/10 border border-primary/20",
                  isCompleted && "opacity-70"
                )}
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center font-semibold transition-all",
                    isCurrent && "bg-primary text-primary-foreground",
                    isCompleted && "bg-green-500 text-white",
                    !isCurrent && !isCompleted && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="w-3 h-3" /> : step}
                </div>
                <span className={cn(
                  "text-center leading-tight",
                  isCurrent ? "text-primary font-medium" : "text-muted-foreground"
                )}>
                  {stepTitles[step]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
