import { ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AccessibleFormWrapperProps {
  children: ReactNode;
  stepNumber: number;
  stepTitle: string;
  totalSteps: number;
  className?: string;
}

export function AccessibleFormWrapper({
  children,
  stepNumber,
  stepTitle,
  totalSteps,
  className
}: AccessibleFormWrapperProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Focus management: Focus the heading when step changes
  useEffect(() => {
    if (headingRef.current) {
      headingRef.current.focus();
    }
  }, [stepNumber]);

  return (
    <section 
      className={cn("space-y-6", className)}
      aria-labelledby={`step-${stepNumber}-heading`}
      role="region"
    >
      {/* Screen reader announcement */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Step {stepNumber} of {totalSteps}: {stepTitle}
      </div>

      {/* Visually hidden but focusable heading for keyboard navigation */}
      <h2 
        id={`step-${stepNumber}-heading`}
        ref={headingRef}
        tabIndex={-1}
        className="text-2xl font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
      >
        {stepTitle}
      </h2>

      {children}
    </section>
  );
}
