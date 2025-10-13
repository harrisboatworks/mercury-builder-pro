import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ExpandableImage } from '@/components/ui/expandable-image';
import { ArrowLeft, Ship, Info, CheckCircle2, ChevronDown, HelpCircle } from 'lucide-react';
import { Motor, BoatInfo } from '../QuoteBuilder';
import { TradeInValuation } from './TradeInValuation';
import { type TradeInInfo } from '@/lib/trade-valuation';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { isTillerMotor } from '@/lib/utils';
interface BoatInformationProps {
  onStepComplete: (boatInfo: BoatInfo) => void;
  onBack: () => void;
  selectedMotor: Motor | null;
  includeTradeIn?: boolean;
  onShowCompatibleMotors?: () => void;
}
export const BoatInformation = ({
  onStepComplete,
  onBack,
  selectedMotor,
  includeTradeIn = true,
  onShowCompatibleMotors
}: BoatInformationProps) => {
  const [boatInfo, setBoatInfo] = useState<BoatInfo>({
    type: '',
    make: '',
    model: '',
    length: '',
    currentMotorBrand: '',
    currentHp: 0,
    currentMotorYear: undefined,
    serialNumber: '',
    controlType: 'side-mount-external',
    shaftLength: '',
    hasBattery: false,
    hasCompatibleProp: false
  });
  const [tradeInInfo, setTradeInInfo] = useState<TradeInInfo>({
    hasTradeIn: false,
    brand: '',
    year: 0,
    horsepower: 0,
    model: '',
    serialNumber: '',
    condition: 'fair',
    estimatedValue: 0,
    confidenceLevel: 'low'
  });
  const showTradeIn = includeTradeIn !== false;
  const boatTypes = [{
    id: 'motor-only',
    label: 'Motor Only',
    description: 'No boat yet • Spare motor • I know my specs',
    recommendedHP: '',
    image: ''
  }, {
    id: 'canoe',
    label: 'Canoe',
    description: 'Canoes & small rowboats',
    recommendedHP: '2.5-6',
    image: '/boat-types/canoe.webp'
  }, {
    id: 'inflatable',
    label: 'Inflatable',
    description: 'Dinghies, tenders & inflatables',
    recommendedHP: '2.5-6',
    image: '/boat-types/aluminum-fishing.svg'
  }, {
    id: 'utility',
    label: 'Utility Boat',
    description: 'Small v-hull boats',
    recommendedHP: '9.9-30',
    image: '/lovable-uploads/6422c1aa-1ab1-4860-b77c-84dd486e4845.png'
  }, {
    id: 'v-hull-fishing',
    label: 'V-Hull Fishing',
    description: 'Deep V-hull fishing boats',
    recommendedHP: '40-150',
    image: '/lovable-uploads/53e1d043-6967-4a0b-9766-61574518f6dd.png'
  }, {
    id: 'bass-boat',
    label: 'Bass Boat',
    description: 'Tournament ready',
    recommendedHP: '115-250',
    image: '/lovable-uploads/10d8a150-14cb-4481-b36a-3715fcae9605.png'
  }, {
    id: 'pontoon',
    label: 'Pontoon',
    description: 'Family & entertainment',
    recommendedHP: '25-150',
    image: '/lovable-uploads/3c356039-87bb-4280-8f5d-555aa777d1ff.png',
    note: 'Needs Command Thrust motor'
  }, {
    id: 'bowrider',
    label: 'Bowrider',
    description: 'Open bow runabout',
    recommendedHP: '90-300',
    image: '/lovable-uploads/359dcfb9-5466-47ba-a79e-cde787caea6e.png'
  }, {
    id: 'center-console',
    label: 'Center Console',
    description: 'Offshore fishing',
    recommendedHP: '115-600',
    image: '/lovable-uploads/bc00ebae-067a-49d1-be75-82e023004a92.png'
  }, {
    id: 'speed-boat',
    label: 'Speed Boat',
    description: 'Hydrostreams / Tunnel Hull',
    recommendedHP: '90-450',
    image: '/lovable-uploads/78ce4cb2-311a-44f3-88d3-36903efc2e7e.png'
  }];

  // Parse HP range and check if motor fits
  const isMotorCompatibleWithBoatType = (motorHP: number, recommendedHPRange: string): boolean => {
    if (!recommendedHPRange) return true; // "Motor Only" has no range
    
    const rangeParts = recommendedHPRange.split('-');
    if (rangeParts.length !== 2) return true; // Fallback to show if parsing fails
    
    const minHP = parseFloat(rangeParts[0]);
    const maxHP = parseFloat(rangeParts[1]);
    
    return motorHP >= minHP && motorHP <= maxHP;
  };

  // Progressive Wizard State
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [lengthFeet, setLengthFeet] = useState<number>(16);
  const isMobile = useIsMobile();

  // Ref for auto-scroll to length input
  const lengthSectionRef = useRef<HTMLDivElement>(null);
  const lengthBucket = (feet: number): string => {
    if (feet < 14) return 'under-14';
    if (feet <= 16) return '14-16';
    if (feet <= 19) return '17-19';
    if (feet <= 22) return '20-22';
    return '23-plus';
  };
  const handleLengthChange = (val: number[]) => {
    const feet = val[0];
    setLengthFeet(feet);
    setBoatInfo(prev => ({
      ...prev,
      length: lengthBucket(feet)
    }));
  };

  // Auto-set length bucket when boat type is selected
  useEffect(() => {
    if (boatInfo.type && boatInfo.type !== 'motor-only') {
      const bucket = lengthBucket(lengthFeet);
      if (boatInfo.length !== bucket) {
        setBoatInfo(prev => ({
          ...prev,
          length: bucket
        }));
      }
    }
  }, [boatInfo.type, lengthFeet]);

  // Auto-scroll to length input when boat type is selected
  useEffect(() => {
    if (boatInfo.type && boatInfo.type !== 'motor-only' && lengthSectionRef.current) {
      setTimeout(() => {
        lengthSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 300); // Wait for fade-in animation
    }
  }, [boatInfo.type]);
  const computeCompatibilityScore = (): number => {
    if (!selectedMotor) return 0;

    // Boat type efficiency factors for power-to-weight calculation
    const boatEfficiencyFactors: Record<string, number> = {
      'bass-boat': 1.2,
      // Lighter, more efficient hull
      'center-console': 1.0,
      // Standard efficiency
      'bowrider': 0.95,
      // Slightly heavier
      'pontoon': 0.7,
      // Much heavier, less efficient
      'utility': 1.1,
      // Simple, efficient hull
      'jon-boat': 1.15,
      // Very light aluminum
      'aluminum-fishing': 1.1,
      // Light aluminum
      'speed-boat': 1.4 // Very efficient planing hull
    };
    const efficiency = boatEfficiencyFactors[boatInfo.type] || 1.0;
    const idealHpPerFoot = boatInfo.type === 'pontoon' ? 10 : 6; // Pontoons need more power
    const idealHp = lengthFeet * idealHpPerFoot;
    const adjustedIdealHp = idealHp / efficiency; // Account for boat efficiency

    const ratio = selectedMotor.hp / adjustedIdealHp;
    const score = Math.max(0, Math.min(100, Math.round((1 - Math.abs(1 - ratio)) * 100)));
    return score;
  };
  const calculateEstimatedSpeed = (): number => {
    if (!selectedMotor || !boatInfo.type) return 0;

    // Boat type efficiency factors for speed calculation
    const boatSpeedFactors: Record<string, number> = {
      'bass-boat': 1.3,
      // Lighter, faster hull design
      'center-console': 1.1,
      // Good performance hull
      'bowrider': 1.0,
      // Standard runabout performance
      'pontoon': 0.6,
      // Heavy, less efficient
      'utility': 1.15,
      // Simple, efficient hull
      'jon-boat': 1.2,
      // Very light aluminum
      'aluminum-fishing': 1.1,
      // Light aluminum
      'speed-boat': 1.6 // Designed for high speed
    };
    const speedFactor = boatSpeedFactors[boatInfo.type] || 1.0;

    // More realistic speed calculation: base speed from power-to-weight ratio
    const baseSpeed = selectedMotor.hp / lengthFeet * speedFactor * 1.8;

    // Realistic speed range limits
    return Math.round(Math.max(8, Math.min(65, baseSpeed)));
  };

  // Parse HP range string (e.g., "115-250") to extract min/max values
  const parseHPRange = (hpString: string) => {
    if (!hpString) return null;
    const match = hpString.match(/(\d+\.?\d*)-(\d+)/);
    return match ? {
      min: parseFloat(match[1]),
      max: parseFloat(match[2])
    } : null;
  };

  // Derived values
  const hp = typeof selectedMotor?.hp === 'string' ? parseInt(String(selectedMotor?.hp)) : selectedMotor?.hp || 0;

  // Check if motor HP fits within boat type's recommended range
  const getMotorBoatCompatibility = () => {
    if (!selectedMotor || !boatInfo.type) return null;
    const boatType = boatTypes.find(t => t.id === boatInfo.type);
    if (!boatType?.recommendedHP) return null;
    const hpRange = parseHPRange(boatType.recommendedHP);
    if (!hpRange) return null;
    const motorHP = hp;
    if (motorHP >= hpRange.min && motorHP <= hpRange.max) {
      return {
        type: 'perfect' as const,
        message: `✓ Perfect match for your ${boatType.label}`,
        motorHP,
        recommendedRange: boatType.recommendedHP
      };
    } else if (motorHP > hpRange.max) {
      return {
        type: 'overpowered' as const,
        message: `⚠️ Your ${motorHP}HP motor is too powerful for ${boatType.label}s (recommended: ${boatType.recommendedHP}HP). This won't work safely.`,
        motorHP,
        recommendedRange: boatType.recommendedHP
      };
    } else {
      return {
        type: 'underpowered' as const,
        message: `⚠️ Your ${motorHP}HP motor is below the recommended range for ${boatType.label}s (${boatType.recommendedHP}HP). Performance may be limited.`,
        motorHP,
        recommendedRange: boatType.recommendedHP
      };
    }
  };
  const getCompatibilityMessage = () => {
    if (boatInfo.currentMotorBrand === 'Mercury') {
      return {
        type: 'info' as const,
        message: 'Control compatibility will be verified during consultation',
        icon: <CheckCircle2 className="w-4 h-4" />
      };
    } else if (boatInfo.currentMotorBrand && boatInfo.currentMotorBrand !== 'No Current Motor') {
      return {
        type: 'warning' as const,
        message: 'New Mercury controls and cables will be required (additional cost)',
        icon: <Info className="w-4 h-4" />
      };
    }
    return null;
  };
  const compatibility = getCompatibilityMessage();
  const isNonMercuryBrand = !!boatInfo.currentMotorBrand && boatInfo.currentMotorBrand !== 'Mercury' && boatInfo.currentMotorBrand !== 'No Current Motor';
  const steps = boatInfo.type === 'motor-only' ? showTradeIn ? [{
    label: 'Specs'
  }, {
    label: 'Trade-In (Optional)'
  }, {
    label: 'Review'
  }] : [{
    label: 'Specs'
  }, {
    label: 'Review'
  }] : showTradeIn ? [{
    label: 'Boat Details'
  }, {
    label: 'Transom Height'
  }, {
    label: 'Controls & Rigging'
  }, {
    label: 'Trade-In (Optional)'
  }, {
    label: 'Review'
  }] : [{
    label: 'Boat Details'
  }, {
    label: 'Transom Height'
  }, {
    label: 'Controls & Rigging'
  }, {
    label: 'Review'
  }];
  const nextStepLabel = steps[currentStep + 1]?.label;

  // Derive motor shaft length from specifications or model code
  const deriveMotorShaftFromModel = (motor?: Motor | null): '15' | '20' | '25' | '30' | null => {
    if (!motor) return null;

    // First check specifications if available
    const shaftSpec = (motor as any).specifications?.shaft_length as string | undefined;
    if (shaftSpec) {
      if (/30/.test(shaftSpec)) return '30';
      if (/25/.test(shaftSpec)) return '25';
      if (/20/.test(shaftSpec)) return '20';
      if (/15/.test(shaftSpec)) return '15';
    }

    // Then check model code for shaft indicators
    const model = (motor.model || '').toUpperCase();
    if (/\bXXL\b/.test(model)) return '30';
    if (/XL|EXLPT|EXLHPT/.test(model)) return '25';
    if (/\bL\b|ELPT|MLH|LPT/.test(model)) return '20';
    if (/\bS\b/.test(model)) return '15';

    // Default assumption for most motors is 20" Long shaft if no specific indicator
    return '20';
  };
  const motorShaft = deriveMotorShaftFromModel(selectedMotor);
  const chosenShaft = boatInfo.shaftLength && boatInfo.shaftLength !== 'Not Sure' ? boatInfo.shaftLength : null;
  const shaftMatch = motorShaft && chosenShaft ? motorShaft === chosenShaft : null;
  const shaftLabel = (inches?: string | null) => {
    switch (inches) {
      case '15':
        return '15" (Short)';
      case '20':
        return '20" (Long)';
      case '25':
        return '25" (XL)';
      case '30':
        return '30" (XXL)';
      default:
        return '--';
    }
  };
  const [showHelp, setShowHelp] = useState(false);

  // (Using per-type recommendedHP from boatTypes entries)
  const handleSkip = () => {
    const defaultType = 'utility';
    const typicalLength = hp < 25 ? 14 : hp < 60 ? 16 : hp < 115 ? 18 : 20;
    setBoatInfo(prev => ({
      ...prev,
      type: prev.type || defaultType,
      length: lengthBucket(typicalLength)
    }));
    setLengthFeet(typicalLength);
    handleNext();
  };

  // Check if selected motor is a tiller motor
  const isSelectedTillerMotor = selectedMotor ? isTillerMotor(selectedMotor.model || '') : false;

  // Auto-set control type for tiller motors on initial load
  useEffect(() => {
    if (isSelectedTillerMotor && !boatInfo.controlType) {
      // Use a small delay to prevent race conditions with state updates
      const timeoutId = setTimeout(() => {
        setBoatInfo(prev => ({
          ...prev,
          controlType: 'tiller'
        }));
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [isSelectedTillerMotor]); // Remove boatInfo.controlType dependency to prevent loops

  const totalSteps = boatInfo.type === 'motor-only' ? showTradeIn ? 3 : 2 : showTradeIn ? 5 : 4;
  const canNext = () => {
    if (boatInfo.type === 'motor-only') {
      if (currentStep === 0) return boatInfo.type === 'motor-only';
      if (currentStep === 1) return true; // trade-in step optional
      return true;
    }
    switch (currentStep) {
      case 0:
        return !!boatInfo.type && boatInfo.type !== 'motor-only' && !!boatInfo.length;
      case 1:
        return !!boatInfo.shaftLength;
      // transom helper
      case 2:
        // Skip control type validation for tiller motors since it's auto-set
        return isSelectedTillerMotor || !!boatInfo.controlType;
      case 3:
        return true;
      // trade-in optional
      default:
        return true;
    }
  };
  const handleNext = () => setCurrentStep(s => Math.min(totalSteps - 1, s + 1));
  const handlePrev = () => {
    if (currentStep === 0) onBack();else setCurrentStep(s => Math.max(0, s - 1));
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStepComplete({
      ...boatInfo,
      tradeIn: tradeInInfo
    });
  };
  return <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 md:space-y-8 py-4 md:py-6 lg:py-8 overflow-x-hidden">
      {/* Header */}
      <div className="text-center space-y-3 animate-fade-in">
        <h2 className="text-3xl md:text-4xl font-light tracking-wide text-gray-900">Boat Details Wizard</h2>
        <p className="text-base md:text-lg font-light text-gray-500">
          Let's match your {selectedMotor?.model || 'Mercury motor'} to your boat, step by step.
        </p>
      </div>



      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step Content */}
        <div>
        {boatInfo.type === 'motor-only' ? <>
            {currentStep === 0 && <Card className="p-6 animate-fade-in">
                <div className="space-y-6">
                  <h3 className="text-2xl font-light tracking-wide text-gray-900">Motor Only</h3>
                  <p className="text-sm font-light text-gray-500">Buying a motor without a boat? We'll confirm specs at consultation.</p>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 font-light">Shaft Length (if known)</Label>
                    <Select value={boatInfo.shaftLength} onValueChange={value => setBoatInfo(prev => ({
                  ...prev,
                  shaftLength: value
                }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select shaft length" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15" - Short</SelectItem>
                        <SelectItem value="20">20" - Long</SelectItem>
                        <SelectItem value="25">25" - XL</SelectItem>
                        <SelectItem value="Not Sure">Not Sure</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
                    <Info className="w-4 h-4" />
                    <AlertDescription>
                      We'll verify exact rigging and cables during your appointment.
                    </AlertDescription>
                  </Alert>
                </div>
              </Card>}

            {showTradeIn && currentStep === 1 && <Card className="p-6 animate-fade-in">
                <div className="space-y-4">
                  <h3 className="text-2xl font-light tracking-wide text-gray-900">Trade-In Valuation (Optional)</h3>
                  <TradeInValuation tradeInInfo={tradeInInfo} onTradeInChange={setTradeInInfo} currentMotorBrand={'No Current Motor'} currentHp={0} />
                </div>
              </Card>}

            {currentStep === 2 && <Card className="p-6 animate-fade-in">
                <div className="space-y-4">
                  <h3 className="text-2xl font-light tracking-wide text-gray-900">Ready to Continue</h3>
                  <p className="text-sm font-light text-gray-500">We'll use typical settings and confirm any unknowns.</p>
                </div>
              </Card>}
          </> : <>
            {currentStep === 0 && <Card className="p-6 animate-fade-in">
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <Label className="text-2xl font-light tracking-wide text-gray-900">What type of boat do you have?</Label>
                    <p className="font-light text-gray-500">Pick the closest match and enter your boat length.</p>
                  </div>
                  
                  {boatTypes
                    .filter(t => t.id !== 'motor-only')
                    .filter(type => !selectedMotor || isMotorCompatibleWithBoatType(selectedMotor.hp, type.recommendedHP))
                    .length === 0 && selectedMotor && (
                    <Alert className="mb-4">
                      <Info className="h-4 w-4" />
                      <AlertDescription className="font-light text-gray-600">
                        No standard boat types match your {selectedMotor.hp} HP motor. Consider selecting "Motor Only" 
                        if you're ordering a spare motor or contact us for custom applications.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                     {boatTypes
                       .filter(t => t.id !== 'motor-only')
                       .filter(type => !selectedMotor || isMotorCompatibleWithBoatType(selectedMotor.hp, type.recommendedHP))
                       .map(type => <button type="button" key={type.id} onClick={() => setBoatInfo(prev => ({
                  ...prev,
                  type: type.id
                }))} className={`group relative rounded-2xl border-2 p-4 bg-gray-50 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg min-h-[44px] ${boatInfo.type === type.id ? 'border-red-600 bg-red-50' : 'border-gray-200'}`} aria-pressed={boatInfo.type === type.id}>
                         <div className="mb-3 h-28 md:h-36 overflow-hidden rounded-md flex items-center justify-center">
                            <img src={type.image} alt={`${type.label} boat`} className="w-full h-auto object-contain transition-transform duration-200 group-hover:scale-[1.03]" loading="lazy" />
                         </div>
                        <h3 className="font-light tracking-wide text-base md:text-lg text-gray-900">{type.label}</h3>
                        <div className="boat-details mt-1 space-y-0.5">
                          <span className="block text-sm md:text-base font-light text-muted-foreground">{type.description}</span>
                          {type.recommendedHP && <span className="block text-xs md:text-sm text-primary font-medium">Recommended: {type.recommendedHP} HP</span>}
                        </div>
                        <div className="selection-impact mt-2 text-xs text-muted-foreground">
                          {type.id === 'pontoon' && <span className="inline-flex items-center gap-1">
                              Needs Command Thrust motor
                              <TooltipProvider delayDuration={150}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3.5 w-3.5 text-primary/70" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs text-xs">
                                    Command Thrust = larger gearcase and prop for better low-speed control and pushing power.
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </span>}
                          {type.id === 'bass-boat' && <span>Built for speed</span>}
                        </div>
                      </button>)}

                    {/* Help option */}
                    <button type="button" onClick={() => setShowHelp(s => !s)} className="group relative rounded-xl border-2 border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg">
                      <div className="mb-3 h-24 overflow-hidden rounded-md border-b border-border bg-gradient-to-b from-muted/40 to-background flex items-center justify-center">
                           <img src="/lovable-uploads/1d6d06c4-3b2d-477c-ae3c-042a3ca1a076.png" alt="Not sure? We'll help you choose your boat type" className="h-20 w-full h-auto object-contain" loading="lazy" />
                      </div>
                      <h3 className="font-light tracking-wide text-gray-900">Not Sure?</h3>
                      <p className="text-sm font-light text-gray-500">We'll help you figure it out</p>
                     </button>
                   </div>

                   {/* Help content for "Not Sure?" option */}
                   {showHelp && <div className="help-content animate-fade-in mt-4 p-4 bg-muted/30 rounded-lg border border-border">
                       <h4 className="font-light tracking-wide text-gray-900 mb-3">Let's figure out your boat type together!</h4>
                       <div className="space-y-3 text-sm">
                         <p>Answer these quick questions to identify your boat:</p>
                         <div className="space-y-2">
                           <div>
                             <strong>What's the primary use?</strong>
                             <ul className="ml-4 mt-1 space-y-1">
                               <li>• Fishing in lakes/rivers → <strong>V-Hull Fishing</strong> or <strong>Bass Boat</strong></li>
                               <li>• Family fun/cruising → <strong>Pontoon</strong> or <strong>Bowrider</strong></li>
                               <li>• Small lakes/portability → <strong>Utility Boat</strong></li>
                               <li>• Offshore fishing → <strong>Center Console</strong></li>
                               <li>• Racing/speed → <strong>Speed Boat</strong></li>
                             </ul>
                           </div>
                           <div>
                             <strong>Hull shape:</strong>
                             <ul className="ml-4 mt-1 space-y-1">
                               <li>• Flat bottom with aluminum → <strong>Utility Boat</strong></li>
                               <li>• V-shaped hull → <strong>V-Hull Fishing</strong></li>
                               <li>• Two tubes/pontoons → <strong>Pontoon</strong></li>
                               <li>• Open bow area → <strong>Bowrider</strong></li>
                             </ul>
                           </div>
                         </div>
                         <Button variant="outline" size="sm" onClick={() => setShowHelp(false)} className="mt-3">
                           Close Help
                         </Button>
                       </div>
                     </div>}

                   {/* Why this matters */}
                  <div className="why-this-matters">
                    <details className="text-sm">
                      <summary className="cursor-pointer text-primary">Why do we need to know your boat type?</summary>
                      <div className="mt-2 rounded-md bg-muted/30 p-3">
                        <p>Different boats need different motor features:</p>
                        <ul className="mt-2 space-y-1">
                          <li>• Pontoons: Need extra thrust for heavy loads</li>
                          <li>• Bass Boats: Need quick hole shot for tournaments</li>
                          <li>• Aluminum: Lighter, needs less power</li>
                        </ul>
                      </div>
                    </details>
                  </div>

                  {/* Selection feedback */}
                  {boatInfo.type && selectedMotor && <div className="selection-feedback">
                      {(() => {
                  // Special case for pontoons with very low HP
                  if (boatInfo.type === 'pontoon' && hp < 25) {
                    return <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
                              <AlertDescription>⚠️ Pontoons typically need 25HP+ for adequate performance</AlertDescription>
                            </Alert>;
                  }

                  // Check motor-boat compatibility
                  const compatibility = getMotorBoatCompatibility();
                  if (compatibility) {
                    if (compatibility.type === 'perfect') {
                      return <Alert className="border-green-500/30 bg-green-500/10">
                                <AlertDescription>{compatibility.message}</AlertDescription>
                              </Alert>;
                    } else {
                      return <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
                                <AlertDescription>{compatibility.message}</AlertDescription>
                              </Alert>;
                    }
                  }

                  // Fallback for cases where no specific range is defined
                  return <Alert className="border-green-500/30 bg-green-500/10">
                            <AlertDescription>✓ Good match for your {hp}HP motor</AlertDescription>
                          </Alert>;
                })()}
                    </div>}


                  {/* Quick Skip */}
                  <div className="skip-option">
                    <Button type="button" variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground">
                      Skip this step - Use typical settings for {hp || selectedMotor?.hp || '--'}HP
                    </Button>
                  </div>

                   {/* Boat Details Section - Shows after boat type is selected */}
                   {boatInfo.type && boatInfo.type !== 'motor-only' && <div ref={lengthSectionRef} className="boat-details-section animate-fade-in mt-6 p-6 bg-muted/30 rounded-lg border border-border">
                       <div className="space-y-6">
                         {/* Boat Make and Model */}
                         <div className="space-y-4">
                          <div className="text-center space-y-2">
                            <Label className="text-xl font-light tracking-wide text-gray-900">Tell us about your {boatTypes.find(t => t.id === boatInfo.type)?.label}</Label>
                            <p className="text-sm font-light text-gray-500">Boat details help us provide more accurate recommendations</p>
                           </div>
                           
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="font-light">Boat Make</Label>
                               <Input value={boatInfo.make} onChange={e => setBoatInfo(prev => ({
                          ...prev,
                          make: e.target.value
                        }))} placeholder="e.g., Harris, Ranger, Boston Whaler" className="min-h-[44px] py-3 text-base w-full" />
                              </div>
                              <div className="space-y-2">
                                <Label className="font-light">Boat Model</Label>
                               <Input value={boatInfo.model} onChange={e => setBoatInfo(prev => ({
                          ...prev,
                          model: e.target.value
                        }))} placeholder="e.g., Solstice 230, Z520L" className="min-h-[44px] py-3 text-base w-full" />
                             </div>
                           </div>
                         </div>

                         {/* Length Input */}
                          <div className="space-y-4">
                            <div className="text-center space-y-2">
                              <Label className="text-xl font-light tracking-wide text-gray-900">Boat Length</Label>
                              <p className="text-sm font-light text-gray-500">Use the slider to set your boat length</p>
                           </div>
                           
                           <div className="slider-container">
                             <Slider value={[lengthFeet]} min={14} max={30} step={1} onValueChange={handleLengthChange} className="w-full" />
                             <div className="flex justify-between items-center mt-3">
                               <span className="text-sm text-muted-foreground">14 ft</span>
                               <span className="text-2xl font-bold text-primary">
                                 {lengthFeet} ft
                               </span>
                               <span className="text-sm text-muted-foreground">30 ft</span>
                             </div>
                           </div>
                         </div>
                       </div>
                     </div>}
                </div>
              </Card>}

            {currentStep === 1 && <Card className="p-6 animate-fade-in">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-light tracking-wide text-gray-900">Transom Height Confirmation</h3>
                    <p className="text-sm font-light text-gray-500">Measure from top of transom to bottom of hull.</p>
                  </div>

                  <div className={`grid grid-cols-1 gap-3 ${hp >= 40 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
                    {hp < 40 && <Button type="button" variant={boatInfo.shaftLength === '15' ? "default" : "outline"} onClick={() => setBoatInfo(prev => ({
                  ...prev,
                  shaftLength: '15'
                }))} className="h-auto py-4 px-6 justify-center text-center">
                        <div className="text-lg font-semibold">15" (Short)</div>
                      </Button>}
                    <Button type="button" variant={boatInfo.shaftLength === '20' ? "default" : "outline"} onClick={() => setBoatInfo(prev => ({
                  ...prev,
                  shaftLength: '20'
                }))} className="h-auto py-4 px-6 justify-center text-center">
                      <div className="text-lg font-semibold">20" (Long)</div>
                    </Button>
                    <Button type="button" variant={boatInfo.shaftLength === '25' ? "default" : "outline"} onClick={() => setBoatInfo(prev => ({
                  ...prev,
                  shaftLength: '25'
                }))} className="h-auto py-4 px-6 justify-center text-center">
                      <div className="text-lg font-semibold">25" (Extra Long)</div>
                    </Button>
                  </div>

                  {selectedMotor && chosenShaft && <Alert className={shaftMatch ? 'border-in-stock bg-in-stock/10' : 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'}>
                      <AlertDescription>
                        {shaftMatch ? <>
                            Selected motor: {selectedMotor.model} • Matches your {shaftLabel(chosenShaft)} transom.
                          </> : <div className="space-y-3">
                            <p>
                              Heads up: your selected motor ({selectedMotor.model}) is {shaftLabel(motorShaft)}, but you chose {shaftLabel(chosenShaft)}. Mercury model must match the boat's transom height.
                            </p>
                            {onShowCompatibleMotors && <Button variant="outline" size="sm" onClick={onShowCompatibleMotors} className="text-blue-700 border-blue-300 hover:bg-blue-50">
                                Show compatible motors
                              </Button>}
                          </div>}
                      </AlertDescription>
                    </Alert>}

                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="w-4 h-4" />
                          <span>Need help measuring transom height?</span>
                        </div>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3">
                      <div className="bg-muted/30 rounded-lg p-4">
                        <ExpandableImage 
                          src="/lovable-uploads/cb45570a-2b96-4b08-af3d-412c7607a66e.png" 
                          alt="Transom height measurement guide showing how to measure from top of transom to bottom of hull"
                          className="max-w-lg mx-auto"
                        />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </Card>}

            {currentStep === 2 && <Card className="p-6 animate-fade-in">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-light">Current Motor Brand</Label>
                      <Select value={boatInfo.currentMotorBrand} onValueChange={value => setBoatInfo(prev => ({
                    ...prev,
                    currentMotorBrand: value,
                    currentHp: value === 'No Current Motor' ? 0 : prev.currentHp,
                    controlsOption: value !== 'Mercury' && value !== 'No Current Motor' ? 'none' : prev.controlsOption
                  }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select current motor brand" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Mercury">Mercury</SelectItem>
                          <SelectItem value="Yamaha">Yamaha</SelectItem>
                          <SelectItem value="Honda">Honda</SelectItem>
                          <SelectItem value="Suzuki">Suzuki</SelectItem>
                          <SelectItem value="Evinrude">Evinrude</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                          <SelectItem value="No Current Motor">No Current Motor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {boatInfo.currentMotorBrand && boatInfo.currentMotorBrand !== 'No Current Motor' && <>
                        <div className="space-y-2">
                          <Label className="font-light">Current Motor Horsepower (HP)</Label>
                          <Input type="number" inputMode="numeric" min={1} max={600} placeholder="e.g., 115" value={boatInfo.currentHp || ''} onChange={e => setBoatInfo(prev => ({
                      ...prev,
                      currentHp: parseInt(e.target.value || '0', 10) || 0
                    }))} />
                         <p className="text-xs text-muted-foreground">Helps us provide more accurate rigging and trade-in estimates if needed.</p>
                       </div>

                       <div className="space-y-2">
                         <Label className="font-light">Current Motor Year</Label>
                         <Select value={boatInfo.currentMotorYear?.toString() || ''} onValueChange={value => setBoatInfo(prev => ({
                      ...prev,
                      currentMotorYear: parseInt(value)
                    }))}>
                           <SelectTrigger>
                             <SelectValue placeholder="Select year" />
                           </SelectTrigger>
                           <SelectContent>
                             {Array.from({
                          length: new Date().getFullYear() - 1989
                        }, (_, i) => new Date().getFullYear() - i).map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
                           </SelectContent>
                         </Select>
                         <p className="text-xs text-muted-foreground">Helps us provide more accurate trade-in estimates.</p>
                       </div>
                      </>}


                    {compatibility && <Alert className={compatibility.type === 'warning' ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' : 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'}>
                        <div className="flex items-center gap-2">
                          {compatibility.icon}
                          <AlertDescription className={compatibility.type === 'warning' ? 'text-orange-800 dark:text-orange-200' : 'text-blue-800 dark:text-blue-200'}>
                            {compatibility.message}
                          </AlertDescription>
                        </div>
                      </Alert>}

                    {isSelectedTillerMotor ? <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
                        <Info className="w-4 h-4" />
                        <AlertDescription>
                          <strong>Tiller Motor Selected:</strong> Your {selectedMotor?.model} is a tiller motor that's steered by hand. No remote controls are needed or applicable.
                        </AlertDescription>
                      </Alert> : <div className="space-y-2">
                        <Label className="font-light">Control Type</Label>
                        <Select value={boatInfo.controlType} onValueChange={value => setBoatInfo(prev => ({
                    ...prev,
                    controlType: value
                  }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select control type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="side-mount-external">Side Mount - External Box</SelectItem>
                            <SelectItem value="side-mount-recessed">Side Mount - Recessed Panel</SelectItem>
                            <SelectItem value="binnacle-top">Binnacle/Top Mount</SelectItem>
                            <SelectItem value="tiller">Tiller</SelectItem>
                            <SelectItem value="not-sure">Not Sure</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>}

                    {!isSelectedTillerMotor && selectedMotor && (typeof selectedMotor.hp === 'number' ? selectedMotor.hp : parseInt(String(selectedMotor.hp))) >= 40 && <div className="controls-section rounded-lg border border-border bg-muted/30 p-4">
                        <h4 className="font-light tracking-wide text-gray-900 mb-3">Steering Controls Required</h4>
                        {isNonMercuryBrand && <Alert className="mb-3 border-blue-500 bg-blue-50 dark:bg-blue-950/20">
                            <div className="flex items-center gap-2">
                              <Info className="w-4 h-4" />
                              <AlertDescription>
                                Your current brand isn’t Mercury, so existing controls aren’t compatible. We’ve selected new Mercury controls by default.
                              </AlertDescription>
                            </div>
                          </Alert>}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 control-options">
                          {isNonMercuryBrand ? <div className="rounded-lg border-2 border-primary bg-primary/5 p-4">
                              <div className="text-left">
                                <strong className="block">I need new controls</strong>
                                <span className="text-sm text-muted-foreground">+$1,200</span>
                                <small className="block text-xs text-muted-foreground">Required for non‑Mercury controls</small>
                              </div>
                            </div> : <>
                              <Button type="button" variant={boatInfo.controlsOption === 'none' ? 'default' : 'outline'} className="h-auto p-4 text-left justify-start flex-col items-start" onClick={() => setBoatInfo(prev => ({
                        ...prev,
                        controlsOption: 'none'
                      }))}>
                                <strong className="block">I need new controls</strong>
                                <span className="text-sm opacity-70">+$1,200</span>
                                <small className="block text-xs opacity-60">Complete remote control kit</small>
                              </Button>

                              <Button type="button" variant={boatInfo.controlsOption === 'adapter' ? 'default' : 'outline'} className="h-auto p-4 text-left justify-start flex-col items-start" onClick={() => setBoatInfo(prev => ({
                        ...prev,
                        controlsOption: 'adapter'
                      }))}>
                                <strong className="block">I have Mercury controls (2004 +)</strong>
                                <span className="text-sm text-primary">+$125 (Save $1,075!)</span>
                                <small className="block text-xs opacity-60">We'll adapt your existing controls</small>
                              </Button>

                              <Button type="button" variant={boatInfo.controlsOption === 'compatible' ? 'default' : 'outline'} className="h-auto p-4 text-left justify-start flex-col items-start" onClick={() => setBoatInfo(prev => ({
                        ...prev,
                        controlsOption: 'compatible'
                      }))}>
                                <strong className="block">I have compatible controls ready</strong>
                                <span className="text-sm opacity-70">No charge</span>
                                <small className="block text-xs opacity-60">Already have the right setup</small>
                              </Button>
                            </>}
                        </div>

                        {boatInfo.controlsOption === 'adapter' && <div className="adapter-info rounded-lg mt-3 p-3 bg-green-500/10">
                            <h5 className="font-bold">💰 Smart Choice!</h5>
                            <p className="text-sm">
                              Your existing Mercury controls can work with your new motor using our control harness adapter. This saves you over $1,000!
                            </p>
                            <small className="text-xs text-muted-foreground">
                              Compatible with most Mercury controls from 2004-present. We'll confirm compatibility during installation.
                            </small>
                          </div>}

                        <details className="mt-3">
                          <summary className="text-sm text-primary cursor-pointer">Not sure what controls you have?</summary>
                          <div className="help-content p-3 bg-muted/30 rounded">
                            <p className="text-sm mb-2">Check your control box for:</p>
                            <ul className="text-sm space-y-1">
                              <li>• Mercury logo on the throttle</li>
                              <li>• Model years 2004-2024 typically compatible</li>
                              <li>• Quicksilver controls also work</li>
                            </ul>
                            <p className="text-sm mt-2">
                              <strong>Brands that need new controls:</strong> Yamaha, Honda, Evinrude, Johnson
                            </p>
                          </div>
                        </details>
                      </div>}

                    {/* Accessory checks */}
                    {(() => {
                  const hp = typeof selectedMotor?.hp === 'string' ? parseInt(String(selectedMotor?.hp)) : selectedMotor?.hp || 0;
                  const model = (selectedMotor?.model || '').toUpperCase();
                  const isElectricStart = /\bE\b|EL|ELPT|EH|EFI/.test(model) && !/\bM\b/.test(model);
                  return <div className="accessories-check rounded-lg border border-border bg-muted/30 p-4 space-y-4">
                          <h3 className="text-xl font-light tracking-wide text-gray-900">What do you already have?</h3>
                          {hp >= 40 && <div className="accessory-item">
                              <div className="text-sm text-muted-foreground mb-1">Controls</div>
                              {/* Control radio options already shown above */}
                              <div className="text-xs text-muted-foreground">We’ll confirm compatibility during installation.</div>
                            </div>}
                          {isElectricStart && <div className="accessory-item">
                              <label className="flex items-start gap-2">
                                <input type="checkbox" checked={!!boatInfo.hasBattery} onChange={e => setBoatInfo(prev => ({
                          ...prev,
                          hasBattery: e.target.checked
                        }))} />
                                <span>I have a marine battery</span>
                              </label>
                              {!boatInfo.hasBattery && <div className="cost-note text-sm text-primary">
                                  +$179.99 for battery
                                  <small className="block text-xs text-muted-foreground">Marine cranking battery</small>
                                </div>}
                            </div>}
                          {hp >= 25 && boatInfo.currentMotorBrand === 'Mercury' && <div className="accessory-item">
                              <label className="flex items-start gap-2">
                                <input type="checkbox" checked={!!boatInfo.hasCompatibleProp} onChange={e => setBoatInfo(prev => ({
                          ...prev,
                          hasCompatibleProp: e.target.checked
                        }))} />
                                <span>I have a compatible propeller from my old {hp}HP motor</span>
                              </label>
                              {!boatInfo.hasCompatibleProp && <div className="cost-note text-sm text-primary">
                                  +${hp >= 150 ? '950 (Stainless Steel)' : '350 (Aluminum)'}
                                  <small className="block text-xs text-muted-foreground">Fit and Size determined to be confirmed at inspection</small>
                                </div>}
                            </div>}

                          {/* Highlight FREE water testing */}
                          <div className="water-test-benefit bg-accent p-4 rounded-lg">
                            <h4 className="font-bold text-accent-foreground">✅ FREE Water Testing Included</h4>
                            <p className="text-sm text-accent-foreground/90">
                              We're on the water! Every motor installation includes professional water testing to ensure perfect prop sizing and optimal performance. This $200 value is included FREE with your purchase.
                            </p>
                          </div>
                        </div>;
                })()}

                  </div>
                </div>
              </Card>}

            {showTradeIn && currentStep === 3 && <Card className="p-6 animate-fade-in">
                <div className="space-y-4">
                  <h3 className="text-2xl font-light tracking-wide text-gray-900">Have a motor to trade?</h3>
                   <TradeInValuation tradeInInfo={tradeInInfo} onTradeInChange={setTradeInInfo} currentMotorBrand={boatInfo.currentMotorBrand} currentHp={boatInfo.currentHp} currentMotorYear={boatInfo.currentMotorYear} />
                </div>
              </Card>}

            {currentStep === 4 && <Card className="p-6 animate-fade-in">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-light tracking-wide text-gray-900">Compatibility Check</h3>
                    <div className="flex items-center gap-3">
                      <Progress value={computeCompatibilityScore()} className="h-3" />
                      <span className="text-sm text-muted-foreground">{computeCompatibilityScore()}% match</span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                      <svg viewBox="0 0 400 120" className="w-full md:w-2/3">
                        <rect x="10" y="60" rx="6" ry="6" height="22" width={Math.max(80, Math.min(360, lengthFeet * 12))} className="fill-primary/50" />
                        {selectedMotor?.image && <image href={selectedMotor.image} x={Math.max(50, Math.min(330, lengthFeet * 12 - 20))} y="30" height="48" width="48" preserveAspectRatio="xMidYMid slice" />}
                      </svg>
                      <div className="md:w-1/3 space-y-2">
                        <div className="text-sm">Estimated Speed</div>
                        <div className="text-2xl font-bold">{selectedMotor ? Math.max(15, Math.round(selectedMotor.hp / Math.max(12, lengthFeet) * 2)) : '--'} mph</div>
                        <div className="text-sm text-muted-foreground">We'll fine-tune during consultation.</div>
                      </div>
                    </div>
                  </div>
                  {/* Gamification */}
                  <div className="progress-rewards text-sm">
                    {boatInfo.type && boatInfo.shaftLength && boatInfo.controlType && <div className="rounded-md border border-primary/30 bg-primary/5 p-3">🏆 Detail Detective - You're thorough!</div>}
                    {selectedMotor && computeCompatibilityScore() > 80 && <div className="mt-2 rounded-md border border-green-500/30 bg-green-500/10 p-3">⭐ Excellent match - Great motor/boat combo!</div>}
                  </div>
                </div>
              </Card>}
          </>}

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-6 border-t gap-3">
          <Button type="button" variant="outline" onClick={handlePrev} className="flex items-center justify-center gap-2 min-h-[44px] order-2 sm:order-1 border-2 border-black text-black font-light rounded-sm hover:bg-black hover:text-white transition-all duration-500">
            <ArrowLeft className="w-4 h-4" />
            {currentStep === 0 ? 'Back to Motor' : 'Previous'}
          </Button>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 order-1 sm:order-2">
            {currentStep < totalSteps - 1 && <Button type="button" variant="ghost" onClick={handleSkip} className="text-sm min-h-[44px] font-light text-gray-500">
                Skip for now
              </Button>}
            
            {currentStep === totalSteps - 1 ? <Button type="submit" className="border-2 border-black bg-black text-white px-8 py-4 text-xs tracking-widest uppercase font-light rounded-sm hover:bg-white hover:text-black transition-all duration-500" disabled={!canNext()}>
                Continue to Quote
              </Button> : <Button type="button" onClick={handleNext} disabled={!canNext()} className="border-2 border-black bg-black text-white px-8 py-4 text-xs tracking-widest uppercase font-light rounded-sm hover:bg-white hover:text-black transition-all duration-500">
                Next: {nextStepLabel}
              </Button>}
          </div>
        </div>
        </div>
      </form>

      {/* Mobile chat style hint */}
      {isMobile && <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="text-sm text-muted-foreground">Tip: You can tap a preset above to speed things up.</div>
        </div>}
    </div>;
};