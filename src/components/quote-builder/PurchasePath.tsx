// src/components/quote-builder/PurchasePath.tsx
import { motion } from "framer-motion";
import { Package, Wrench, Battery, Info } from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isTillerMotor } from "@/lib/utils";

interface PurchasePathProps {
  selectedMotor: any;
  onSelectPath: (path: 'loose' | 'installed', options?: { battery?: boolean }) => void;
}

export default function PurchasePath({ selectedMotor, onSelectPath }: PurchasePathProps) {
  const [needsBattery, setNeedsBattery] = useState(false);
  
  const model = (selectedMotor?.model || '').toUpperCase();
  const hp = typeof selectedMotor?.hp === 'string' ? parseInt(selectedMotor.hp, 10) : selectedMotor?.hp;
  const isTiller = isTillerMotor(selectedMotor?.model || '');
  const isElectricStart = !(/\bM\b/.test(model) || model.includes('MH'));
  const isInStock = selectedMotor?.stockStatus === 'In Stock';
  const includes12LTank = hp && hp >= 9.9 && hp <= 20 && !isTiller;
  
  const handleLooseMotorSelect = () => {
    onSelectPath('loose', { battery: needsBattery });
  };
  
  const handleInstalledSelect = () => {
    onSelectPath('installed', { battery: needsBattery });
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Great Choice! {selectedMotor?.model}
        </h2>
        <p className="text-muted-foreground">How would you like to purchase this motor?</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
        <Card className="relative hover:shadow-lg transition-all duration-200 cursor-pointer group border-2 hover:border-primary/50" 
              onClick={handleLooseMotorSelect}>
          <Badge className="absolute -top-2 -right-2 bg-green-500 hover:bg-green-500 text-xs">
            Quick & Easy
          </Badge>
          
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-8 h-8 text-primary" />
              <CardTitle className="text-xl">Loose Motor</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              In-store pickup only • No installation
            </p>
          </CardHeader>
          
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</div>
                <span>Free Prep</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</div>
                <span>Shop Tank Tested</span>
              </div>
              {isTiller ? (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</div>
                  <span>Includes propeller & internal fuel tank</span>
                </div>
              ) : includes12LTank ? (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</div>
                  <span>Includes 12L fuel tank & hose</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</div>
                  <span>Ready for rigging & accessories</span>
                </div>
              )}
              {isTiller && isInStock && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</div>
                  <span>Same-day pickup available</span>
                </div>
              )}
            </div>
            
            <Button className="max-w-xs mx-auto mt-4 block h-8 md:h-9 px-4 py-2 text-sm">
              Select Loose Motor
            </Button>
          </CardContent>
        </Card>
        
        <Card className="relative hover:shadow-lg transition-all duration-200 cursor-pointer group border-2 hover:border-primary/50" 
              onClick={handleInstalledSelect}>
          <Badge className="absolute -top-2 -right-2 bg-purple-600 hover:bg-purple-600 text-xs">
            Full Service
          </Badge>
          
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3 mb-2">
              <Wrench className="w-8 h-8 text-primary" />
              <CardTitle className="text-xl">Professional Installation</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              {isTiller ? 'Complete motor prep & water test' : 'Complete rigging & water test'}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {!isTiller && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</div>
                  <span>Controls & gauges configured</span>
                </div>
              )}
              {isTiller && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</div>
                  <span>Securely bolted to transom (if requested)</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</div>
                <span>Old motor removal available</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</div>
                <span>Water tested & prop optimized</span>
              </div>
            </div>
            
            <Button className="max-w-xs mx-auto mt-4 block h-8 md:h-9 px-4 py-2 text-sm">
              Select Installation
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {isElectricStart && (
        <TooltipProvider>
          <Card className="max-w-2xl mx-auto mt-6">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Battery className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-lg font-semibold mb-2">Battery Required</h4>
                  <p className="text-muted-foreground text-sm mb-4">
                    Electric start motors require a marine battery for operation. 
                  </p>
                  
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="battery-option"
                      checked={needsBattery}
                      onCheckedChange={(checked) => setNeedsBattery(checked === true)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <label htmlFor="battery-option" className="cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">Add Deka Marine Master Battery</span>
                          <Badge variant="secondary">$179.99</Badge>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-sm">
                                <p className="font-medium">Deka Marine Master 24M7</p>
                                <p>1000 Cold Cranking Amps</p>
                                <p>2-year warranty included</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          High-quality marine starting battery with 2-year warranty
                        </p>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="hidden md:block flex-shrink-0 ml-4">
                  <img 
                    src="/lovable-uploads/4bdf5164-e316-4a1a-959e-654fe246f29c.png" 
                    alt="Deka Marine Master Battery" 
                    className="w-20 h-20 object-contain rounded-lg"
                    loading="lazy"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TooltipProvider>
      )}
    </motion.div>
  );
}
