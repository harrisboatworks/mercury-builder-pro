import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Ship, Info, CheckCircle2 } from 'lucide-react';
import { Motor, BoatInfo } from '../QuoteBuilder';

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

  const boatTypes = [
    { id: 'fishing', name: 'Fishing Boat', icon: '🎣' },
    { id: 'pontoon', name: 'Pontoon', icon: '🛥️' },
    { id: 'speed', name: 'Speed Boat', icon: '🚤' },
    { id: 'deck', name: 'Deck Boat', icon: '⛵' },
    { id: 'bass', name: 'Bass Boat', icon: '🐟' },
    { id: 'work', name: 'Work Boat', icon: '⚓' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStepComplete(boatInfo);
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
          <div className="space-y-4">
            <Label className="text-lg font-semibold flex items-center gap-2">
              <Ship className="w-5 h-5" />
              Boat Type
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {boatTypes.map(type => (
                <Button
                  key={type.id}
                  type="button"
                  variant={boatInfo.type === type.id ? 'default' : 'outline'}
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => setBoatInfo(prev => ({ ...prev, type: type.id }))}
                >
                  <span className="text-2xl">{type.icon}</span>
                  <span className="text-sm">{type.name}</span>
                </Button>
              ))}
            </div>
          </div>
        </Card>

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
              <Alert className={compatibility.type === 'warning' ? 'border-on-order bg-on-order/10' : 'border-primary bg-primary/10'}>
                <div className="flex items-center gap-2">
                  {compatibility.icon}
                  <AlertDescription>
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

        {/* Navigation */}
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Motor Selection
          </Button>
          
          <Button 
            type="submit" 
            disabled={!boatInfo.type || !boatInfo.length}
            className="bg-primary hover:bg-primary/90"
          >
            Continue to Quote
          </Button>
        </div>
      </form>
    </div>
  );
};