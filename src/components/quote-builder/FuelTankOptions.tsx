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

  const isSmallTiller = selectedMotor?.horsepower <= 6 && 
    (selectedMotor?.model?.toLowerCase().includes('tiller') || 
     selectedMotor?.engine_type?.toLowerCase().includes('tiller'));

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
            Your {selectedMotor?.horsepower}HP tiller motor includes an internal fuel tank and propeller
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
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <span>Internal fuel tank</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <span>Propeller included</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <span>Ready for customer pickup - no installation required</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Optional Upgrade</CardTitle>
            <CardDescription>
              Add extended range with an external fuel tank system
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
                    Provides extended range and convenience for longer trips. 
                    Tank connects easily to your motor's fuel inlet.
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