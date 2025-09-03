// src/components/quote-builder/InstallationConfig.tsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import OptionGallery from "../OptionGallery";
import XPProgress from "../XPProgress";
import { controlChoices, steeringChoices, gaugeChoices } from "@/config/visualChoices";
import confetti from "canvas-confetti";
import { useToast } from "@/hooks/use-toast";

interface InstallationConfigProps {
  selectedMotor: any;
  onComplete: (config: any) => void;
}

export default function InstallationConfig({ selectedMotor, onComplete }: InstallationConfigProps) {
  const [currentXP, setCurrentXP] = useState(50); // Start with 50 from path selection
  const [step, setStep] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [config, setConfig] = useState({
    controls: '',
    steering: '',
    gauges: '',
    removeOld: false,
    waterTest: true
  });
  const { toast } = useToast();

  const totalSteps = 4;

  const handleOptionSelect = (field: string, value: string, xp: number) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setCurrentXP(prev => prev + xp);
    
    // Show transition feedback
    setIsTransitioning(true);
    
    // Auto-advance to next step with smoother timing
    setTimeout(() => {
      if (step < totalSteps - 1) {
        setStep(step + 1);
      }
      setIsTransitioning(false);
    }, 200);
  };

  const handleComplete = () => {
    // Celebration!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    
    toast({
      title: "🎉 Configuration Complete!",
      description: `You earned ${currentXP} XP total!`,
    });
    
    onComplete(config);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <XPProgress 
        currentXP={currentXP} 
        totalSteps={totalSteps} 
        currentStep={step}
      />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-6xl mx-auto relative"
      >
        {/* Transition Overlay */}
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-2xl z-10 flex items-center justify-center"
          >
            <div className="flex items-center gap-2 text-primary">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="font-medium">Moving to next step...</span>
            </div>
          </motion.div>
        )}

        <h2 className="text-3xl font-bold text-[#2A4D69] mb-2">
          Configure Your Installation
        </h2>
        <p className="text-gray-600 mb-8">
          Select your rigging options for the {selectedMotor?.model}
        </p>

        {/* Step 1: Controls */}
        {step >= 1 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <OptionGallery
              title="Step 1: Choose Your Control System"
              choices={selectedMotor?.hp >= 150 ? 
                controlChoices.filter(c => c.value === 'dts') : 
                controlChoices
              }
              value={config.controls}
              onChange={(val, xp) => handleOptionSelect('controls', val, xp)}
              currentXP={currentXP}
            />
          </motion.div>
        )}

        {/* Step 2: Steering */}
        {step >= 2 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <OptionGallery
              title="Step 2: Select Steering Type"
              choices={steeringChoices}
              value={config.steering}
              onChange={(val, xp) => handleOptionSelect('steering', val, xp)}
              currentXP={currentXP}
            />
          </motion.div>
        )}

        {/* Step 3: Gauges */}
        {step >= 3 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <OptionGallery
              title="Step 3: Pick Your Gauge Package"
              choices={gaugeChoices}
              value={config.gauges}
              onChange={(val, xp) => handleOptionSelect('gauges', val, xp)}
              currentXP={currentXP}
            />
          </motion.div>
        )}

        {/* Step 4: Additional Services */}
        {step >= 4 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mt-6"
          >
            <h3 className="text-xl font-bold mb-4">Step 4: Additional Services</h3>
            <div className="space-y-3">
              <motion.label 
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={config.removeOld}
                  onChange={(e) => {
                    setConfig(prev => ({ ...prev, removeOld: e.target.checked }));
                    if (e.target.checked) {
                      setCurrentXP(prev => prev + 10);
                      toast({ title: "+10 XP", description: "Old motor removal added" });
                    }
                  }}
                  className="w-5 h-5"
                />
                <div className="flex-1">
                  <span className="font-semibold">Remove & Dispose Old Motor</span>
                  <span className="text-sm text-gray-600 ml-2">+2 hours labour</span>
                </div>
                <span className="text-yellow-600 font-bold text-sm">+10 XP</span>
              </motion.label>
              
              <motion.label 
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={config.waterTest}
                  onChange={(e) => {
                    setConfig(prev => ({ ...prev, waterTest: e.target.checked }));
                    if (e.target.checked && !config.waterTest) {
                      setCurrentXP(prev => prev + 5);
                      toast({ title: "+5 XP", description: "Water test included" });
                    }
                  }}
                  className="w-5 h-5"
                />
                <div className="flex-1">
                  <span className="font-semibold">Water Test & Prop Optimization</span>
                  <span className="text-sm text-gray-600 ml-2">Recommended</span>
                </div>
                <span className="text-yellow-600 font-bold text-sm">+5 XP</span>
              </motion.label>
            </div>
          </motion.div>
        )}

        {/* Complete Button */}
        {config.controls && config.steering && config.gauges && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <button
              onClick={handleComplete}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transform hover:scale-[1.02] transition-all"
            >
              Complete Configuration & View Quote
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
