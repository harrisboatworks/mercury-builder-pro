// src/components/quote-builder/InstallationConfig.tsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import OptionGallery from "../OptionGallery";
import { tillerMountingChoices } from "@/config/visualChoices";
import confetti from "canvas-confetti";
import { isTillerMotor } from "@/lib/utils";
import { useSound } from '@/contexts/SoundContext';

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

  // For non-tiller motors, show nothing (auto-completing)
  if (!isTiller) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Setting up your installation...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="max-w-6xl mx-auto">
        <OptionGallery
          title="Choose Your Mounting Option"
          choices={tillerMountingChoices}
          value={config.mounting}
          onChange={(val) => handleOptionSelect('mounting', val)}
        />
      </div>
    </div>
  );
}
