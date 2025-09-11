// src/components/quote-builder/PurchasePath.tsx
import { motion } from "framer-motion";
import { Package, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isTillerMotor } from "@/lib/utils";

interface PurchasePathProps {
  selectedMotor: any;
  onSelectPath: (path: 'loose' | 'installed') => void;
}

export default function PurchasePath({ selectedMotor, onSelectPath }: PurchasePathProps) {
  const model = (selectedMotor?.model || '').toUpperCase();
  const hp = typeof selectedMotor?.hp === 'string' ? parseInt(selectedMotor.hp, 10) : selectedMotor?.hp;
  const isTiller = isTillerMotor(selectedMotor?.model || '');
  const isInStock = selectedMotor?.stockStatus === 'In Stock';
  const includes12LTank = hp && hp >= 9.9 && hp <= 20 && !isTiller;
  
  const handleLooseMotorSelect = () => {
    onSelectPath('loose');
  };
  
  const handleInstalledSelect = () => {
    onSelectPath('installed');
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
          
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-8 h-8 text-primary" />
              <CardTitle className="text-xl">Loose Motor</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              In-store pickup only • No installation
            </p>
          </CardHeader>
          
          <CardContent className="space-y-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-green-600 text-sm">✓</span>
                <span>Free Prep</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-green-600 text-sm">✓</span>
                <span>Shop Tank Tested</span>
              </div>
              {isTiller ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-green-600 text-sm">✓</span>
                  <span>Includes propeller & internal fuel tank</span>
                </div>
              ) : includes12LTank ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-green-600 text-sm">✓</span>
                  <span>Includes 12L fuel tank & hose</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-green-600 text-sm">✓</span>
                  <span>Ready for rigging & accessories</span>
                </div>
              )}
              {isTiller && isInStock && (
                <div className="flex items-center gap-1.5">
                  <span className="text-green-600 text-sm">✓</span>
                  <span>Same-day pickup available</span>
                </div>
              )}
            </div>
            
            <Button className="max-w-xs mx-auto mt-3 block h-8 md:h-9 px-4 py-2 text-sm">
              Select Loose Motor
            </Button>
          </CardContent>
        </Card>
        
        <Card className="relative hover:shadow-lg transition-all duration-200 cursor-pointer group border-2 hover:border-primary/50" 
              onClick={handleInstalledSelect}>
          <Badge className="absolute -top-2 -right-2 bg-purple-600 hover:bg-purple-600 text-xs">
            Full Service
          </Badge>
          
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3 mb-2">
              <Wrench className="w-8 h-8 text-primary" />
              <CardTitle className="text-xl">Professional Installation</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              {isTiller ? 'Complete motor prep & water test' : 'Complete rigging & water test'}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              {!isTiller && (
                <div className="flex items-center gap-1.5">
                  <span className="text-green-600 text-sm">✓</span>
                  <span>Controls & gauges configured</span>
                </div>
              )}
              {isTiller && (
                <div className="flex items-center gap-1.5">
                  <span className="text-green-600 text-sm">✓</span>
                  <span>Securely bolted to transom (if requested)</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className="text-green-600 text-sm">✓</span>
                <span>Marine battery included ($180)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-green-600 text-sm">✓</span>
                <span>Old motor removal available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-green-600 text-sm">✓</span>
                <span>Water tested & prop optimized</span>
              </div>
            </div>
            
            <Button className="max-w-xs mx-auto mt-3 block h-8 md:h-9 px-4 py-2 text-sm">
              Select Installation
            </Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
