// src/components/quote-builder/InstallationConfig.tsx
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import OptionGallery from "../OptionGallery";
import { controlChoices, steeringChoices, tillerMountingChoices } from "@/config/visualChoices";
import confetti from "canvas-confetti";
import { isTillerMotor } from "@/lib/utils";
import { useSound } from '@/contexts/SoundContext';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BoatInfo {
  controlsOption?: string;
  [key: string]: any;
}

interface InstallationConfigProps {
  selectedMotor: any;
  boatInfo?: BoatInfo | null;
  onComplete: (config: any) => void;
}

export default function InstallationConfig({ selectedMotor, boatInfo, onComplete }: InstallationConfigProps) {
  const isTiller = isTillerMotor(selectedMotor?.model || '');
  const { playCelebration } = useSound();
  
  const [config, setConfig] = useState({
    controls: 'side_mount',
    steering: 'cable',
    gauges: '',
    mounting: '',
    waterTest: true
  });

  const triggerComplete = (updatedConfig: typeof config) => {
    const selectedMounting = tillerMountingChoices.find(choice => choice.value === updatedConfig.mounting);
    const installationCost = selectedMounting?.price || 0;
    const recommendedPackage = selectedMounting?.recommendedPackage || 'good';
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    playCelebration();
    
    onComplete({
      ...updatedConfig,
      installationCost,
      recommendedPackage
    });
  };

  // For non-tiller motors, auto-complete immediately with defaults
  useEffect(() => {
    if (!isTiller) {
      const defaultConfig = {
        ...config,
        controls: boatInfo?.controlsOption === 'adapter' ? 'existing_adapter' 
                : boatInfo?.controlsOption === 'compatible' ? 'existing_compatible'
                : 'side_mount',
        steering: 'cable',
      };
      setConfig(defaultConfig);
      setTimeout(() => {
        triggerComplete(defaultConfig);
      }, 300);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOptionSelect = (field: string, value: string) => {
    const updatedConfig = { ...config, [field]: value };
    setConfig(updatedConfig);
    
    if (isTiller) {
      setTimeout(() => {
        triggerComplete(updatedConfig);
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
        {!isTiller && (
          <>
            <h2 className="text-3xl font-light tracking-wide text-foreground mb-2">
              Configure Your Installation
            </h2>
            <p className="text-muted-foreground font-normal mb-4">
              Tell us what rigging is currently on your boat — we'll confirm everything during your consultation.
            </p>
            
            {/* Skip shortcut for uncertain users */}
            {!hasExistingControls && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-8"
              >
                <Button
                  variant="outline"
                  onClick={handleSkipWithDefaults}
                  className="border-primary/30 hover:border-primary hover:bg-primary/5 text-foreground font-normal gap-2"
                >
                  <Zap className="w-4 h-4 text-primary" />
                  Not sure? Use the most common setup
                </Button>
              </motion.div>
            )}
          </>
        )}

        {/* Confirmation banner when controls step is skipped */}
        {!isTiller && hasExistingControls && (
          <Alert className="mb-6 border-green-600 bg-green-50 dark:bg-green-950/30">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <strong>Using your existing controls</strong> — 
              {boatInfo?.controlsOption === 'adapter' 
                ? " We'll install a harness adapter (+$125)"
                : " No additional control hardware needed"}
            </AlertDescription>
          </Alert>
        )}

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
        {!isTiller && step >= 1 && !hasExistingControls && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <OptionGallery
              title="What type of controls does your boat have?"
              choices={controlChoices}
              value={config.controls}
              onChange={(val) => handleOptionSelect('controls', val)}
              recommended="side_mount"
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
              title="What type of steering does your boat have?"
              choices={steeringChoices}
              value={config.steering}
              onChange={(val) => handleOptionSelect('steering', val)}
              recommended="cable"
            />
          </motion.div>
        )}

        {/* Gauges step hidden for now — gaugeChoices remains in visualChoices.ts */}

        {/* Reassurance note */}
        {!isTiller && (
          <p className="text-sm text-muted-foreground mt-6 italic">
            Not sure what you have? No worries — just pick your best guess and we'll sort it out when we see the boat.
          </p>
        )}
      </motion.div>
    </div>
  );
}
