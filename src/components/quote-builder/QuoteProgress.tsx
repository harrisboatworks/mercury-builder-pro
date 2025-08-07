import { Check } from 'lucide-react';

interface QuoteProgressProps {
  currentStep: number;
}

export const QuoteProgress = ({ currentStep }: QuoteProgressProps) => {
  const steps = [
    { number: 1, title: 'Select Motor', description: 'Choose your Mercury outboard' },
    { number: 2, title: 'Boat Details', description: 'Tell us about your boat' },
    { number: 3, title: 'Review Quote', description: 'Financing & options' },
    { number: 4, title: 'Schedule', description: 'Book consultation' }
  ];

  return (
    <div className="bg-card border-b border-border">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                    currentStep > step.number
                      ? 'bg-primary text-primary-foreground'
                      : currentStep === step.number
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {currentStep > step.number ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.number ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 mt-[-2rem] transition-all duration-300 ${
                  currentStep > step.number ? 'bg-primary' : 'bg-border'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};