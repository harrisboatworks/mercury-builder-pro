import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PremiumShell from '@/components/layout/PremiumShell';
import StepHeader from '@/components/ui/StepHeader';
import PremiumChoiceCard from '@/components/ui/PremiumChoiceCard';
import { useQuote } from '@/contexts/QuoteContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface InstallConfig {
  controls?: string;
  steering?: string; 
  gauges?: string;
  mounting?: string;
  removeOld?: boolean;
  waterTest?: boolean;
}

export default function InstallationPage() {
  const navigate = useNavigate();
  const { state, dispatch, isStepAccessible } = useQuote();
  const [config, setConfig] = useState<InstallConfig>({});
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    // Add defensive checks
    if (!state || !state.motor) {
      navigate('/quote/motor-selection');
      return;
    }
    
    // Only accessible for installed path
    if (!isStepAccessible(5) || state.purchasePath !== 'installed') {
      navigate('/quote/motor-selection');
      return;
    }

    document.title = 'Installation Configuration | Harris Boat Works';
    
    let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!desc) {
      desc = document.createElement('meta');
      desc.name = 'description';
      document.head.appendChild(desc);
    }
    desc.content = 'Configure your professional motor installation requirements and timeline.';
  }, [state.purchasePath, isStepAccessible, navigate]);

  const handleStepComplete = (installConfig: InstallConfig) => {
    dispatch({ type: 'SET_INSTALL_CONFIG', payload: installConfig });
    dispatch({ type: 'COMPLETE_STEP', payload: 5 });
    navigate('/quote/summary');
  };

  const handleBack = () => {
    navigate('/quote/trade-in');
  };

  const handleOptionSelect = (field: string, value: string) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    
    // Auto-advance to next step after selection
    setTimeout(() => {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      }
    }, 300);
  };

  const handleComplete = () => {
    handleStepComplete(config);
  };

  const isTillerMotor = false; // Simplified for premium layout
  const totalSteps = isTillerMotor ? 3 : 4;
  const canComplete = Object.keys(config).length >= totalSteps - 1;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <StepHeader 
              label="Controls" 
              help="Choose how you'll operate the motor."
            >
              <div className="text-sm p-quiet">
                We'll verify fit before billing. Not sure? Pick recommended and upload a photo later.
              </div>
            </StepHeader>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <PremiumChoiceCard
                title="Side-Mount Control"
                subtitle="Compact console mount"
                selected={config.controls === 'side-mount'}
                onSelect={() => handleOptionSelect('controls', 'side-mount')}
                recommended
              />
              <PremiumChoiceCard
                title="Binnacle Control"
                subtitle="Top-mount helm"
                selected={config.controls === 'binnacle'}
                onSelect={() => handleOptionSelect('controls', 'binnacle')}
              />
              <PremiumChoiceCard
                title="DTS Digital Control"
                subtitle="Smooth digital precision"
                selected={config.controls === 'dts'}
                onSelect={() => handleOptionSelect('controls', 'dts')}
              />
            </div>
          </div>
        );
      
      case 2:
        if (isTillerMotor) {
          setCurrentStep(3);
          return null;
        }
        return (
          <div>
            <StepHeader 
              label="Steering" 
              help="Select your preferred steering system."
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <PremiumChoiceCard
                title="Mechanical Steering"
                subtitle="Traditional cable steering"
                selected={config.steering === 'mechanical'}
                onSelect={() => handleOptionSelect('steering', 'mechanical')}
                recommended
              />
              <PremiumChoiceCard
                title="Power Assist Steering"
                subtitle="Hydraulic power assist"
                selected={config.steering === 'power'}
                onSelect={() => handleOptionSelect('steering', 'power')}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <StepHeader 
              label="Gauges & Display" 
              help="Choose your instrument package."
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <PremiumChoiceCard
                title="Basic Tach"
                subtitle="Essential RPM monitoring"
                selected={config.gauges === 'basic'}
                onSelect={() => handleOptionSelect('gauges', 'basic')}
              />
              <PremiumChoiceCard
                title="VesselView Display"
                subtitle="Complete engine monitoring"
                selected={config.gauges === 'vesselview'}
                onSelect={() => handleOptionSelect('gauges', 'vesselview')}
                recommended
              />
              <PremiumChoiceCard
                title="Smart Craft Display"
                subtitle="Advanced diagnostics"
                selected={config.gauges === 'smartcraft'}
                onSelect={() => handleOptionSelect('gauges', 'smartcraft')}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div>
            <StepHeader 
              label="Installation Services" 
              help="Additional professional services."
            />
            <div className="space-y-3">
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50">
                <input
                  type="checkbox"
                  checked={config.removeOld || false}
                  onChange={(e) => setConfig({ ...config, removeOld: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <span className="text-sm font-medium">Remove & Dispose Old Motor</span>
                <span className="ml-auto text-sm text-slate-500">$200</span>
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50">
                <input
                  type="checkbox"
                  checked={config.waterTest || false}
                  onChange={(e) => setConfig({ ...config, waterTest: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <span className="text-sm font-medium">Water Test & Prop Optimization</span>
                <span className="ml-auto text-sm text-slate-500">$150</span>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <PremiumShell 
      title="Configure Installation"
      subtitle="Choose the essentials. You can fine-tune later."
    >
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Trade-In
        </Button>
      </div>
      
      <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {renderStep()}
        
        {canComplete && (
          <div className="mt-6 flex justify-end">
            <Button onClick={handleComplete} className="px-6">
              Complete Configuration
            </Button>
          </div>
        )}
      </div>
    </PremiumShell>
  );
}