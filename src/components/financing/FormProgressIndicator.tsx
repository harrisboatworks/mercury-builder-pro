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
  const progress = Math.max(
    (completedSteps.length / totalSteps) * 100,
    ((currentStep - 1) / totalSteps) * 100,
  );

  return (
    <>
      <div className="rounded-sm border border-repower-navy-900/10 bg-white p-4 shadow-sm lg:hidden">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <span className="font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-repower-mercury-red">
              Step {currentStep} of {totalSteps}
            </span>
            <p className="mt-1 font-display text-lg font-semibold text-repower-navy-900">
              {stepTitles[currentStep]}
            </p>
          </div>
          <span className="font-sans text-[11px] font-semibold text-repower-navy-900/50">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-1.5 overflow-hidden bg-repower-navy-900/10" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-repower-gold transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <aside className="sticky top-6 hidden overflow-hidden rounded-sm bg-repower-navy-900 text-white lg:block">
        <div className="border-b border-white/10 px-6 py-6">
          <p className="font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-repower-gold">
            Your progress
          </p>
          <div className="mt-2 flex items-end justify-between">
            <p className="font-display text-2xl font-semibold">Step {currentStep}</p>
            <span className="font-sans text-[11px] text-white/55">{Math.round(progress)}%</span>
          </div>
          <div className="mt-4 h-1 overflow-hidden bg-white/10" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-repower-gold transition-[width] duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <ol className="px-4 py-4">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
            const isCompleted = completedSteps.includes(step);
            const isCurrent = step === currentStep;
            
            return (
              <li
                key={step}
                className={`flex flex-row items-start gap-3 border-l-2 px-3 py-3 transition-colors ${
                  isCurrent
                    ? "border-repower-gold bg-white/[0.07]"
                    : "border-transparent"
                }`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-sans text-[11px] font-bold",
                    isCurrent && "border-repower-gold bg-repower-gold text-repower-navy-900",
                    isCompleted && !isCurrent && "border-white/35 bg-white/10 text-white",
                    !isCurrent && !isCompleted && "border-white/15 text-white/45",
                  )}
                >
                  {isCompleted && !isCurrent ? <Check className="h-3.5 w-3.5" /> : step}
                </div>
                <span className={cn(
                  "font-sans text-[13px] leading-tight",
                  isCurrent ? "font-semibold text-white" : "text-white/55",
                )}>
                  {stepTitles[step]}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="border-t border-white/10 px-6 py-5 font-sans text-[12px] leading-relaxed text-white/55">
          Your application is reviewed by the Harris Boat Works financing team—not an automated approval screen.
        </div>
      </aside>
    </>
  );
}
