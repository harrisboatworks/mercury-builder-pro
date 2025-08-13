import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Ship, Info, CheckCircle2 } from 'lucide-react';
import { Motor, BoatInfo } from '../QuoteBuilder';
import { TradeInValuation } from './TradeInValuation';
import { type TradeInInfo } from '@/lib/trade-valuation';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
interface BoatInformationProps {
  onStepComplete: (boatInfo: BoatInfo) => void;
  onBack: () => void;
  selectedMotor: Motor | null;
  includeTradeIn?: boolean;
}

export const BoatInformation = ({ onStepComplete, onBack, selectedMotor, includeTradeIn = true }: BoatInformationProps) => {
  const [boatInfo, setBoatInfo] = useState<BoatInfo>({
    type: '',
    make: '',
    model: '',
    length: '',
    currentMotorBrand: '',
    currentHp: 0,
    serialNumber: '',
    controlType: 'side-mount-external',
    shaftLength: '20',
    hasBattery: false,
    hasCompatibleProp: false,
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

  const boatTypes = [
    {
      id: 'motor-only',
      label: 'Motor Only',
      description: 'No boat yet • Spare motor • I know my specs',
      recommendedHP: '',
      image: ''
    },
    {
      id: 'aluminum-fishing',
      label: 'Aluminum Fishing',
      description: 'V-hull fishing boats',
      recommendedHP: '9.9-25',
      image: '/lovable-uploads/6422c1aa-1ab1-4860-b77c-84dd486e4845.png'
    },
    {
      id: 'utility',
      label: 'Utility Boat',
      description: 'V-hull work boats',
      recommendedHP: '9.9-30',
      image: '/lovable-uploads/6422c1aa-1ab1-4860-b77c-84dd486e4845.png'
    },
    {
      id: 'bass-boat',
      label: 'Bass Boat',
      description: 'Tournament ready',
      recommendedHP: '115-250',
      image: '/lovable-uploads/10d8a150-14cb-4481-b36a-3715fcae9605.png'
    },
    {
      id: 'pontoon',
      label: 'Pontoon',
      description: 'Family & entertainment',
      recommendedHP: '25-150',
      image: '/lovable-uploads/3c356039-87bb-4280-8f5d-555aa777d1ff.png',
      note: 'Needs Command Thrust motor'
    },
    {
      id: 'bowrider',
      label: 'Bowrider',
      description: 'Open bow runabout',
      recommendedHP: '90-300',
      image: '/lovable-uploads/359dcfb9-5466-47ba-a79e-cde787caea6e.png'
    },
    {
      id: 'center-console',
      label: 'Center Console',
      description: 'Offshore fishing',
      recommendedHP: '115-600',
      image: '/lovable-uploads/bc00ebae-067a-49d1-be75-82e023004a92.png'
    }
  ];

  // Progressive Wizard State
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [lengthFeet, setLengthFeet] = useState<number>(16);
  const isMobile = useIsMobile();

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
    setBoatInfo(prev => ({ ...prev, length: lengthBucket(feet) }));
  };

  const computeCompatibilityScore = (): number => {
    if (!selectedMotor) return 0;
    const idealHp = Math.max(20, lengthFeet * 8); // rough heuristic
    const ratio = selectedMotor.hp / idealHp;
    const score = Math.max(0, Math.min(100, Math.round((1 - Math.abs(1 - ratio)) * 100)));
    return score;
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

  // Derived values and UI helpers
  const hp = typeof selectedMotor?.hp === 'string' ? parseInt(String(selectedMotor?.hp)) : (selectedMotor?.hp || 0);
  const steps = boatInfo.type === 'motor-only'
    ? (showTradeIn
      ? [{ label: 'Specs' }, { label: 'Trade-In (Optional)' }, { label: 'Review' }]
      : [{ label: 'Specs' }, { label: 'Review' }]
    )
    : (showTradeIn
      ? [
          { label: 'Boat Type' },
          { label: 'Length' },
          { label: 'Transom Height' },
          { label: 'Controls & Rigging' },
          { label: 'Trade-In (Optional)' },
          { label: 'Review' },
        ]
      : [
          { label: 'Boat Type' },
          { label: 'Length' },
          { label: 'Transom Height' },
          { label: 'Controls & Rigging' },
          { label: 'Review' },
        ]
    );
  const nextStepLabel = steps[currentStep + 1]?.label;

  const [showHelp, setShowHelp] = useState(false);

  // (Using per-type recommendedHP from boatTypes entries)
  const handleSkip = () => {
    const defaultType = 'aluminum-fishing';
    const typicalLength = hp < 25 ? 14 : hp < 60 ? 16 : hp < 115 ? 18 : 20;
    setBoatInfo(prev => ({
      ...prev,
      type: prev.type || defaultType,
      length: lengthBucket(typicalLength),
    }));
    setLengthFeet(typicalLength);
    handleNext();
  };

  const totalSteps = boatInfo.type === 'motor-only' ? (showTradeIn ? 3 : 2) : (showTradeIn ? 6 : 5);
  const canNext = () => {
    if (boatInfo.type === 'motor-only') {
      if (currentStep === 0) return boatInfo.type === 'motor-only';
      if (currentStep === 1) return true; // trade-in step optional
      return true;
    }
    switch (currentStep) {
      case 0:
        return !!boatInfo.type && boatInfo.type !== 'motor-only';
      case 1:
        return !!boatInfo.length; // set via slider mapping
      case 2:
        return !!boatInfo.shaftLength; // transom helper
      case 3:
        return !!boatInfo.controlType;
      case 4:
        return true; // trade-in optional
      default:
        return true;
    }
  };

  const handleNext = () => setCurrentStep(s => Math.min(totalSteps - 1, s + 1));
  const handlePrev = () => {
    if (currentStep === 0) onBack();
    else setCurrentStep(s => Math.max(0, s - 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStepComplete({ ...boatInfo, tradeIn: tradeInInfo });
  };
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3 animate-fade-in">
        <h2 className="text-3xl font-bold text-foreground">Boat Details Wizard</h2>
        <p className="text-muted-foreground">
          Let's match your {selectedMotor?.model || 'Mercury motor'} to your boat, step by step.
        </p>
      </div>

      {/* Progress */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm text-muted-foreground">Step {currentStep + 1} of {totalSteps}</span>
        </div>
        <Progress value={((currentStep + 1) / totalSteps) * 100} className="h-3 mb-3" />
        <div className="flex flex-wrap items-center gap-3">
          {steps.map((step, i) => (
            <div key={step.label} className={`flex items-center gap-2 ${i <= currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold border ${i <= currentStep ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border'}`}>{i + 1}</div>
              <div className="text-xs md:text-sm">{step.label}</div>
              {i < steps.length - 1 && <div className="w-6 h-px bg-border mx-1 hidden md:block" />}
            </div>
          ))}
          <div className="ml-auto text-xs text-muted-foreground">
            {nextStepLabel ? `Next: ${nextStepLabel}` : 'Ready to continue'}
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      {currentStep === 0 && (
        <div className="rounded-lg border border-border bg-background p-4 flex flex-wrap gap-3">
          <span className="text-sm font-medium mr-1">Common Setups:</span>
          <Button type="button" variant="secondary" size="sm" onClick={() => { setBoatInfo(prev => ({ ...prev, type: 'fishing' })); setLengthFeet(14); setBoatInfo(prev => ({ ...prev, length: lengthBucket(14) })); }}>14ft Aluminum Fishing</Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => { setBoatInfo(prev => ({ ...prev, type: 'pontoon' })); setLengthFeet(20); setBoatInfo(prev => ({ ...prev, length: lengthBucket(20) })); }}>20ft Pontoon</Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => { setBoatInfo(prev => ({ ...prev, type: 'bass' })); setLengthFeet(16); setBoatInfo(prev => ({ ...prev, length: lengthBucket(16) })); }}>16ft Bass Boat</Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step Content */}
        {boatInfo.type === 'motor-only' ? (
          <>
            {currentStep === 0 && (
              <Card className="p-6 animate-fade-in">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Motor Only</h3>
                  <p className="text-sm text-muted-foreground">Buying a motor without a boat? We'll confirm specs at consultation.</p>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">Shaft Length (if known)</Label>
                    <Select value={boatInfo.shaftLength} onValueChange={(value) => setBoatInfo(prev => ({ ...prev, shaftLength: value }))}>
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
              </Card>
            )}

            {showTradeIn && currentStep === 1 && (
              <Card className="p-6 animate-fade-in">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Trade-In Valuation (Optional)</h3>
                  <TradeInValuation 
                    tradeInInfo={tradeInInfo}
                    onTradeInChange={setTradeInInfo}
                    currentMotorBrand={'No Current Motor'}
                    currentHp={0}
                  />
                </div>
              </Card>
            )}

            {currentStep === 2 && (
              <Card className="p-6 animate-fade-in">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Ready to Continue</h3>
                  <p className="text-sm text-muted-foreground">We'll use typical settings and confirm any unknowns.</p>
                </div>
              </Card>
            )}
          </>
        ) : (
          <>
            {currentStep === 0 && (
              <Card className="p-6 animate-fade-in">
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <Label className="text-2xl font-bold">What type of boat do you have?</Label>
                    <p className="text-muted-foreground">Pick the closest match.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {boatTypes.filter(t => t.id !== 'motor-only').map((type) => (
                      <button
                        type="button"
                        key={type.id}
                        onClick={() => setBoatInfo(prev => ({ ...prev, type: type.id }))}
                        className={`group relative rounded-xl border-2 bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg ${boatInfo.type === type.id ? 'border-primary bg-primary/5' : 'border-border'}`}
                        aria-pressed={boatInfo.type === type.id}
                      >
                        <div className="mb-3 h-36 overflow-hidden rounded-md border-b border-border bg-gradient-to-b from-muted/40 to-background flex items-center justify-center">
                          <img
                            src={type.image}
                            alt={`${type.label} boat`}
                            className="h-32 w-full object-contain transition-transform duration-200 group-hover:scale-[1.03]"
                            loading="lazy"
                          />
                        </div>
                        <h3 className="font-semibold">{type.label}</h3>
                        <div className="boat-details mt-1 space-y-0.5">
                          <span className="block text-sm text-muted-foreground">{type.description}</span>
                          {type.recommendedHP && (
                            <span className="block text-xs text-primary">Recommended: {type.recommendedHP} HP</span>
                          )}
                        </div>
                        <div className="selection-impact mt-2 text-xs text-muted-foreground">
                          {type.id === 'pontoon' && (
                            <span className="inline-flex items-center gap-1">
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
                            </span>
                          )}
                          {type.id === 'bass-boat' && <span>Built for speed</span>}
                        </div>
                      </button>
                    ))}

                    {/* Help option */}
                    <button
                      type="button"
                      onClick={() => setShowHelp(s => !s)}
                      className="group relative rounded-xl border-2 border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <div className="mb-3 h-24 overflow-hidden rounded-md border-b border-border bg-gradient-to-b from-muted/40 to-background flex items-center justify-center">
                        <img
                          src="/lovable-uploads/1d6d06c4-3b2d-477c-ae3c-042a3ca1a076.png"
                          alt="Not sure? We'll help you choose your boat type"
                          className="h-20 w-full object-contain"
                          loading="lazy"
                        />
                      </div>
                      <h3 className="font-semibold">Not Sure?</h3>
                      <p className="text-sm text-muted-foreground">We'll help you figure it out</p>
                    </button>
                  </div>

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
                  {boatInfo.type && selectedMotor && (
                    <div className="selection-feedback">
                      {boatInfo.type === 'pontoon' && hp < 25 ? (
                        <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
                          <AlertDescription>⚠️ Pontoons typically need 25HP+ for adequate performance</AlertDescription>
                        </Alert>
                      ) : (
                        <Alert className="border-green-500/30 bg-green-500/10">
                          <AlertDescription>✓ Good match for your {hp}HP motor</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

                  {/* Guided help */}
                  {showHelp && (
                    <div className="boat-identifier rounded-lg border border-border bg-muted/30 p-4">
                      <h3 className="font-semibold mb-2">Let's identify your boat:</h3>
                      <ul className="text-sm space-y-1">
                        <li>• Simple V-hull for work? → Utility Boat</li>
                        <li>• Does it have two tubes? → Pontoon</li>
                        <li>• Is it V-shaped and low? → Bass Boat</li>
                      </ul>
                    </div>
                  )}

                  {/* Quick Skip */}
                  <div className="skip-option">
                    <Button type="button" variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground">
                      Skip this step - Use typical settings for {hp || selectedMotor?.hp || '--'}HP
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {currentStep === 1 && (
              <Card className="p-6 animate-fade-in">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-lg font-semibold">How long is your boat?</Label>
                    <Slider
                      value={[lengthFeet]}
                      min={10}
                      max={30}
                      step={1}
                      onValueChange={handleLengthChange}
                    />
                    <div className="text-sm text-muted-foreground">Approx. {lengthFeet} ft</div>
                  </div>

                  {/* Visual Boat Builder */}
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                      <svg viewBox="0 0 400 120" className="w-full md:w-2/3">
                        <rect x="10" y="60" rx="6" ry="6" height="22" width={Math.max(80, Math.min(360, lengthFeet * 12))} className="fill-primary/50" />
                        {/* Motor on transom */}
                        {selectedMotor?.image && (
                          <image href={selectedMotor.image} x={Math.max(50, Math.min(330, lengthFeet * 12 - 20))} y="30" height="48" width="48" preserveAspectRatio="xMidYMid slice" />
                        )}
                      </svg>
                      <div className="md:w-1/3 space-y-2">
                        <div className="text-sm">Estimated Speed</div>
                        <div className="text-2xl font-bold">{selectedMotor ? Math.max(15, Math.round((selectedMotor.hp / Math.max(12, lengthFeet)) * 2)) : '--'} mph</div>
                        <div className="text-sm">Match Score</div>
                        <div className="flex items-center gap-2">
                          <Progress value={computeCompatibilityScore()} className="h-2" />
                          <span className="text-sm text-muted-foreground">{computeCompatibilityScore()}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Real-time validation */}
                  {selectedMotor && (
                    <div className="validation-feedback">
                      {selectedMotor.hp > lengthFeet * 10 ? (
                        <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
                          <AlertDescription>⚠️ This motor might be overpowered for your boat.</AlertDescription>
                        </Alert>
                      ) : selectedMotor.hp < lengthFeet * 3 ? (
                        <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
                          <AlertDescription>💡 This will work, but you might want more power.</AlertDescription>
                        </Alert>
                      ) : (
                        <Alert className="border-in-stock bg-in-stock/10">
                          <AlertDescription>✅ Great power-to-weight ratio!</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {currentStep === 2 && (
              <Card className="p-6 animate-fade-in">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold">Transom Height Helper</h3>
                    <p className="text-sm text-muted-foreground">Measure from top of transom to bottom of hull.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Button type="button" variant="outline" onClick={() => setBoatInfo(prev => ({ ...prev, shaftLength: '15' }))}>
                      <div className="text-left">
                        <div className="font-semibold">15" (Short)</div>
                        <div className="text-xs text-muted-foreground">Small boats, canoes</div>
                      </div>
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setBoatInfo(prev => ({ ...prev, shaftLength: '20' }))}>
                      <div className="text-left">
                        <div className="font-semibold">20" (Long)</div>
                        <div className="text-xs text-muted-foreground">Most boats - if unsure, pick this</div>
                      </div>
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setBoatInfo(prev => ({ ...prev, shaftLength: '25' }))}>
                      <div className="text-left">
                        <div className="font-semibold">25" (XL)</div>
                        <div className="text-xs text-muted-foreground">Sailboats, large pontoons</div>
                      </div>
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">Prefer to select it manually?</Label>
                    <Select value={boatInfo.shaftLength} onValueChange={(value) => setBoatInfo(prev => ({ ...prev, shaftLength: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select shaft length" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15" - Short Shaft</SelectItem>
                        <SelectItem value="20">20" - Long Shaft</SelectItem>
                        <SelectItem value="25">25" - Extra Long Shaft</SelectItem>
                        <SelectItem value="Not Sure">Not Sure</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            )}

            {currentStep === 3 && (
              <Card className="p-6 animate-fade-in">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Current Motor Brand</Label>
                      <Select value={boatInfo.currentMotorBrand} onValueChange={(value) => setBoatInfo(prev => ({ ...prev, currentMotorBrand: value }))}>
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

                    {compatibility && (
                      <Alert className={compatibility.type === 'warning' ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' : 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'}>
                        <div className="flex items-center gap-2">
                          {compatibility.icon}
                          <AlertDescription className={compatibility.type === 'warning' ? 'text-orange-800 dark:text-orange-200' : 'text-blue-800 dark:text-blue-200'}>
                            {compatibility.message}
                          </AlertDescription>
                        </div>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label>Control Type</Label>
                      <Select value={boatInfo.controlType} onValueChange={(value) => setBoatInfo(prev => ({ ...prev, controlType: value }))}>
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
                    </div>

                    {selectedMotor && (typeof selectedMotor.hp === 'number' ? selectedMotor.hp : parseInt(String(selectedMotor.hp))) >= 40 && (
                      <div className="controls-section rounded-lg border border-border bg-muted/30 p-4">
                        <h4 className="font-semibold mb-3">Steering Controls Required</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 control-options">
                          <label className="option-card rounded-md border border-border bg-background p-3 cursor-pointer">
                            <input
                              type="radio"
                              name="controls"
                              value="none"
                              className="mr-2"
                              checked={boatInfo.controlsOption === 'none'}
                              onChange={() => setBoatInfo(prev => ({ ...prev, controlsOption: 'none' }))}
                            />
                            <div>
                              <strong className="block">I need new controls</strong>
                              <span className="text-sm text-muted-foreground">+$1,200</span>
                              <small className="block text-xs text-muted-foreground">Complete remote control kit</small>
                            </div>
                          </label>

                          <label className="option-card rounded-md border-2 border-primary bg-primary/5 p-3 cursor-pointer">
                            <input
                              type="radio"
                              name="controls"
                              value="adapter"
                              className="mr-2"
                              checked={boatInfo.controlsOption === 'adapter'}
                              onChange={() => setBoatInfo(prev => ({ ...prev, controlsOption: 'adapter' }))}
                            />
                            <div>
                              <strong className="block">I have Mercury controls (2004 or newer)</strong>
                              <span className="text-sm text-primary">+$125 (Save $1,075!)</span>
                              <small className="block text-xs text-muted-foreground">We'll adapt your existing controls</small>
                            </div>
                          </label>

                          <label className="option-card rounded-md border border-border bg-background p-3 cursor-pointer">
                            <input
                              type="radio"
                              name="controls"
                              value="compatible"
                              className="mr-2"
                              checked={boatInfo.controlsOption === 'compatible'}
                              onChange={() => setBoatInfo(prev => ({ ...prev, controlsOption: 'compatible' }))}
                            />
                            <div>
                              <strong className="block">I have compatible controls ready</strong>
                              <span className="text-sm text-muted-foreground">No charge</span>
                              <small className="block text-xs text-muted-foreground">Already have the right setup</small>
                            </div>
                          </label>
                        </div>

                        {boatInfo.controlsOption === 'adapter' && (
                          <div className="adapter-info rounded-lg mt-3 p-3 bg-green-500/10">
                            <h5 className="font-bold">💰 Smart Choice!</h5>
                            <p className="text-sm">
                              Your existing Mercury controls can work with your new motor using our control harness adapter. This saves you over $1,000!
                            </p>
                            <small className="text-xs text-muted-foreground">
                              Compatible with most Mercury controls from 2004-present. We'll confirm compatibility during installation.
                            </small>
                          </div>
                        )}

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
                      </div>
                    )}

                    {/* Accessory checks */}
                    {(() => {
                      const hp = typeof selectedMotor?.hp === 'string' ? parseInt(String(selectedMotor?.hp)) : (selectedMotor?.hp || 0);
                      const model = (selectedMotor?.model || '').toUpperCase();
                      const isElectricStart = /\bE\b|EL|ELPT|EH|EFI/.test(model) && !/\bM\b/.test(model);
                      return (
                        <div className="accessories-check rounded-lg border border-border bg-muted/30 p-4 space-y-4">
                          <h3 className="text-lg font-semibold">What do you already have?</h3>
                          {hp >= 40 && (
                            <div className="accessory-item">
                              <div className="text-sm text-muted-foreground mb-1">Controls</div>
                              {/* Control radio options already shown above */}
                              <div className="text-xs text-muted-foreground">We’ll confirm compatibility during installation.</div>
                            </div>
                          )}
                          {isElectricStart && (
                            <div className="accessory-item">
                              <label className="flex items-start gap-2">
                                <input
                                  type="checkbox"
                                  checked={!!boatInfo.hasBattery}
                                  onChange={(e) => setBoatInfo(prev => ({ ...prev, hasBattery: e.target.checked }))}
                                />
                                <span>I have a marine battery</span>
                              </label>
                              {!boatInfo.hasBattery && (
                                <div className="cost-note text-sm text-primary">
                                  +$179.99 for battery
                                  <small className="block text-xs text-muted-foreground">Marine cranking battery</small>
                                </div>
                              )}
                            </div>
                          )}
                          {hp >= 25 && (
                            <div className="accessory-item">
                              <label className="flex items-start gap-2">
                                <input
                                  type="checkbox"
                                  checked={!!boatInfo.hasCompatibleProp}
                                  onChange={(e) => setBoatInfo(prev => ({ ...prev, hasCompatibleProp: e.target.checked }))}
                                />
                                <span>I have a compatible propeller from my old {hp}HP motor</span>
                              </label>
                              {!boatInfo.hasCompatibleProp && (
                                <div className="cost-note text-sm text-primary">
                                  +${hp >= 150 ? '950 (Stainless Steel)' : '350 (Aluminum)'}
                                  <small className="block text-xs text-muted-foreground">Size determined during water testing</small>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Highlight FREE water testing */}
                          <div className="water-test-benefit bg-accent p-4 rounded-lg">
                            <h4 className="font-bold">✅ FREE Water Testing Included</h4>
                            <p className="text-sm text-muted-foreground">
                              We're on the water! Every motor installation includes professional water testing to ensure perfect prop sizing and optimal performance. This $200 value is included FREE with your purchase.
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Optional make/model */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Boat Make (Optional)</Label>
                        <Input value={boatInfo.make} onChange={(e) => setBoatInfo(prev => ({ ...prev, make: e.target.value }))} placeholder="e.g., Boston Whaler" />
                      </div>
                      <div className="space-y-2">
                        <Label>Boat Model (Optional)</Label>
                        <Input value={boatInfo.model} onChange={(e) => setBoatInfo(prev => ({ ...prev, model: e.target.value }))} placeholder="e.g., Montauk 170" />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {showTradeIn && currentStep === 4 && (
              <Card className="p-6 animate-fade-in">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Have a motor to trade?</h3>
                  <TradeInValuation 
                    tradeInInfo={tradeInInfo}
                    onTradeInChange={setTradeInInfo}
                    currentMotorBrand={boatInfo.currentMotorBrand}
                    currentHp={boatInfo.currentHp}
                  />
                </div>
              </Card>
            )}

            {currentStep === 5 && (
              <Card className="p-6 animate-fade-in">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Compatibility Check</h3>
                    <div className="flex items-center gap-3">
                      <Progress value={computeCompatibilityScore()} className="h-3" />
                      <span className="text-sm text-muted-foreground">{computeCompatibilityScore()}% match</span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                      <svg viewBox="0 0 400 120" className="w-full md:w-2/3">
                        <rect x="10" y="60" rx="6" ry="6" height="22" width={Math.max(80, Math.min(360, lengthFeet * 12))} className="fill-primary/50" />
                        {selectedMotor?.image && (
                          <image href={selectedMotor.image} x={Math.max(50, Math.min(330, lengthFeet * 12 - 20))} y="30" height="48" width="48" preserveAspectRatio="xMidYMid slice" />
                        )}
                      </svg>
                      <div className="md:w-1/3 space-y-2">
                        <div className="text-sm">Estimated Speed</div>
                        <div className="text-2xl font-bold">{selectedMotor ? Math.max(15, Math.round((selectedMotor.hp / Math.max(12, lengthFeet)) * 2)) : '--'} mph</div>
                        <div className="text-sm text-muted-foreground">We'll fine-tune during consultation.</div>
                      </div>
                    </div>
                  </div>
                  {/* Gamification */}
                  <div className="progress-rewards text-sm">
                    {boatInfo.type && boatInfo.shaftLength && boatInfo.controlType && (
                      <div className="rounded-md border border-primary/30 bg-primary/5 p-3">🏆 Detail Detective - You're thorough!</div>
                    )}
                    {selectedMotor && computeCompatibilityScore() > 80 && (
                      <div className="mt-2 rounded-md border border-green-500/30 bg-green-500/10 p-3">⭐ Excellent match - Great motor/boat combo!</div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </>
        )}

        {/* Bottom Navigation */}
        <div className="flex items-center justify-between pt-2">
          <Button type="button" variant="outline" onClick={handlePrev}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          {currentStep < totalSteps - 1 ? (
            <Button type="button" onClick={handleNext} disabled={!canNext()}>
              Next
            </Button>
          ) : (
            <Button type="submit" disabled={!boatInfo.type || (boatInfo.type !== 'motor-only' && !boatInfo.length)}>
              Continue to Quote
            </Button>
          )}
        </div>
      </form>

      {/* Mobile chat style hint */}
      {isMobile && (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="text-sm text-muted-foreground">Tip: You can tap a preset above to speed things up.</div>
        </div>
      )}
    </div>
  );
};