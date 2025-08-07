import { useState } from 'react';
import { MotorSelection } from './quote-builder/MotorSelection';
import { BoatInformation } from './quote-builder/BoatInformation';
import { QuoteDisplay } from './quote-builder/QuoteDisplay';
import { ScheduleConsultation } from './quote-builder/ScheduleConsultation';
import { QuoteProgress } from './quote-builder/QuoteProgress';

export interface Motor {
  id: string;
  model: string;
  hp: number;
  price: number;
  image: string;
  stockStatus: 'In Stock' | 'On Order' | 'Out of Stock';
  category: 'portable' | 'mid-range' | 'high-performance' | 'v8-racing';
  type: string;
  specs: string;
}

export interface BoatInfo {
  type: string;
  make: string;
  model: string;
  length: string;
  currentMotorBrand: string;
  currentHp: number;
  serialNumber: string;
  controlType: string;
  shaftLength: string;
}

export interface QuoteData {
  motor: Motor | null;
  boatInfo: BoatInfo | null;
  financing: {
    downPayment: number;
    term: number;
    rate: number;
  };
  hasTradein: boolean;
}

const QuoteBuilder = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [quoteData, setQuoteData] = useState<QuoteData>({
    motor: null,
    boatInfo: null,
    financing: {
      downPayment: 0,
      term: 48,
      rate: 7.99
    },
    hasTradein: false
  });

  const handleStepComplete = (stepData: any) => {
    switch (currentStep) {
      case 1:
        setQuoteData(prev => ({ ...prev, motor: stepData }));
        break;
      case 2:
        setQuoteData(prev => ({ ...prev, boatInfo: stepData }));
        break;
      case 3:
        setQuoteData(prev => ({ ...prev, financing: stepData.financing, hasTradein: stepData.hasTradein }));
        break;
    }
    
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/50">
      {/* Header */}
      <header className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">H</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Harris Boat Works</h1>
                <p className="text-muted-foreground">Mercury Outboard Quote Builder</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Indicator */}
      <QuoteProgress currentStep={currentStep} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {currentStep === 1 && (
          <MotorSelection onStepComplete={handleStepComplete} />
        )}
        
        {currentStep === 2 && (
          <BoatInformation 
            onStepComplete={handleStepComplete} 
            onBack={handleBack}
            selectedMotor={quoteData.motor}
          />
        )}
        
        {currentStep === 3 && (
          <QuoteDisplay 
            quoteData={quoteData}
            onStepComplete={handleStepComplete} 
            onBack={handleBack}
          />
        )}
        
        {currentStep === 4 && (
          <ScheduleConsultation 
            quoteData={quoteData}
            onBack={handleBack}
          />
        )}
      </main>
    </div>
  );
};

export default QuoteBuilder;