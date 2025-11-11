import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  return (
    <div 
      className={cn(
        "sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border py-3 px-4 -mx-4 sm:-mx-6 md:-mx-8",
        "z-10 shadow-lg",
        className
      )}
    >
      <div className="flex gap-3 max-w-2xl mx-auto">
        {showBack && onBack && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isLoading}
            className="min-w-[100px] touch-manipulation h-11 text-base"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
        
        {onNext && (
          <Button
            type="submit"
            onClick={onNext}
            disabled={isNextDisabled || isLoading}
            className="flex-1 touch-manipulation h-11 text-base font-semibold"
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
        )}
      </div>
    </div>
  );
}
