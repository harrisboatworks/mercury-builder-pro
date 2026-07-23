// src/components/quote-builder/InstallationConfig.tsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import OptionGallery from "../OptionGallery";
import { tillerMountingChoices } from "@/config/visualChoices";
import confetti from "canvas-confetti";
import { isTillerMotor } from "@/lib/utils";
import { useSound } from '@/contexts/SoundContext';
import { Button } from '@/components/ui/button';
import { Check, Gauge, RefreshCw } from 'lucide-react';
import { getPropellerAllowance } from '@/lib/propeller-allowance';
import { includesPropeller } from '@/lib/motor-helpers';
import {
  isSameHpMercuryTrade,
  resolvePropellerDecision,
  type PropellerDecision,
} from '@/lib/propeller-selection';

interface BoatInfo {
  controlsOption?: string;
  hasCompatibleProp?: boolean;
}

interface InstallationSelection {
  controls: string;
  steering: string;
  gauges: string;
  mounting: string;
  waterTest: boolean;
  propellerDecision?: PropellerDecision;
}

interface InstallationConfigProps {
  selectedMotor: {
    model?: string;
    model_display?: string;
    hp?: number | string;
    horsepower?: number | string;
  };
  boatInfo?: BoatInfo | null;
  initialConfig?: Partial<InstallationSelection> | null;
  tradeInInfo?: {
    hasTradeIn?: boolean;
    brand?: string;
    horsepower?: number | string;
  } | null;
  onComplete: (config: InstallationSelection & {
    installationCost: number;
    recommendedPackage: string;
  }) => void;
}

