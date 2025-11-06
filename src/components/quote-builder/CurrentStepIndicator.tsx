interface CurrentStepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepTitle?: string;
}

export const CurrentStepIndicator = ({ 
  currentStep, 
  totalSteps, 
  stepTitle 
}: CurrentStepIndicatorProps) => {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="bg-muted/30 border-b border-border">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-sm font-medium text-foreground">
              Step {currentStep} of {totalSteps}
            </div>
            {stepTitle && (
              <>
                <div className="text-gray-400 dark:text-gray-500">•</div>
                <div className="text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
                  {stepTitle}
                </div>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-xs text-gray-600 dark:text-gray-300">
              {Math.round(progressPercentage)}% Complete
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-2 w-full bg-muted rounded-full h-1">
          <div 
            className="bg-primary h-1 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};