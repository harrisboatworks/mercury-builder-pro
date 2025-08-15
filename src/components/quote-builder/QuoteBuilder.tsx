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
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur">
        <div className="mx-auto px-4 max-w-screen-sm md:max-w-3xl lg:max-w-5xl xl:max-w-7xl h-14 md:h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img src="/water-icon.svg" alt="Harris Boat Works • Mercury Dealer" className="h-6 md:h-7" />
            <span className="text-white font-semibold">Mercury Quote</span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-200">
            <a href="#engines" className="hover:text-white">Engines</a>
            <a href="#accessories" className="hover:text-white">Accessories</a>
            <a href="#financing" className="hover:text-white">Financing</a>
            <a href="#contact" className="hover:text-white">Contact</a>
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <a href="#quote" className="inline-flex items-center px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 font-semibold text-white">
              Get a Quote
            </a>
            {!loading && (
              user ? (
                <Link to="/admin/quotes">
                  <Button variant="secondary" size="sm" className="h-9 px-3 text-xs text-white">Admin</Button>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button size="sm" className="h-9 px-3 text-xs">Admin</Button>
                </Link>
              )
            )}
          </div>

          {/* Mobile burger */}
          <button className="md:hidden h-10 w-10 text-white" aria-label="Menu">☰</button>
        </div>
      </header>

      {/* Main Content */}
      <main className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-6 md:gap-8">
        <section id="quote-form" className="mx-auto px-4 max-w-screen-sm md:max-w-3xl lg:max-w-5xl xl:max-w-7xl">
          {/* Mobile Step Progress - only on mobile */}
          <div className="md:hidden mb-6 rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Step {currentStep} of {steps.length}</span>
              <span className="text-sm text-muted-foreground">{steps[currentStep - 1]?.label}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div 
                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / steps.length) * 100}%` }}
              />
            </div>
            {totalXP > 0 && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-100 to-orange-100 px-3 py-2 rounded-full"
              >
                <Sparkles className="w-4 h-4 text-orange-600" />
                <span className="font-bold text-orange-800 text-sm">{totalXP} XP</span>
              </motion.div>
            )}
          </div>

          {/* Desktop Step Progress - only on desktop */}
          <div className="hidden md:flex items-center justify-between mb-8">
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
            {totalXP > 0 && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                className="flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-orange-100 px-4 py-2 rounded-full"
              >
                <Sparkles className="w-5 h-5 text-orange-600" />
                <span className="font-bold text-orange-800">{totalXP} XP Total</span>
              </motion.div>
            )}
          </div>

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
        </section>

        {/* Desktop Sidebar - hidden on mobile */}
        <aside className="hidden lg:block" id="sidebar">
          <div className="sticky top-20 space-y-4">
            <div className="rounded-2xl bg-zinc-900 p-4 text-white">
              <h3 className="font-semibold text-lg mb-2">Mercury Warranty</h3>
              <p className="text-sm text-gray-300 mb-3">Industry-leading protection for your investment</p>
              <a href="https://www.mercurymarine.com/owner-resources/warranty/" className="underline text-red-400 hover:text-red-300 text-sm">View official coverage</a>
            </div>
            
            <div className="rounded-2xl bg-zinc-900 p-4 text-white">
              <h3 className="font-semibold text-lg mb-2">Financing Available</h3>
              <p className="text-sm text-gray-300 mb-3">Flexible payment options starting at 5.99% APR</p>
              <button className="w-full py-2 rounded-lg bg-red-600 hover:bg-red-500 font-semibold text-sm">Calculate Payment</button>
            </div>

            <div className="rounded-2xl bg-zinc-900 p-4 text-white">
              <h3 className="font-semibold text-lg mb-2">Harris Boat Works</h3>
              <div className="text-sm text-gray-300 space-y-1">
                <p>📍 Rice Lake, Ontario</p>
                <p>📞 <a href="tel:705-652-7880" className="underline text-red-400 hover:text-red-300">705-652-7880</a></p>
                <p>📱 <a href="sms:705-652-7880" className="underline text-red-400 hover:text-red-300">Text Us</a></p>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Mobile Info Accordions - only on mobile */}
      <section className="mt-6 md:mt-8 lg:hidden mx-auto px-4 max-w-screen-sm" id="mobile-info">
        <details className="group rounded-2xl bg-zinc-900 p-4 open:bg-zinc-800">
          <summary className="cursor-pointer select-none text-sm font-semibold flex items-center justify-between text-white">
            Warranty & Coverage
            <span className="ml-2 text-gray-400 group-open:rotate-180 transition">⌄</span>
          </summary>
          <div className="mt-3 text-sm text-gray-300">
            <p className="mb-2">Industry-leading protection for your investment</p>
            <a href="https://www.mercurymarine.com/owner-resources/warranty/" className="underline text-red-400 hover:text-red-300">View official coverage</a>
          </div>
        </details>

        <details className="group mt-3 rounded-2xl bg-zinc-900 p-4 open:bg-zinc-800">
          <summary className="cursor-pointer select-none text-sm font-semibold flex items-center justify-between text-white">
            Financing
            <span className="ml-2 text-gray-400 group-open:rotate-180 transition">⌄</span>
          </summary>
          <div className="mt-3 text-sm text-gray-300">
            <p className="mb-2">Flexible payment options starting at 5.99% APR</p>
            <button className="w-full py-2 rounded-lg bg-red-600 hover:bg-red-500 font-semibold text-sm text-white">Calculate Payment</button>
          </div>
        </details>

        <details className="group mt-3 rounded-2xl bg-zinc-900 p-4 open:bg-zinc-800">
          <summary className="cursor-pointer select-none text-sm font-semibold flex items-center justify-between text-white">
            Dealer Info
            <span className="ml-2 text-gray-400 group-open:rotate-180 transition">⌄</span>
          </summary>
          <div className="mt-3 text-sm text-gray-300 space-y-1">
            <p>📍 Rice Lake, Ontario</p>
            <p>📞 <a href="tel:705-652-7880" className="underline text-red-400 hover:text-red-300">705-652-7880</a></p>
            <p>📱 <a href="sms:705-652-7880" className="underline text-red-400 hover:text-red-300">Text Us</a></p>
          </div>
        </details>
      </section>

      {/* Mobile Sticky Bottom CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 p-4 bg-black/95 backdrop-blur md:hidden">
        <button 
          className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-500 font-semibold text-white"
          onClick={() => document.getElementById('quote-form')?.scrollIntoView({ behavior: 'smooth' })}
        >
          Start My Quote
        </button>
      </div>

      {/* Floating Achievement Toast */}
      {showAchievement && (
        <motion.div
          initial={{ bottom: -100 }}
          animate={{ bottom: 20 }}
          className="fixed bottom-20 right-4 bg-purple-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3"
        >
          <span className="text-2xl">🏆</span>
          <div>
            <div className="font-bold">Master Configurator!</div>
            <div className="text-sm opacity-90">You've earned {totalXP} XP</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
