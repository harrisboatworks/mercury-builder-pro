// src/components/quote-builder/InstallationConfig.tsx
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import OptionGallery from "../OptionGallery";
import { controlChoices, steeringChoices, gaugeChoices, tillerMountingChoices } from "@/config/visualChoices";
import confetti from "canvas-confetti";
import { isTillerMotor } from "@/lib/utils";
import { useSound } from '@/contexts/SoundContext';

interface InstallationConfigProps {
  selectedMotor: any;
  onComplete: (config: any) => void;
}

export default function InstallationConfig({ selectedMotor, onComplete }: InstallationConfigProps) {
  const [step, setStep] = useState(1);
  const isTiller = isTillerMotor(selectedMotor?.model || '');
  const { playSwoosh, playCelebration } = useSound();
  const [config, setConfig] = useState({
    controls: '',
    steering: '',
    gauges: '',
    mounting: '',
    waterTest: true // Always included - shows on quote for added value
  });

  // Refs for scroll targets
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);

  // Scroll to new step when it appears (non-tiller flow)
  useEffect(() => {
    if (!isTiller && step >= 2) {
      const refs = [null, null, step2Ref, step3Ref];
      const targetRef = refs[step];
      if (targetRef?.current) {
        setTimeout(() => {
          targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [step, isTiller]);

  const triggerComplete = (updatedConfig: typeof config) => {
    // Get selected mounting option details for tiller motors
    const selectedMounting = tillerMountingChoices.find(choice => choice.value === updatedConfig.mounting);
    const installationCost = selectedMounting?.price || 0;
    const recommendedPackage = selectedMounting?.recommendedPackage || 'good';
    
    // Celebration!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    playCelebration();
    
    // Pass installation cost and recommended package to parent
    onComplete({
      ...updatedConfig,
      installationCost,
      recommendedPackage
    });
  };

  const handleOptionSelect = (field: string, value: string) => {
    const updatedConfig = { ...config, [field]: value };
    setConfig(updatedConfig);
    
    if (isTiller) {
      // For tiller motors, auto-complete after mounting selection
      setTimeout(() => {
        triggerComplete(updatedConfig);
      }, 400);
    } else {
      // For non-tiller motors, advance to next step or complete
      setTimeout(() => {
        if (field === 'gauges') {
          // Final step - auto-complete
          triggerComplete(updatedConfig);
        } else if (step < 3) {
          playSwoosh(); // Play swoosh on step transition
          setStep(step + 1);
        }
      }, 400);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-6xl mx-auto"
      >
        <h2 className="text-3xl font-light tracking-wide text-foreground mb-2">
          {isTiller ? 'Configure Your Tiller Installation' : 'Configure Your Installation'}
        </h2>
        <p className="text-gray-600 font-light mb-8">
          {isTiller 
            ? `Select your mounting option for the ${selectedMotor?.model}`
            : `Select your rigging options for the ${selectedMotor?.model}`
          }
        </p>

        {/* Tiller Motor Flow - Mounting Options */}
        {isTiller && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <OptionGallery
              title="Choose Your Mounting Option"
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
            ref={step2Ref}
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
            ref={step3Ref}
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
      </motion.div>
    </div>
  );
}
