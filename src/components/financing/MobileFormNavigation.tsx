import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

interface MobileFormNavigationProps {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  isNextDisabled?: boolean;
  isLoading?: boolean;
  showBack?: boolean;
  className?: string;
}

export function MobileFormNavigation({
  onBack,
  onNext,
  nextLabel = "Continue",
  isNextDisabled = false,
  isLoading = false,
  showBack = true,
  className,
}: MobileFormNavigationProps) {
  const { triggerHaptic } = useHapticFeedback();
  
  return (
    <div 
      className={cn(
        "sticky bottom-0 left-0 right-0 -mx-4 border-t border-repower-navy-900/10 bg-white/95 px-4 py-3 shadow-[0_-16px_28px_-24px_rgba(5,18,36,0.4)] backdrop-blur-sm sm:-mx-7 sm:px-7 md:-mx-9 md:px-9",
        "z-10",
        className
      )}
    >
      <div className="flex gap-3 max-w-2xl mx-auto">
        {showBack && onBack && (
          <Button
            type="button"
            variant="outline"
            onClick={(e) => {
              triggerHaptic('light');
              onBack();
            }}
            disabled={isLoading}
            className="h-12 min-w-[100px] touch-manipulation rounded-none border-repower-navy-900/20 bg-white font-sans text-[12px] font-bold uppercase tracking-[0.1em] text-repower-navy-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
        
        <Button
          type={onNext ? "button" : "submit"}
          onClick={() => {
            triggerHaptic('light');
            onNext?.();
          }}
          disabled={isNextDisabled || isLoading}
          className="h-12 flex-1 touch-manipulation rounded-none bg-repower-mercury-red font-sans text-[12px] font-bold uppercase tracking-[0.1em] text-white hover:bg-repower-mercury-red-deep"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {nextLabel}
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
