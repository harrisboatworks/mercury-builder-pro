import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { MotorGroup } from '@/hooks/useGroupedMotors';
import { Motor } from '@/components/QuoteBuilder';
import { MOTOR_CODES, SHAFT_LENGTHS } from '@/lib/motor-codes';
import { ArrowLeft, ArrowRight, Check, HelpCircle, X } from 'lucide-react';
import { TransomHeightCalculator } from './TransomHeightCalculator';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuote } from '@/contexts/QuoteContext';
import { cn } from '@/lib/utils';

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
  const { dispatch } = useQuote();
  
  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setStep('start');
      setConfig({ startType: null, shaftLength: null, controlType: null, features: [] });
    }
  }, [open]);
  
  // Body scroll lock and history management
  useEffect(() => {
    if (!open) return;
    
    // Store scroll position and lock body
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    
    // Push history state for back button handling
    window.history.pushState({ configuratorOpen: true }, '');
    
    const handlePopState = () => {
      onClose();
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      // Restore scroll position
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
      
      window.removeEventListener('popstate', handlePopState);
    };
  }, [open, onClose]);
  
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
  
  // Update preview motor whenever filtered variants change
  useEffect(() => {
    if (open && filteredVariants.length > 0) {
      // Preview the best matching variant (first one, sorted by price)
      const sortedVariants = [...filteredVariants].sort((a, b) => (a.price || 0) - (b.price || 0));
      dispatch({ type: 'SET_PREVIEW_MOTOR', payload: sortedVariants[0] });
    }
  }, [open, filteredVariants, dispatch]);
  
  // Clear preview when modal closes
  useEffect(() => {
    if (!open) {
      dispatch({ type: 'SET_PREVIEW_MOTOR', payload: null });
    }
  }, [open, dispatch]);
  
  // Also set preview when modal first opens with group
  useEffect(() => {
    if (open && group && group.variants.length > 0) {
      // Preview the lowest-priced variant initially
      const sortedVariants = [...group.variants].sort((a, b) => (a.price || 0) - (b.price || 0));
      dispatch({ type: 'SET_PREVIEW_MOTOR', payload: sortedVariants[0] });
    }
  }, [open, group, dispatch]);
  
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
  
  // Auto-skip start step if only one start type available
  useEffect(() => {
    if (!open || !group || step !== 'start') return;
    
    const variants = group.variants;
    const hasElectric = variants.some(m => m.model.toUpperCase().includes('E') && !m.model.toUpperCase().includes('SEA'));
    const hasManual = variants.some(m => m.model.toUpperCase().includes('M') && !m.model.toUpperCase().includes('COMMAND'));
    
    // Only electric available - auto-select and skip
    if (hasElectric && !hasManual) {
      setConfig(prev => ({ ...prev, startType: 'electric' }));
      setStep('shaft');
      return;
    }
    
    // Only manual available - auto-select and skip
    if (hasManual && !hasElectric) {
      setConfig(prev => ({ ...prev, startType: 'manual' }));
      setStep('shaft');
      return;
    }
  }, [open, group, step]);
  
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
    dispatch({ type: 'SET_PREVIEW_MOTOR', payload: null });
    onClose();
  };
  
  const handleClose = useCallback(() => {
    dispatch({ type: 'SET_PREVIEW_MOTOR', payload: null });
    onClose();
  }, [dispatch, onClose]);
  
  if (!group) return null;
  
  const stepNumber = ['start', 'shaft', 'control', 'features', 'result'].indexOf(step) + 1;
  
  // Portal-based modal that leaves space for header and bottom bar
  return createPortal(
    <>
      <AnimatePresence>
        {open && !showTransomCalculator && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={handleClose}
            />
            
            {/* Modal Content - positioned to leave space for header (64px) and bottom bar (72px) */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                "fixed z-50 bg-background rounded-t-2xl shadow-2xl overflow-hidden",
                "inset-x-0 bottom-[72px] top-16", // Leave space for header and bottom bar
                "md:inset-x-4 md:bottom-20 md:top-20 md:rounded-2xl", // More padding on tablet
                "lg:inset-x-auto lg:left-1/2 lg:-translate-x-1/2 lg:w-full lg:max-w-2xl lg:top-24 lg:bottom-24" // Centered on desktop
              )}
            >
              {/* Header */}
              <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Configure Your {group.hp} HP Motor
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Step {stepNumber} of 5 • {filteredVariants.length} option{filteredVariants.length !== 1 ? 's' : ''} match
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              
              {/* Scrollable Content */}
              <div className="overflow-y-auto h-[calc(100%-60px)] p-4 pb-24">
                {/* Step 1: Start Type */}
                {step === 'start' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-foreground">
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
                              ? 'border-foreground bg-muted'
                              : 'border-border hover:border-muted-foreground'
                          }`}
                        >
                          <span className="text-3xl block mb-3">⚡</span>
                          <span className="font-semibold text-foreground block">Electric Start</span>
                          <span className="text-sm text-muted-foreground mt-1 block">
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
                              ? 'border-foreground bg-muted'
                              : 'border-border hover:border-muted-foreground'
                          }`}
                        >
                          <span className="text-3xl block mb-3">🔧</span>
                          <span className="font-semibold text-foreground block">Manual Start</span>
                          <span className="text-sm text-muted-foreground mt-1 block">
                            Pull cord — simple & reliable
                          </span>
                        </button>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <HelpCircle className="w-4 h-4" />
                      Most customers prefer electric start for convenience
                    </p>
                  </div>
                )}
                
                {/* Step 2: Shaft Length */}
                {step === 'shaft' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-foreground">
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
                                ? 'border-foreground bg-muted'
                                : 'border-border hover:border-muted-foreground'
                            }`}
                          >
                            <span className="font-semibold text-foreground block">{shaft.inches}"</span>
                            <span className="text-xs text-muted-foreground block mt-1">{shaft.name}</span>
                            <span className="text-xs text-muted-foreground/70 block mt-0.5">{shaft.transomRange}</span>
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setShowTransomCalculator(true)}
                      className="w-full text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 py-3 border-t border-border mt-4 transition-colors"
                    >
                      <HelpCircle className="w-4 h-4" />
                      Not sure? Measure your transom
                    </button>
                  </div>
                )}
                
                {/* Step 3: Control Type */}
                {step === 'control' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-foreground">
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
                              ? 'border-foreground bg-muted'
                              : 'border-border hover:border-muted-foreground'
                          }`}
                        >
                          <img 
                            src="https://www.mercurymarine.com/sp/en/gauges-and-controls/controls/tiller-handles/_jcr_content/root/container/pagesection_52925364/columnrow_copy_copy_/item_1695064113060/image_copy.coreimg.100.1280.png/1742304095249/mm-ga-co-controls-tiller-product-3.png"
                            alt="Tiller Handle"
                            className="w-12 h-12 object-contain mb-3"
                          />
                          <span className="font-semibold text-foreground block">Tiller Handle</span>
                          <span className="text-sm text-muted-foreground mt-1 block">
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
                              ? 'border-foreground bg-muted'
                              : 'border-border hover:border-muted-foreground'
                          }`}
                        >
                          <span className="text-3xl block mb-3">🚗</span>
                          <span className="font-semibold text-foreground block">Remote Control</span>
                          <span className="text-sm text-muted-foreground mt-1 block">
                            Steering wheel & console
                          </span>
                        </button>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <HelpCircle className="w-4 h-4" />
                      Boats under 16ft often use tiller steering
                    </p>
                  </div>
                )}
                
                {/* Step 4: Special Features */}
                {step === 'features' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-foreground">
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
                              ? 'border-foreground bg-muted'
                              : 'border-border hover:border-muted-foreground'
                          }`}
                        >
                          <div>
                            <span className="font-semibold text-foreground">Command Thrust (CT)</span>
                            <span className="text-sm text-muted-foreground block mt-0.5">
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
                              ? 'border-foreground bg-muted'
                              : 'border-border hover:border-muted-foreground'
                          }`}
                        >
                          <div>
                            <span className="font-semibold text-foreground">Power Trim & Tilt (PT)</span>
                            <span className="text-sm text-muted-foreground block mt-0.5">
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
                    <h3 className="text-lg font-medium text-foreground">
                      {filteredVariants.length === 1 ? '✓ Your Perfect Match' : `${filteredVariants.length} Motors Match`}
                    </h3>
                    
                    <div className="space-y-4">
                      {filteredVariants.map(motor => (
                        <div
                          key={motor.id}
                          className="p-4 rounded-lg border border-border hover:border-muted-foreground transition-all cursor-pointer flex items-center gap-4"
                          onClick={() => handleSelectMotor(motor)}
                        >
                          <img 
                            src={motor.image || '/lovable-uploads/speedboat-transparent.png'} 
                            alt={motor.model}
                            className="w-20 h-20 object-contain"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground">{motor.model}</h4>
                            <p className="text-sm text-muted-foreground">{motor.specs}</p>
                            <p className="text-lg font-bold text-foreground mt-1">
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
                        <p className="text-muted-foreground">No motors match your exact criteria.</p>
                        <Button variant="outline" onClick={() => setStep('start')} className="mt-4">
                          Start Over
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Navigation - Fixed at bottom of modal */}
              {step !== 'start' && step !== 'result' && (
                <div className="absolute bottom-0 left-0 right-0 flex justify-between p-4 pt-3 border-t bg-background">
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
                <div className="absolute bottom-0 left-0 right-0 flex justify-start p-4 pt-3 border-t bg-background">
                  <Button variant="ghost" onClick={handleBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Options
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Transom Height Calculator */}
      <TransomHeightCalculator
        open={showTransomCalculator}
        onClose={() => setShowTransomCalculator(false)}
        onApply={handleShaftFromCalculator}
      />
    </>,
    document.body
  );
}
