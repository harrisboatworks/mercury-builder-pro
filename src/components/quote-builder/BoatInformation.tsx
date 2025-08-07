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

interface BoatInformationProps {
  onStepComplete: (boatInfo: BoatInfo) => void;
  onBack: () => void;
  selectedMotor: Motor | null;
}

export const BoatInformation = ({ onStepComplete, onBack, selectedMotor }: BoatInformationProps) => {
  const [boatInfo, setBoatInfo] = useState<BoatInfo>({
    type: '',
    make: '',
    model: '',
    length: '',
    currentMotorBrand: '',
    currentHp: 0,
    serialNumber: '',
    controlType: '',
    shaftLength: 'Not Sure'
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

  const boatTypes = [
    { 
      id: 'motor-only', 
      name: 'Motor Only', 
      subtitle: 'No boat yet • Spare motor • I know my specs',
      badge: 'Skip to Quote',
      gradient: 'from-emerald-500 to-teal-600',
      icon: '📦'
    },
    { 
      id: 'fishing', 
      name: 'Fishing', 
      subtitle: 'Bass • Center Console • Jon Boats',
      badge: 'Popular Choice',
      gradient: 'from-blue-500 to-blue-600',
      icon: '🎣'
    },
    { 
      id: 'pontoon', 
      name: 'Pontoon', 
      subtitle: 'Party Barges • Fishing Ponts • Luxury',
      badge: 'Family Fun',
      gradient: 'from-purple-500 to-pink-500',
      icon: '⛵'
    },
    { 
      id: 'speed', 
      name: 'Speed Boat', 
      subtitle: 'Performance • Wakeboard • Ski Boats',
      badge: 'Thrill Seeker',
      gradient: 'from-orange-500 to-yellow-500',
      icon: '🏁'
    },
    { 
      id: 'deck', 
      name: 'Deck Boat', 
      subtitle: 'Bow Riders • Runabouts • Cruisers',
      badge: 'Versatile',
      gradient: 'from-teal-500 to-cyan-500',
      icon: '🛥️'
    },
    { 
      id: 'bass', 
      name: 'Bass Boat', 
      subtitle: 'Tournament • Recreation • Pro Angler',
      badge: 'Serious Angler',
      gradient: 'from-green-500 to-emerald-500',
      icon: '🦆'
    },
    { 
      id: 'work', 
      name: 'Work Boat', 
      subtitle: 'Commercial • Utility • Transport',
      badge: 'Heavy Duty',
      gradient: 'from-gray-600 to-gray-700',
      icon: '🔧'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStepComplete({ ...boatInfo, tradeIn: tradeInInfo });
  };

  const getCompatibilityMessage = () => {
    if (boatInfo.currentMotorBrand === 'Mercury') {
      return {
        type: 'info',
        message: 'Control compatibility will be verified during consultation',
        icon: <CheckCircle2 className="w-4 h-4" />
      };
    } else if (boatInfo.currentMotorBrand && boatInfo.currentMotorBrand !== 'No Current Motor') {
      return {
        type: 'warning',
        message: 'New Mercury controls and cables will be required (additional cost)',
        icon: <Info className="w-4 h-4" />
      };
    }
    return null;
  };

  const compatibility = getCompatibilityMessage();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-foreground">Tell Us About Your Boat</h2>
        <p className="text-lg text-muted-foreground">
          Help us ensure the perfect fit for your {selectedMotor?.model}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Boat Type Selection */}
        <Card className="p-6">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Label className="text-2xl font-bold flex items-center justify-center gap-2">
                🎯 Select Your Boat Type
              </Label>
              <p className="text-muted-foreground">Choose the category that best describes your boat</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {boatTypes.map((type, index) => (
                <div
                  key={type.id}
                  className={`boat-type-card relative cursor-pointer bg-gradient-to-br ${type.gradient} text-white p-6 rounded-2xl min-h-[200px] transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                    boatInfo.type === type.id 
                      ? 'ring-4 ring-primary shadow-2xl scale-105' 
                      : 'hover:shadow-lg'
                  }`}
                  onClick={() => setBoatInfo(prev => ({ ...prev, type: type.id }))}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Selection Checkmark */}
                  {boatInfo.type === type.id && (
                    <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center animate-in zoom-in-50 duration-300">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  )}
                  
                  {/* Badge */}
                  <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
                    {type.badge}
                  </div>
                  
                  {/* Content */}
                  <div className="flex flex-col justify-center items-center text-center h-full space-y-3">
                    <div className="text-4xl mb-2">
                      {type.icon}
                    </div>
                    <h3 className="text-xl font-bold">{type.name}</h3>
                    <p className="text-sm opacity-90 leading-relaxed">{type.subtitle}</p>
                  </div>
                  
                  {/* Ripple effect container */}
                  <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                    {boatInfo.type === type.id && (
                      <div className="ripple-effect absolute inset-0 bg-white/20 animate-ping rounded-2xl"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Motor Only Details */}
        {boatInfo.type === 'motor-only' ? (
          <Card className="p-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Motor Purchase Details</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>I'm buying this motor for:</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { id: 'future-boat', label: 'Future boat purchase' },
                      { id: 'spare-backup', label: 'Spare/backup motor' },
                      { id: 'replacement', label: 'Replacement (I know my specs)' },
                      { id: 'other', label: 'Other/Not sure yet' }
                    ].map((purpose) => (
                      <div
                        key={purpose.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          boatInfo.make === purpose.id 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setBoatInfo(prev => ({ ...prev, make: purpose.id }))}
                      >
                        <span className="text-sm font-medium">{purpose.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shaftLength">Shaft Length (if known)</Label>
                  <Select value={boatInfo.shaftLength} onValueChange={(value) => setBoatInfo(prev => ({ ...prev, shaftLength: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select shaft length" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15"</SelectItem>
                      <SelectItem value="20">20"</SelectItem>
                      <SelectItem value="25">25"</SelectItem>
                      <SelectItem value="Not Sure">Not Sure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
                <Info className="w-4 h-4" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  Professional consultation recommended to confirm specifications when you're ready to install.
                </AlertDescription>
              </Alert>
            </div>
          </Card>
        ) : (
          <>
            {/* Boat Details */}
            <Card className="p-6">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Boat Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="make">Boat Make (Optional)</Label>
                    <Input
                      id="make"
                      value={boatInfo.make}
                      onChange={(e) => setBoatInfo(prev => ({ ...prev, make: e.target.value }))}
                      placeholder="e.g., Boston Whaler"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model">Boat Model (Optional)</Label>
                    <Input
                      id="model"
                      value={boatInfo.model}
                      onChange={(e) => setBoatInfo(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="e.g., Montauk 170"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="length">Boat Length *</Label>
                    <Select value={boatInfo.length} onValueChange={(value) => setBoatInfo(prev => ({ ...prev, length: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select boat length" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under-14">Under 14ft</SelectItem>
                        <SelectItem value="14-16">14-16ft</SelectItem>
                        <SelectItem value="17-19">17-19ft</SelectItem>
                        <SelectItem value="20-22">20-22ft</SelectItem>
                        <SelectItem value="23-plus">23ft+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentBrand">Current Motor Brand</Label>
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
                </div>

                {/* Compatibility Alert */}
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
              </div>
            </Card>

            {/* Technical Details */}
            <Card className="p-6">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Technical Specifications</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="controlType">Control Type</Label>
                    <Select value={boatInfo.controlType} onValueChange={(value) => setBoatInfo(prev => ({ ...prev, controlType: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select control type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="side-mount">Side Mount</SelectItem>
                        <SelectItem value="binnacle">Binnacle/Top Mount</SelectItem>
                        <SelectItem value="tiller">Tiller</SelectItem>
                        <SelectItem value="not-sure">Not Sure</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shaftLength">Shaft Length</Label>
                    <Select value={boatInfo.shaftLength} onValueChange={(value) => setBoatInfo(prev => ({ ...prev, shaftLength: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select shaft length" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15"</SelectItem>
                        <SelectItem value="20">20"</SelectItem>
                        <SelectItem value="25">25"</SelectItem>
                        <SelectItem value="Not Sure">Not Sure</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentHp">Current Horsepower (Optional)</Label>
                    <Input
                      id="currentHp"
                      type="number"
                      value={boatInfo.currentHp || ''}
                      onChange={(e) => setBoatInfo(prev => ({ ...prev, currentHp: parseInt(e.target.value) || 0 }))}
                      placeholder="e.g., 115"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serialNumber">Serial Number (Optional)</Label>
                    <Input
                      id="serialNumber"
                      value={boatInfo.serialNumber}
                      onChange={(e) => setBoatInfo(prev => ({ ...prev, serialNumber: e.target.value }))}
                      placeholder="Motor serial number"
                    />
                  </div>
                </div>

                {/* Help Message */}
                {(boatInfo.controlType === 'not-sure' || boatInfo.shaftLength === 'Not Sure') && (
                  <Alert className="border-in-stock bg-in-stock/10">
                    <CheckCircle2 className="w-4 h-4" />
                    <AlertDescription>
                      No problem! Our technicians will verify all specifications during your consultation.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </Card>
          </>
        )}


        {/* Trade-In Valuation */}
        <TradeInValuation 
          tradeInInfo={tradeInInfo}
          onTradeInChange={setTradeInInfo}
          currentMotorBrand={boatInfo.type === 'motor-only' ? 'No Current Motor' : boatInfo.currentMotorBrand}
          currentHp={boatInfo.type === 'motor-only' ? 0 : boatInfo.currentHp}
        />

        {/* Navigation */}
        <div className="form-navigation">
          <Button type="button" variant="outline" onClick={onBack} className="btn-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Motor Selection
          </Button>
          
          <Button 
            type="submit" 
            disabled={!boatInfo.type || (boatInfo.type !== 'motor-only' && !boatInfo.length)}
            className="btn-continue btn-primary"
          >
            {boatInfo.type === 'motor-only' ? 'Continue to Quote' : 'Continue to Quote'}
          </Button>
        </div>
      </form>
    </div>
  );
};