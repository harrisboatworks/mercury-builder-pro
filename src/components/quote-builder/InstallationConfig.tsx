// src/components/quote-builder/InstallationConfig.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import OptionGallery from "../OptionGallery";
import { controlChoices, steeringChoices, gaugeChoices, tillerMountingChoices } from "@/config/visualChoices";
import confetti from "canvas-confetti";
import { useToast } from "@/hooks/use-toast";
import { isTillerMotor } from "@/lib/utils";

interface InstallationConfigProps {
  selectedMotor: any;
  onComplete: (config: any) => void;
}

export default function InstallationConfig({ selectedMotor, onComplete }: InstallationConfigProps) {
  const [step, setStep] = useState(1);
  const isTiller = isTillerMotor(selectedMotor?.model || '');
  const [config, setConfig] = useState({
    controls: '',
    steering: '',
    gauges: '',
    mounting: '',
    removeOld: false,
    waterTest: true
  });
  const { toast } = useToast();

  const totalSteps = isTiller ? 2 : 4;

  const handleOptionSelect = (field: string, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    
    // Auto-advance to next step
    setTimeout(() => {
      if (step < totalSteps - 1) {
        setStep(step + 1);
      }
    }, 500);
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
      description: "Your installation configuration is ready!",
    });
    
    onComplete(config);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-6xl mx-auto"
      >
        <h2 className="text-3xl font-bold text-[#2A4D69] mb-2">
          {isTiller ? 'Configure Your Tiller Installation' : 'Configure Your Installation'}
        </h2>
        <p className="text-gray-600 mb-8">
          {isTiller 
            ? `Select your mounting and service options for the ${selectedMotor?.model}`
            : `Select your rigging options for the ${selectedMotor?.model}`
          }
        </p>

        {/* Tiller Motor Flow - Step 1: Mounting */}
        {isTiller && step >= 1 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <OptionGallery
              title="Step 1: Choose Your Mounting Option"
              choices={tillerMountingChoices}
              value={config.mounting}
              onChange={(val) => handleOptionSelect('mounting', val)}
            />
          </motion.div>
        )}

        {/* Non-Tiller Motor Flow */}
        {!isTiller && step >= 1 && (
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
              onChange={(val) => handleOptionSelect('controls', val)}
            />
          </motion.div>
        )}

        {!isTiller && step >= 2 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <OptionGallery
              title="Step 2: Select Steering Type"
              choices={steeringChoices}
              value={config.steering}
              onChange={(val) => handleOptionSelect('steering', val)}
            />
          </motion.div>
        )}

        {!isTiller && step >= 3 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <OptionGallery
              title="Step 3: Pick Your Gauge Package"
              choices={gaugeChoices}
              value={config.gauges}
              onChange={(val) => handleOptionSelect('gauges', val)}
            />
          </motion.div>
        )}

        {/* Additional Services */}
        {((isTiller && step >= 2) || (!isTiller && step >= 4)) && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mt-6"
          >
            <h3 className="text-xl font-bold mb-4">{isTiller ? 'Step 2' : 'Step 4'}: Additional Services</h3>
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
                  }}
                  className="w-5 h-5"
                />
                <div className="flex-1">
                  <span className="font-semibold">Remove & Dispose Old Motor</span>
                  <span className="text-sm text-gray-600 ml-2">+2 hours labour</span>
                </div>
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
                  }}
                  className="w-5 h-5"
                />
                <div className="flex-1">
                  <span className="font-semibold">Water Test & Prop Optimization</span>
                  <span className="text-sm text-gray-600 ml-2">Recommended</span>
                </div>
              </motion.label>
            </div>
          </motion.div>
        )}

        {/* Complete Button */}
        {(isTiller ? config.mounting : (config.controls && config.steering && config.gauges)) && (
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
