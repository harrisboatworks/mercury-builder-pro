// src/components/quote-builder/QuoteBuilder.tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MotorSelection } from "./MotorSelection";
import PurchasePath from "./PurchasePath";
import InstallationConfig from "./InstallationConfig";
import { QuoteDisplay as LegacyQuoteDisplay } from "./QuoteDisplay";
import { TradeInValuation } from "./TradeInValuation";
import { BoatInformation } from "./BoatInformation";
import { ScheduleConsultation } from "./ScheduleConsultation";
import FuelTankOptions from "./FuelTankOptions";
import type { TradeInInfo } from "@/lib/trade-valuation";
import { Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { xpActions } from "@/config/xpActions";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { HamburgerMenu } from "@/components/ui/hamburger-menu";

export default function QuoteBuilder() {
  const [currentStep, setCurrentStep] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);
  const [selectedMotor, setSelectedMotor] = useState<any>(null);
  const [purchasePath, setPurchasePath] = useState<'loose' | 'installed' | null>(null);
  const [installConfig, setInstallConfig] = useState<any>(null);
  const [tradeInInfo, setTradeInInfo] = useState<TradeInInfo>({
    hasTradeIn: false,
    brand: '',
    year: new Date().getFullYear(),
    horsepower: 0,
    model: '',
    serialNumber: '',
    condition: 'good',
    estimatedValue: 0,
    confidenceLevel: 'low',
  });
  const [boatInfo, setBoatInfo] = useState<any>(null);
  const [fuelTankConfig, setFuelTankConfig] = useState<any>(null);
  const [totalXP, setTotalXP] = useState(0);
  const [quoteForSchedule, setQuoteForSchedule] = useState<any | null>(null);
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);

  const { user, loading, signOut } = useAuth();

  // Helper function to check if motor is small tiller (2.5-6 HP)
  const isSmallTillerMotor = (motor: any) => {
    return motor?.horsepower <= 6 && 
      (motor?.model?.toLowerCase().includes('tiller') || 
       motor?.engine_type?.toLowerCase().includes('tiller'));
  };

  // Auto-dismiss achievement badge after 3s when XP threshold reached
  const [showAchievement, setShowAchievement] = useState(false);
  useEffect(() => {
    if (totalXP >= 100) {
      setShowAchievement(true);
      const t = setTimeout(() => setShowAchievement(false), 3000);
      return () => clearTimeout(t);
    }
  }, [totalXP]);

  // Track furthest step reached so users can navigate back to any unlocked step
  useEffect(() => {
    setMaxStepReached((prev) => Math.max(prev, currentStep));
  }, [currentStep]);
  const handleMotorSelect = (motor: any) => {
    setSelectedMotor(motor);
    setCurrentStep(2);
    
    // Add XP for motor selection
    setTotalXP(prev => prev + xpActions.selectMotor);
    
    // Small celebration
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.8 }
    });
  };

  const handlePathSelect = (path: 'loose' | 'installed') => {
    setPurchasePath(path);
    const xpEarned = path === 'installed' ? 50 : 30;
    setTotalXP(prev => prev + xpEarned);
    
    if (path === 'installed') {
      setCurrentStep(3); // Go to boat info step first
    } else {
      // For small tiller motors, go to fuel tank options, otherwise trade-in
      if (isSmallTillerMotor(selectedMotor)) {
        setCurrentStep(3); // Go to fuel tank options
      } else {
        setCurrentStep(3); // Go to trade-in step for other loose motors
      }
    }
  };

  const handleConfigComplete = (config: any) => {
    setInstallConfig(config);
    setCurrentStep(6); // Go to quote display (installed path)
    
    // Big celebration!
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.6 }
    });
  };

  const handleFuelTankConfigComplete = (config: any) => {
    setFuelTankConfig(config);
    setCurrentStep(4); // Go to trade-in for small tiller motors
    setTotalXP(prev => prev + 25); // Award XP for configuration
  };

  const isSmallTillerLoose = purchasePath === 'loose' && isSmallTillerMotor(selectedMotor);

  const steps = purchasePath === 'installed'
    ? [
        { number: 1, label: "Select Motor", icon: "🚤" },
        { number: 2, label: "Purchase Type", icon: "🛒" },
        { number: 3, label: "Boat Info", icon: "🛥️" },
        { number: 4, label: "Trade-In", icon: "💱" },
        { number: 5, label: "Configure", icon: "⚙️" },
        { number: 6, label: "Your Quote", icon: "📋" },
        { number: 7, label: "Consultation", icon: "📅" },
      ]
    : isSmallTillerLoose
      ? [
          { number: 1, label: "Select Motor", icon: "🚤" },
          { number: 2, label: "Purchase Type", icon: "🛒" },
          { number: 3, label: "Fuel Options", icon: "⛽" },
          { number: 4, label: "Trade-In", icon: "💱" },
          { number: 5, label: "Your Quote", icon: "📋" },
          { number: 6, label: "Consultation", icon: "📅" },
        ]
      : [
          { number: 1, label: "Select Motor", icon: "🚤" },
          { number: 2, label: "Purchase Type", icon: "🛒" },
          { number: 3, label: "Trade-In", icon: "💱" },
          { number: 4, label: "Your Quote", icon: "📋" },
          { number: 5, label: "Consultation", icon: "📅" },
        ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Mobile-Optimized Header - Compact ≤56px */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile Layout - Compact Height ≤56px */}
          <div className="flex lg:hidden h-14 items-center">
            <div className="flex items-center justify-between w-full">
              <button 
                id="hamburger" 
                className="p-2 text-gray-900 hover:bg-gray-100 rounded-lg -ml-2 w-11 h-11 flex items-center justify-center"
                onClick={() => setHamburgerOpen(true)}
                aria-label="Open menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              {/* Centered Harris Logo Only */}
              <div className="flex-1 flex justify-center">
                <img 
                  src="/lovable-uploads/bdce50a1-2d19-4696-a2ec-6b67379cbe23.png" 
                  alt="Harris Boat Works" 
                  className="h-7 w-auto max-w-none" 
                />
              </div>
              
              {/* Mobile Quote Button */}
              <button 
                className="text-sm font-medium text-blue-600 hover:text-blue-700 px-2 py-2 min-w-11 h-11 flex items-center justify-center"
                onClick={() => {
                  // Fire analytics event
                  if (typeof window !== 'undefined' && (window as any).gtag) {
                    (window as any).gtag('event', 'cta_quote_open', {
                      source: 'header_mobile'
                    });
                  }
                  // Open quote form - will be handled by parent component
                }}
                aria-label="Get a quote"
              >
                Quote
              </button>
            </div>
          </div>

          {/* Desktop Layout - Hidden on mobile */}
          <div className="hidden lg:flex items-center justify-between">
            <div className="flex items-center gap-8">
              {/* Desktop Logo Group */}
              <div className="flex items-center gap-4">
                <img 
                  src="/lovable-uploads/bdce50a1-2d19-4696-a2ec-6b67379cbe23.png" 
                  alt="Harris Boat Works" 
                  className="h-20" 
                />
                <img src="/src/assets/mercury-logo.png" alt="Mercury" className="h-16" />
                <span className="text-sm text-gray-600 font-medium">Platinum Mercury Dealer</span>
              </div>
              
              {/* Desktop Step Indicators */}
              <div className="flex items-center gap-2">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center">
                    <motion.button
                      type="button"
                      title={step.label}
                      onClick={() => step.number <= maxStepReached && setCurrentStep(step.number)}
                      disabled={step.number > maxStepReached}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all
                        ${currentStep === step.number 
                          ? 'bg-blue-600 text-white shadow-lg animate-pulse' 
                          : currentStep > step.number 
                            ? 'bg-green-500 text-white hover:scale-110 cursor-pointer' 
                            : step.number <= maxStepReached
                              ? 'bg-gray-200 text-gray-400 hover:scale-110 cursor-pointer'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      aria-label={step.label}
                    >
                      {currentStep > step.number ? '✓' : step.icon}
                    </motion.button>
                    {index < steps.length - 1 && (
                      <div className={`w-12 h-1 mx-2 rounded
                        ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'}`} 
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Desktop Right side: Live Inventory + Price + Admin */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-700 font-medium">Live Inventory</span>
              </div>
              
              {selectedMotor && (
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">${selectedMotor.price.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Your Build</div>
                </div>
              )}

              {!loading && (
                user ? (
                  <div className="flex items-center gap-2">
                    <Link to="/admin/quotes">
                      <Button variant="secondary" size="sm">Admin</Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={async () => { await signOut(); }}>
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Link to="/auth">
                    <Button size="sm">Admin Sign In</Button>
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hamburger Menu */}
      <HamburgerMenu 
        isOpen={hamburgerOpen}
        onClose={() => setHamburgerOpen(false)}
        totalXP={0}
        user={user}
        loading={loading}
        signOut={signOut}
      />

      {/* Sticky Mobile Bottom Bar - Only show on motor selection step */}
      {currentStep === 1 && selectedMotor && (
        <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-gray-200 p-3 z-40">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">${selectedMotor.price.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Total Build</div>
            </div>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold"
              onClick={() => handleMotorSelect(selectedMotor)}
            >
              Complete Quote →
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20 pb-20 lg:pb-20">
        <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div
            key="motor-selection"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
          >
            <MotorSelection onStepComplete={handleMotorSelect} />
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            key="purchase-path"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
          >
            <PurchasePath 
              selectedMotor={selectedMotor}
              onSelectPath={handlePathSelect}
            />
          </motion.div>
        )}

        {purchasePath === 'installed' && currentStep === 3 && (
          <motion.div
            key="boat-info"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
          >
            <BoatInformation
              selectedMotor={selectedMotor}
              includeTradeIn={false}
              onBack={() => setCurrentStep(2)}
              onStepComplete={(info) => {
                setBoatInfo(info);
                setCurrentStep(4);
              }}
              onShowCompatibleMotors={() => setCurrentStep(1)}
            />
          </motion.div>
        )}

        {/* Fuel Tank Options for Small Tiller Motors */}
        {isSmallTillerLoose && currentStep === 3 && (
          <motion.div
            key="fuel-tank-options"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
          >
            <FuelTankOptions
              selectedMotor={selectedMotor}
              onComplete={handleFuelTankConfigComplete}
              onBack={() => setCurrentStep(2)}
            />
          </motion.div>
        )}

        {((!isSmallTillerLoose && purchasePath !== 'installed' && currentStep === 3) || 
          (isSmallTillerLoose && currentStep === 4) || 
          (purchasePath === 'installed' && currentStep === 4)) && (
          <motion.div
            key="trade-in"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
          >
            <TradeInValuation
              tradeInInfo={tradeInInfo}
              onTradeInChange={setTradeInInfo}
              currentMotorBrand={boatInfo?.currentMotorBrand || selectedMotor?.brand || selectedMotor?.manufacturer || 'Mercury'}
              currentHp={boatInfo?.currentHp || (typeof selectedMotor?.hp === 'string' ? parseInt(selectedMotor.hp, 10) : selectedMotor?.hp)}
            />
            <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <Button variant="outline" className="min-h-[48px] w-full md:w-auto py-3" onClick={() => {
                if (purchasePath === 'installed') {
                  setCurrentStep(3);
                } else if (isSmallTillerLoose) {
                  setCurrentStep(3); // Back to fuel options
                } else {
                  setCurrentStep(2); // Back to purchase path
                }
              }}>Back</Button>
              <Button className="w-full md:w-auto py-3 bg-red-600 rounded-xl min-h-[48px]" onClick={() => setCurrentStep(isSmallTillerLoose ? 5 : (purchasePath === 'installed' ? 5 : 4))}>
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {currentStep === 5 && purchasePath === 'installed' && (
          <motion.div
            key="installation-config"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
          >
            <InstallationConfig
              selectedMotor={selectedMotor}
              onComplete={handleConfigComplete}
            />
          </motion.div>
        )}

          {currentStep === (purchasePath === 'installed' ? 6 : 5) && (
            <motion.div
              key="quote-display"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
               <LegacyQuoteDisplay
                quoteData={{
                  motor: selectedMotor,
                  boatInfo: (purchasePath === 'installed' ? { ...(boatInfo || {}), tradeIn: tradeInInfo } : { tradeIn: tradeInInfo }) as any,
                  financing: { downPayment: 0, term: 48, rate: 7.99 },
                  hasTradein: tradeInInfo.hasTradeIn,
                  fuelTankConfig: fuelTankConfig,
                } as any}
                totalXP={totalXP}
                onEarnXP={(amount) => setTotalXP((prev) => prev + amount)}
                onStepComplete={(data) => {
                  setQuoteForSchedule({
                    motor: selectedMotor,
                    boatInfo: (purchasePath === 'installed' ? { ...(boatInfo || {}), tradeIn: tradeInInfo } : { tradeIn: tradeInInfo }) as any,
                    financing: data.financing,
                    hasTradein: tradeInInfo.hasTradeIn,
                  } as any);
                  setTotalXP((prev) => prev + xpActions.completeQuote);
                  setCurrentStep(purchasePath === 'installed' ? 7 : 6);
                }}
                onBack={() => setCurrentStep(purchasePath === 'installed' ? 5 : (isSmallTillerLoose ? 4 : 3))}
              />
            </motion.div>
          )}
          {currentStep === (purchasePath === 'installed' ? 7 : 6) && (
            <motion.div
              key="schedule-consultation"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
            >
              <ScheduleConsultation
                quoteData={(quoteForSchedule ?? {
                  motor: selectedMotor,
                  boatInfo: (purchasePath === 'installed' ? { ...(boatInfo || {}), tradeIn: tradeInInfo } : { tradeIn: tradeInInfo }) as any,
                  financing: { downPayment: 0, term: 48, rate: 7.99 },
                  hasTradein: tradeInInfo.hasTradeIn,
                }) as any}
                onBack={() => setCurrentStep(purchasePath === 'installed' ? 6 : 5)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
