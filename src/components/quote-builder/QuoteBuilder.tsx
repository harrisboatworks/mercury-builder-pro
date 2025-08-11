// src/components/quote-builder/QuoteBuilder.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MotorSelection } from "./MotorSelection";
import PurchasePath from "./PurchasePath";
import InstallationConfig from "./InstallationConfig";
import QuoteDisplay from "./QuoteDisplay";
import { Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

export default function QuoteBuilder() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMotor, setSelectedMotor] = useState<any>(null);
  const [purchasePath, setPurchasePath] = useState<'loose' | 'installed' | null>(null);
  const [installConfig, setInstallConfig] = useState<any>(null);
  const [totalXP, setTotalXP] = useState(0);

  const handleMotorSelect = (motor: any) => {
    setSelectedMotor(motor);
    setCurrentStep(2);
    
    // Add XP for motor selection
    setTotalXP(prev => prev + 25);
    
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
      setCurrentStep(3); // Go to configuration
    } else {
      setCurrentStep(4); // Skip to quote for loose motors
    }
  };

  const handleConfigComplete = (config: any) => {
    setInstallConfig(config);
    setCurrentStep(4); // Go to quote display
    
    // Big celebration!
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.6 }
    });
  };

  const steps = [
    { number: 1, label: "Select Motor", icon: "🚤" },
    { number: 2, label: "Purchase Type", icon: "🛒" },
    { number: 3, label: "Configure", icon: "⚙️" },
    { number: 4, label: "Your Quote", icon: "📋" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header with XP Display */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              {/* Step Indicators */}
              <div className="flex items-center gap-2">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`flex items-center justify-center w-10 h-10 rounded-full font-bold
                        ${currentStep === step.number 
                          ? 'bg-blue-600 text-white shadow-lg animate-pulse' 
                          : currentStep > step.number 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-200 text-gray-400'
                        }`}
                    >
                      {currentStep > step.number ? '✓' : step.icon}
                    </motion.div>
                    {index < steps.length - 1 && (
                      <div className={`w-12 h-1 mx-2 rounded
                        ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'}`} 
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* XP Display */}
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
        </div>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div
            key="motor-selection"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
          >
            <MotorSelection onSelectMotor={handleMotorSelect} />
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

        {currentStep === 3 && purchasePath === 'installed' && (
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

        {currentStep === 4 && (
          <motion.div
            key="quote-display"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <QuoteDisplay
              selectedMotor={selectedMotor}
              purchasePath={purchasePath}
              installConfig={installConfig}
              totalXP={totalXP}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Achievement Toast */}
      {totalXP >= 100 && (
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
