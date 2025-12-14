import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MotorGroup } from '@/hooks/useGroupedMotors';
import { Motor } from '@/components/QuoteBuilder';
import { MOTOR_CODES, SHAFT_LENGTHS } from '@/lib/motor-codes';
import { ArrowLeft, ArrowRight, Check, HelpCircle } from 'lucide-react';
import { TransomHeightCalculator } from './TransomHeightCalculator';

interface MotorConfiguratorModalProps {
  open: boolean;
  onClose: () => void;
  group: MotorGroup | null;
  onSelectMotor: (motor: Motor) => void;
}

type Step = 'start' | 'shaft' | 'control' | 'features' | 'result';

interface ConfigState {
  startType: 'electric' | 'manual' | null;
  shaftLength: string | null;
  controlType: 'tiller' | 'remote' | null;
  features: string[];
}

export function MotorConfiguratorModal({ open, onClose, group, onSelectMotor }: MotorConfiguratorModalProps) {
  const [step, setStep] = useState<Step>('start');
  const [config, setConfig] = useState<ConfigState>({
    startType: null,
    shaftLength: null,
    controlType: null,
    features: []
  });
  const [showTransomCalculator, setShowTransomCalculator] = useState(false);
  
  // Reset when modal opens
  React.useEffect(() => {
    if (open) {
      setStep('start');
      setConfig({ startType: null, shaftLength: null, controlType: null, features: [] });
    }
  }, [open]);
  
  // Filter variants based on current selections
  const filteredVariants = useMemo(() => {
    if (!group) return [];
    
    let variants = [...group.variants];
    
    if (config.startType) {
      variants = variants.filter(m => {
        const model = m.model.toUpperCase();
        if (config.startType === 'electric') {
          return model.includes('E') && !model.includes('SEA');
        }
        return model.includes('M') && !model.includes('COMMAND');
      });
    }
    
    if (config.shaftLength) {
      variants = variants.filter(m => {
        const model = m.model.toUpperCase();
        const inches = parseInt(config.shaftLength!);
        if (inches === 30) return model.includes('XXL');
        if (inches === 25) return model.includes('XL') && !model.includes('XXL');
        if (inches === 20) return model.includes('L') && !model.includes('XL');
        if (inches === 15) return model.includes('MH') || model.includes('S');
        return true;
      });
    }
    
    if (config.controlType) {
      variants = variants.filter(m => {
        const model = m.model.toUpperCase();
        if (config.controlType === 'tiller') {
          return model.includes('H') || model.includes('TILLER');
        }
        return !model.includes('H') || model.includes('REMOTE');
      });
    }
    
    if (config.features.includes('CT')) {
      variants = variants.filter(m => m.model.toUpperCase().includes('CT'));
    }
    
    if (config.features.includes('PT')) {
      variants = variants.filter(m => m.model.toUpperCase().includes('PT'));
    }
    
    return variants;
  }, [group, config]);
  
  // Get available options based on remaining variants
  const availableOptions = useMemo(() => {
    const variants = filteredVariants.length > 0 ? filteredVariants : group?.variants || [];
    
    return {
      hasElectric: variants.some(m => m.model.toUpperCase().includes('E') && !m.model.toUpperCase().includes('SEA')),
      hasManual: variants.some(m => m.model.toUpperCase().includes('M') && !m.model.toUpperCase().includes('COMMAND')),
      hasTiller: variants.some(m => m.model.toUpperCase().includes('H')),
      hasRemote: variants.some(m => !m.model.toUpperCase().includes('H')),
      hasCT: variants.some(m => m.model.toUpperCase().includes('CT')),
      hasPT: variants.some(m => m.model.toUpperCase().includes('PT')),
      shaftLengths: group?.features.shaftLengths || []
    };
  }, [filteredVariants, group]);
  
  const handleBack = () => {
    const steps: Step[] = ['start', 'shaft', 'control', 'features', 'result'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };
  
  const handleNext = () => {
    const steps: Step[] = ['start', 'shaft', 'control', 'features', 'result'];
    const currentIndex = steps.indexOf(step);
    
    // Auto-skip control step if only one option available
    if (step === 'shaft') {
      const onlyTiller = availableOptions.hasTiller && !availableOptions.hasRemote;
      const onlyRemote = availableOptions.hasRemote && !availableOptions.hasTiller;
      
      if (onlyTiller) {
        setConfig(prev => ({ ...prev, controlType: 'tiller' }));
        // Skip to features or result
        if (!availableOptions.hasCT && !availableOptions.hasPT) {
          setStep('result');
        } else {
          setStep('features');
        }
        return;
      }
      if (onlyRemote) {
        setConfig(prev => ({ ...prev, controlType: 'remote' }));
        if (!availableOptions.hasCT && !availableOptions.hasPT) {
          setStep('result');
        } else {
          setStep('features');
        }
        return;
      }
    }
    
    // Skip features step if no features available
    if (step === 'control' && !availableOptions.hasCT && !availableOptions.hasPT) {
      setStep('result');
      return;
    }
    
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };
  
  const handleShaftFromCalculator = (inches: number) => {
    const shaft = SHAFT_LENGTHS.find(s => s.inches === inches);
    if (shaft) {
      setConfig(prev => ({ ...prev, shaftLength: `${shaft.inches}"` }));
      setShowTransomCalculator(false);
    }
  };
  
  const handleSelectMotor = (motor: Motor) => {
    onSelectMotor(motor);
    onClose();
  };
  
  if (!group) return null;
  
  const stepNumber = ['start', 'shaft', 'control', 'features', 'result'].indexOf(step) + 1;
  
  return (
    <>
      <Dialog open={open && !showTransomCalculator} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Configure Your {group.hp} HP Motor
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              Step {stepNumber} of 5 • {filteredVariants.length} option{filteredVariants.length !== 1 ? 's' : ''} match your selection
            </p>
          </DialogHeader>
          
          <div className="mt-6">
            {/* Step 1: Start Type */}
            {step === 'start' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">
                  How do you want to start your motor?
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {availableOptions.hasElectric && (
                    <button
                      onClick={() => {
                        setConfig(prev => ({ ...prev, startType: 'electric' }));
                        handleNext();
                      }}
                      className={`p-6 rounded-lg border-2 transition-all text-left ${
                        config.startType === 'electric'
                          ? 'border-black bg-gray-50'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <span className="text-3xl block mb-3">⚡</span>
                      <span className="font-semibold text-gray-900 block">Electric Start</span>
                      <span className="text-sm text-gray-500 mt-1 block">
                        Push-button convenience
                      </span>
                    </button>
                  )}
                  
                  {availableOptions.hasManual && (
                    <button
                      onClick={() => {
                        setConfig(prev => ({ ...prev, startType: 'manual' }));
                        handleNext();
                      }}
                      className={`p-6 rounded-lg border-2 transition-all text-left ${
                        config.startType === 'manual'
                          ? 'border-black bg-gray-50'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <span className="text-3xl block mb-3">🔧</span>
                      <span className="font-semibold text-gray-900 block">Manual Start</span>
                      <span className="text-sm text-gray-500 mt-1 block">
                        Pull cord — simple & reliable
                      </span>
                    </button>
                  )}
                </div>
                
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  Most customers prefer electric start for convenience
                </p>
              </div>
            )}
            
            {/* Step 2: Shaft Length */}
            {step === 'shaft' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">
                  What shaft length do you need?
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {SHAFT_LENGTHS.map(shaft => {
                    const isAvailable = availableOptions.shaftLengths.includes(`${shaft.inches}"`);
                    if (!isAvailable) return null;
                    
                    return (
                      <button
                        key={shaft.code}
                        onClick={() => {
                          setConfig(prev => ({ ...prev, shaftLength: `${shaft.inches}"` }));
                          handleNext();
                        }}
                        className={`p-4 rounded-lg border-2 transition-all text-center ${
                          config.shaftLength === `${shaft.inches}"`
                            ? 'border-black bg-gray-50'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <span className="font-semibold text-gray-900 block">{shaft.inches}"</span>
                        <span className="text-xs text-gray-500 block mt-1">{shaft.name}</span>
                        <span className="text-xs text-gray-400 block mt-0.5">{shaft.transomRange}</span>
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setShowTransomCalculator(true)}
                  className="w-full text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center gap-2 py-3 border-t border-gray-100 mt-4 transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                  Not sure? Measure your transom
                </button>
              </div>
            )}
            
            {/* Step 3: Control Type */}
            {step === 'control' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">
                  How do you want to steer?
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {availableOptions.hasTiller && (
                    <button
                      onClick={() => {
                        setConfig(prev => ({ ...prev, controlType: 'tiller' }));
                        handleNext();
                      }}
                      className={`p-6 rounded-lg border-2 transition-all text-left ${
                        config.controlType === 'tiller'
                          ? 'border-black bg-gray-50'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <img 
                        src="https://www.mercurymarine.com/sp/en/gauges-and-controls/controls/tiller-handles/_jcr_content/root/container/pagesection_52925364/columnrow_copy_copy_/item_1695064113060/image_copy.coreimg.100.1280.png/1742304095249/mm-ga-co-controls-tiller-product-3.png"
                        alt="Tiller Handle"
                        className="w-12 h-12 object-contain mb-3"
                      />
                      <span className="font-semibold text-gray-900 block">Tiller Handle</span>
                      <span className="text-sm text-gray-500 mt-1 block">
                        Sit at the back, steer directly
                      </span>
                    </button>
                  )}
                  
                  {availableOptions.hasRemote && (
                    <button
                      onClick={() => {
                        setConfig(prev => ({ ...prev, controlType: 'remote' }));
                        handleNext();
                      }}
                      className={`p-6 rounded-lg border-2 transition-all text-left ${
                        config.controlType === 'remote'
                          ? 'border-black bg-gray-50'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <span className="text-3xl block mb-3">🚗</span>
                      <span className="font-semibold text-gray-900 block">Remote Control</span>
                      <span className="text-sm text-gray-500 mt-1 block">
                        Steering wheel & console
                      </span>
                    </button>
                  )}
                </div>
                
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  Boats under 16ft often use tiller steering
                </p>
              </div>
            )}
            
            {/* Step 4: Special Features */}
            {step === 'features' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Any special features needed?
                </h3>
                
                <div className="space-y-3">
                  {availableOptions.hasCT && (
                    <button
                      onClick={() => {
                        setConfig(prev => ({
                          ...prev,
                          features: prev.features.includes('CT')
                            ? prev.features.filter(f => f !== 'CT')
                            : [...prev.features, 'CT']
                        }));
                      }}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center justify-between ${
                        config.features.includes('CT')
                          ? 'border-black bg-gray-50'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <div>
                        <span className="font-semibold text-gray-900">Command Thrust (CT)</span>
                        <span className="text-sm text-gray-500 block mt-0.5">
                          Larger gearcase for heavy boats & superior control
                        </span>
                      </div>
                      {config.features.includes('CT') && <Check className="w-5 h-5 text-green-600" />}
                    </button>
                  )}
                  
                  {availableOptions.hasPT && (
                    <button
                      onClick={() => {
                        setConfig(prev => ({
                          ...prev,
                          features: prev.features.includes('PT')
                            ? prev.features.filter(f => f !== 'PT')
                            : [...prev.features, 'PT']
                        }));
                      }}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center justify-between ${
                        config.features.includes('PT')
                          ? 'border-black bg-gray-50'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <div>
                        <span className="font-semibold text-gray-900">Power Trim & Tilt (PT)</span>
                        <span className="text-sm text-gray-500 block mt-0.5">
                          Adjust motor angle from the helm
                        </span>
                      </div>
                      {config.features.includes('PT') && <Check className="w-5 h-5 text-green-600" />}
                    </button>
                  )}
                </div>
                
                <Button 
                  onClick={handleNext}
                  className="w-full mt-4"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
            
            {/* Step 5: Results */}
            {step === 'result' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {filteredVariants.length === 1 ? '✓ Your Perfect Match' : `${filteredVariants.length} Motors Match`}
                </h3>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredVariants.map(motor => (
                    <div
                      key={motor.id}
                      className="p-4 rounded-lg border border-gray-200 hover:border-gray-400 transition-all cursor-pointer flex items-center gap-4"
                      onClick={() => handleSelectMotor(motor)}
                    >
                      <img 
                        src={motor.image || '/lovable-uploads/speedboat-transparent.png'} 
                        alt={motor.model}
                        className="w-20 h-20 object-contain"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{motor.model}</h4>
                        <p className="text-sm text-gray-500">{motor.specs}</p>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          ${motor.price.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        {motor.in_stock && (
                          <span className="text-xs text-green-600 font-medium">In Stock</span>
                        )}
                        <Button size="sm" className="mt-2">
                          Select
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {filteredVariants.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No motors match your exact criteria.</p>
                    <Button variant="outline" onClick={() => setStep('start')} className="mt-4">
                      Start Over
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Navigation */}
          {step !== 'start' && step !== 'result' && (
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button variant="outline" onClick={handleNext}>
                Skip
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
          
          {step === 'result' && filteredVariants.length > 0 && (
            <div className="flex justify-start mt-8 pt-6 border-t">
              <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Options
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Transom Height Calculator */}
      <TransomHeightCalculator
        open={showTransomCalculator}
        onClose={() => setShowTransomCalculator(false)}
        onApply={handleShaftFromCalculator}
      />
    </>
  );
}
