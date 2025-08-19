import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Fuel, Check } from "lucide-react";

interface FuelTankOptionsProps {
  selectedMotor: any;
  onComplete: (config: { externalTank: boolean }) => void;
  onBack: () => void;
}

export default function FuelTankOptions({ selectedMotor, onComplete, onBack }: FuelTankOptionsProps) {
  const [externalTank, setExternalTank] = useState(false);

  const isTiller = selectedMotor?.model?.toLowerCase().includes('tiller') || 
    selectedMotor?.engine_type?.toLowerCase().includes('tiller');
  
  // Specific detection for internal-only motors (2.5HP and 3.5HP)
  const isInternalOnlyTiller = (selectedMotor?.horsepower === 2.5 || selectedMotor?.horsepower === 3.5) && isTiller;
  const isSmallTiller = selectedMotor?.horsepower <= 6 && isTiller && !isInternalOnlyTiller;
  const isMediumTiller = selectedMotor?.horsepower >= 9.9 && selectedMotor?.horsepower <= 20 && isTiller;
  const isLargeTiller = selectedMotor?.horsepower >= 25 && isTiller;

  const handleComplete = () => {
    onComplete({ externalTank });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Fuel Tank Configuration</h1>
          <p className="text-gray-600">
            {isInternalOnlyTiller && `Your ${selectedMotor?.horsepower}HP tiller motor has a built-in internal fuel system - no external connection available`}
            {isSmallTiller && `Your ${selectedMotor?.horsepower}HP tiller motor includes an internal fuel tank and propeller`}
            {isMediumTiller && `Your ${selectedMotor?.horsepower}HP tiller motor includes valuable extras worth $598!`}
            {isLargeTiller && `Your ${selectedMotor?.horsepower}HP tiller motor includes a propeller - fuel tank available as optional upgrade`}
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fuel className="w-5 h-5" />
              Included with Your Motor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(isInternalOnlyTiller || isSmallTiller) && (
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>
                    {isInternalOnlyTiller ? "Built-in internal fuel system" : "Internal fuel tank"}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <span>Propeller included</span>
                {isMediumTiller && <Badge variant="secondary">$300 value</Badge>}
              </div>
              {isMediumTiller && (
                <>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600" />
                    <span>12L External Fuel Tank & Hose included</span>
                    <Badge variant="secondary">$199 value</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600" />
                    <span>Free preparation service</span>
                    <Badge variant="secondary">$99 value</Badge>
                  </div>
                </>
              )}
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <span>Ready for customer pickup - no installation required</span>
              </div>
              {isInternalOnlyTiller && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> This motor is designed with a built-in fuel system and does not have 
                    an external fuel connection port. The internal tank provides reliable fuel supply for typical use.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {isLargeTiller && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Optional Upgrade</CardTitle>
              <CardDescription>
                Add fuel capacity with an external fuel tank system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <Checkbox
                  id="external-tank"
                  checked={externalTank}
                  onCheckedChange={(checked) => setExternalTank(checked === true)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="external-tank" className="cursor-pointer">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium">12L External Fuel Tank & Hose</span>
                      <Badge variant="secondary">+$199</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Essential for extended operation. Tank connects to your motor's fuel inlet for reliable fuel supply.
                    </p>
                  </label>
                </div>
                {externalTank && (
                  <img 
                    src="/lovable-uploads/2bb92128-ea57-4233-ae9e-4215f5fc256d.png" 
                    alt="12L External Fuel Tank"
                    className="w-24 h-24 object-contain rounded-lg border"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {isMediumTiller && (
          <Card className="mb-8 bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800">All Extras Included!</CardTitle>
              <CardDescription className="text-green-700">
                Your 9.9-20HP tiller motor comes with everything you need - no additional purchases required
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-800 mb-2">
                  Total Value: $598 in FREE extras
                </div>
                <p className="text-green-700">
                  Propeller, fuel tank system, and preparation service all included
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={handleComplete}>
            Continue to Quote
          </Button>
        </div>
      </motion.div>
    </div>
  );
}