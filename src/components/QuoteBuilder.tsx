import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, User, DollarSign } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import harrisLogo from '@/assets/harris-logo.png';
import mercuryLogo from '@/assets/mercury-logo.png';
import { MotorSelection } from './quote-builder/MotorSelection';
import { BoatInformation } from './quote-builder/BoatInformation';
import { QuoteDisplay } from './quote-builder/QuoteDisplay';
import { ScheduleConsultation } from './quote-builder/ScheduleConsultation';
import { QuoteProgress } from './quote-builder/QuoteProgress';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { BonusOffers } from './quote-builder/BonusOffers';

export interface Motor {
  id: string;
  model: string;
  year: number;
  hp: number;
  price: number; // effective price shown to user
  image: string;
  stockStatus: 'In Stock' | 'On Order' | 'Order Now' | 'Sold';
  stockNumber?: string | null; // subtle stock number display
  model_number?: string | null; // Mercury model number display
  // Additional stock fields
  in_stock?: boolean;
  stock_quantity?: number;
  availability?: string;
  category: 'portable' | 'mid-range' | 'high-performance' | 'v8-racing';
  type: string;
  specs: string;
  // Hero image field for priority logic
  hero_media_id?: string;
  // Optional pricing metadata
  basePrice?: number;
  salePrice?: number | null;
  msrp?: number; // Manufacturer's suggested retail price
  originalPrice?: number; // base or sale before promos
  savings?: number; // total savings applied
  appliedPromotions?: string[];
  promoEndsAt?: string | null;
  // NEW: Bonus offers metadata (non-price)
  bonusOffers?: Array<{
    id: string;
    title: string;
    shortBadge?: string | null;
    description?: string | null;
    warrantyExtraYears?: number | null;
    termsUrl?: string | null;
    highlight: boolean;
    endsAt: string | null;
    priority: number;
    image_url?: string | null;
    image_alt_text?: string | null;
  }>;
  // Enhanced scraped data
  specifications?: Record<string, any>;
  features?: string[];
  description?: string | null;
  detailUrl?: string | null;
}

export interface BoatInfo {
  type: string;
  make: string;
  model: string;
  length: string;
  currentMotorBrand: string;
  currentHp: number;
  currentMotorYear?: number;
  serialNumber: string;
  controlType: string;
  controlsOption?: 'none' | 'adapter' | 'compatible';
  hasBattery?: boolean;
  hasCompatibleProp?: boolean;
  shaftLength: string;
  tradeIn?: {
    hasTradeIn: boolean;
    brand: string;
    year: number;
    horsepower: number;
    model: string;
    serialNumber: string;
    condition: 'excellent' | 'good' | 'fair' | 'poor';
    estimatedValue: number;
    confidenceLevel: 'high' | 'medium' | 'low';
    // Audit fields (optional)
    rangePrePenaltyLow?: number;
    rangePrePenaltyHigh?: number;
    rangeFinalLow?: number;
    rangeFinalHigh?: number;
    tradeinValuePrePenalty?: number;
    tradeinValueFinal?: number;
    penaltyApplied?: boolean;
    penaltyFactor?: number;
  };
}

export interface QuoteData {
  motor: Motor | null;
  boatInfo: BoatInfo | null;
  financing: {
    downPayment: number;
    term: number;
    rate: number;
  };
  warrantyConfig: {
    extendedYears: number;
    warrantyPrice: number;
    totalYears: number;
  } | null;
  hasTradein: boolean;
  purchasePath?: 'loose' | 'installed' | null;
  installConfig?: any | null;
  fuelTankConfig?: any | null;
  tradeInInfo?: any | null;
}

const QuoteBuilder = () => {
  const { user, signOut } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [quoteData, setQuoteData] = useState<QuoteData>({
    motor: null,
    boatInfo: null,
    financing: {
      downPayment: 0,
      term: 48,
      rate: 7.99
    },
    warrantyConfig: null,
    hasTradein: false
  });

  // SEO
  useEffect(() => {
    document.title = 'Mercury Outboard Quote Builder | Harris Boat Works';

    let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!desc) {
      desc = document.createElement('meta');
      desc.name = 'description';
      document.head.appendChild(desc);
    }
    desc.content = 'Build your Mercury outboard quote with live pricing, sale deals, and promotions.';

    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.origin + '/';
  }, []);

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
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <img 
                    src={harrisLogo} 
                    alt="Harris Boat Works" 
                    className="h-12 w-auto"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Mercury Outboard Quote Builder</h1>
                  <p className="text-muted-foreground">Harris Boat Works Authorized Dealer</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {user ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{user.email}</span>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => (window.location.href = '/admin/promotions')}>
                      Promotions
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => (window.location.href = '/admin/financing')}>
                      <DollarSign className="w-4 h-4 mr-2" />
                      Financing
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => (window.location.href = '/admin/quotes')}>
                      Quotes
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => signOut()}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => window.location.href = '/auth'}>
                    <User className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                )}
              </div>
            </div>
        </div>
      </header>

      {/* Trust Bar */}
      <div className="bg-muted/40 border-b border-border">
        <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-4 md:gap-6">
          <img
            src="/lovable-uploads/5d3b9997-5798-47af-8034-82bf5dcdd04c.png"
            alt="Mercury CSI Award Winner badge"
            loading="lazy"
            className="h-8 w-auto"
          />
          <span className="text-sm font-medium text-foreground/80">Award-Winning Service Team</span>
          <span className="text-muted-foreground">|</span>
          <img
            src="/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png"
            alt="Mercury Certified Repower Center badge"
            loading="lazy"
            className="h-8 w-auto"
          />
          <span className="text-sm font-medium text-foreground/80">Certified Repower Center</span>
        </div>
      </div>

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
            onShowCompatibleMotors={() => setCurrentStep(1)}
          />
        )}
        
        {currentStep === 3 && (
          <>
            <QuoteDisplay 
              quoteData={quoteData}
              onStepComplete={handleStepComplete} 
              onBack={handleBack}
            />
            {/* NEW: Bonus offers section under the quote details */}
            <BonusOffers motor={quoteData.motor} />
          </>
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