export default function InstallationConfig({ selectedMotor, boatInfo, initialConfig, tradeInInfo, onComplete }: InstallationConfigProps) {
  const isTiller = isTillerMotor(selectedMotor?.model || '');
  const { playCelebration } = useSound();

  const hp = Number(selectedMotor?.hp || selectedMotor?.horsepower || 0);
  const propAllowance = getPropellerAllowance(hp);
  const needsPropellerChoice = Boolean(propAllowance && !includesPropeller({
    ...selectedMotor,
    hp,
  } as Parameters<typeof includesPropeller>[0]));
  const isMercuryTradeMatch = isSameHpMercuryTrade(tradeInInfo, hp);

  const [config, setConfig] = useState<InstallationSelection>(() => ({
    controls: initialConfig?.controls || (boatInfo?.controlsOption === 'adapter'
      ? 'existing_adapter'
      : boatInfo?.controlsOption === 'compatible'
        ? 'existing_compatible'
        : 'side_mount'),
    steering: initialConfig?.steering || 'cable',
    gauges: initialConfig?.gauges || '',
    mounting: initialConfig?.mounting || '',
    waterTest: initialConfig?.waterTest ?? true,
    propellerDecision: needsPropellerChoice
      ? initialConfig?.propellerDecision || resolvePropellerDecision({ hp, boatInfo, tradeInInfo })
      : undefined,
  }));

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

  // Motors with an included propeller need no additional question. Preserve
  // the existing automatic transition for remote motors under 25 HP.
  useEffect(() => {
    if (!isTiller && !needsPropellerChoice) {
      const timer = setTimeout(() => {
        triggerComplete(config);
      }, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOptionSelect = (field: string, value: string) => {
    const updatedConfig = { ...config, [field]: value };
    setConfig(updatedConfig);
    
    if (isTiller && !needsPropellerChoice) {
      setTimeout(() => {
        triggerComplete(updatedConfig);
      }, 400);
    }
  };

  const handlePropellerSelect = (propellerDecision: PropellerDecision) => {
    setConfig((current) => ({ ...current, propellerDecision }));
  };

  const handleContinue = () => {
    triggerComplete(config);
  };

  // For remote motors with an included propeller, show only the brief
  // transition state while the existing automatic completion runs.
  if (!isTiller && !needsPropellerChoice) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Setting up your installation...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="max-w-6xl mx-auto">
        {isTiller ? (
          <OptionGallery
            title="Choose Your Mounting Option"
            choices={tillerMountingChoices}
            value={config.mounting}
            onChange={(val) => handleOptionSelect('mounting', val)}
          />
        ) : null}

        {needsPropellerChoice && propAllowance ? (
          <section className={isTiller ? 'mt-8' : ''} aria-labelledby="propeller-choice-heading">
            <div className="mb-5 text-center">
              <p className="mb-2 font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-repower-mercury-red">
                Propeller
              </p>
              <h2 id="propeller-choice-heading" className="font-display text-2xl font-semibold text-repower-navy-900 sm:text-3xl">
                Do you need a propeller?
              </h2>
              <p className="mx-auto mt-3 max-w-2xl font-sans text-sm leading-relaxed text-repower-navy-900/70 sm:text-base">
                Mercury outboards 25 HP and up do not include a propeller. We include an allowance by default so your quote is complete, then match the final size to your boat during water testing.
              </p>
            </div>

            {isMercuryTradeMatch && config.propellerDecision === 'reuse_existing' ? (
              <div className="mx-auto mb-4 max-w-2xl rounded-sm border border-repower-navy-900/15 bg-repower-cream px-4 py-3 text-left font-sans text-sm text-repower-navy-900/75">
                Your trade-in is a Mercury with the same horsepower, so reuse is selected automatically. We will still verify fit and performance on the water.
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                aria-pressed={config.propellerDecision === 'include_allowance'}
                onClick={() => handlePropellerSelect('include_allowance')}
                className={`min-h-[168px] rounded-sm border-2 p-5 text-left transition-colors ${
                  config.propellerDecision === 'include_allowance'
                    ? 'border-repower-mercury-red bg-repower-mercury-red/[0.04]'
                    : 'border-repower-navy-900/15 bg-repower-cream hover:border-repower-gold/60'
                }`}
              >
                <span className="mb-3 flex items-center justify-between gap-3">
                  <Gauge className="h-6 w-6 text-repower-mercury-red" aria-hidden="true" />
                  {config.propellerDecision === 'include_allowance' ? (
                    <Check className="h-5 w-5 text-repower-mercury-red" aria-hidden="true" />
                  ) : null}
                </span>
                <strong className="block font-display text-xl text-repower-navy-900">Include a matched propeller</strong>
                <span className="mt-1 block font-sans text-sm font-semibold text-repower-mercury-red">
                  +${propAllowance.price.toLocaleString('en-CA')} allowance
                </span>
                <span className="mt-2 block font-sans text-sm leading-relaxed text-repower-navy-900/65">
                  {hp >= 150 ? 'Stainless steel' : 'Aluminum'} propeller, with final size confirmed during our water test.
                </span>
              </button>

              <button
                type="button"
                aria-pressed={config.propellerDecision === 'reuse_existing'}
                onClick={() => handlePropellerSelect('reuse_existing')}
                className={`min-h-[168px] rounded-sm border-2 p-5 text-left transition-colors ${
                  config.propellerDecision === 'reuse_existing'
                    ? 'border-repower-mercury-red bg-repower-mercury-red/[0.04]'
                    : 'border-repower-navy-900/15 bg-repower-cream hover:border-repower-gold/60'
                }`}
              >
                <span className="mb-3 flex items-center justify-between gap-3">
                  <RefreshCw className="h-6 w-6 text-repower-navy-900/70" aria-hidden="true" />
                  {config.propellerDecision === 'reuse_existing' ? (
                    <Check className="h-5 w-5 text-repower-mercury-red" aria-hidden="true" />
                  ) : null}
                </span>
                <strong className="block font-display text-xl text-repower-navy-900">I already have a propeller</strong>
                <span className="mt-1 block font-sans text-sm font-semibold text-repower-navy-900/70">No propeller allowance</span>
                <span className="mt-2 block font-sans text-sm leading-relaxed text-repower-navy-900/65">
                  We will confirm fit and performance during water testing. If a different propeller is needed, we will confirm the cost first.
                </span>
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                type="button"
                onClick={handleContinue}
                disabled={isTiller && !config.mounting}
                className="min-h-[48px] w-full rounded-sm bg-repower-mercury-red px-7 font-sans font-semibold text-white hover:bg-repower-mercury-red/90 sm:w-auto"
              >
                Continue to Offers
              </Button>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
