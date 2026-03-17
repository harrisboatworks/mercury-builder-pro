// src/components/quote-builder/PurchasePath.tsx
import { motion } from "framer-motion";
import { Package, Wrench, CheckCircle } from "lucide-react";
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
  const hasInternalTank = hp && hp <= 6;
  const includes12LTank = hp && hp >= 8 && hp <= 20;
  const includes25LTank = hp && hp >= 25 && hp <= 30 && isTiller;
  
  const handleLooseMotorSelect = () => onSelectPath('loose');
  const handleInstalledSelect = () => onSelectPath('installed');

  // Determine the loose motor "includes" line for mobile
  const getLooseIncludes = () => {
    if (isTiller && hasInternalTank) return 'Propeller & internal tank included';
    if (isTiller && includes12LTank) return 'Propeller & 12L tank included';
    if (isTiller && includes25LTank) return 'Propeller & 25L tank included';
    if (includes12LTank && !isTiller) return '12L fuel tank & hose included';
    return 'Propeller included';
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* ===== MOBILE LAYOUT (< md) ===== */}
      <div className="md:hidden space-y-3">
        {/* Loose Motor - Compact */}
        <button
          onClick={handleLooseMotorSelect}
          className="w-full text-left bg-white rounded-lg border-2 border-border active:scale-[0.98] transition-transform p-4 relative"
        >
          <Badge className="absolute -top-2 right-3 bg-foreground hover:bg-foreground text-background text-[10px] tracking-[0.12em] uppercase font-light">
            Quick & Easy
          </Badge>
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="text-base font-light tracking-wide text-foreground">Loose Motor</span>
          </div>
          <div className="space-y-1 text-sm text-foreground/80 mb-3 pl-8">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
              <span>Free prep & shop tank tested</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
              <span>{getLooseIncludes()}</span>
            </div>
            {isTiller && isInStock && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                <span>Same-day pickup available</span>
              </div>
            )}
          </div>
          <div className="border-t border-border pt-3">
            <span className="block w-full text-center text-xs tracking-widest uppercase font-normal text-foreground">
              Select Loose Motor →
            </span>
          </div>
        </button>

        {/* Professional Install - Compact */}
        <button
          onClick={handleInstalledSelect}
          className="w-full text-left bg-white rounded-lg border-2 border-border active:scale-[0.98] transition-transform p-4 relative"
        >
          <Badge className="absolute -top-2 right-3 bg-foreground hover:bg-foreground text-background text-[10px] tracking-[0.12em] uppercase font-light">
            Full Service
          </Badge>
          <div className="flex items-center gap-3 mb-2">
            <Wrench className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="text-base font-light tracking-wide text-foreground">Professional Install</span>
          </div>
          <div className="space-y-1 text-sm text-foreground/80 mb-3 pl-8">
            {!isTiller && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                <span>Controls & gauges configured</span>
              </div>
            )}
            {isTiller && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                <span>Bolted to transom (if requested)</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
              <span>Battery included · Water tested</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
              <span>Old motor removal available</span>
            </div>
          </div>
          <div className="border-t border-border pt-3">
            <span className="block w-full text-center text-xs tracking-widest uppercase font-normal text-foreground">
              Select Installation →
            </span>
          </div>
        </button>
      </div>

      {/* ===== DESKTOP LAYOUT (≥ md) ===== */}
      <div className="hidden md:grid md:grid-cols-2 gap-6 items-stretch">
        {/* Loose Motor Card */}
        <Card className="relative bg-white hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-primary/50 flex flex-col premium-lift" 
              onClick={handleLooseMotorSelect}>
          <Badge className="absolute -top-2 -right-2 bg-foreground hover:bg-foreground text-background text-[10px] tracking-[0.15em] uppercase font-light premium-pulse">
            Quick & Easy
          </Badge>
          
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-3">
              <Package className="w-8 h-8 text-primary" />
              <CardTitle className="text-2xl font-light tracking-wide text-foreground">Loose Motor</CardTitle>
            </div>
            <p className="text-sm font-normal text-muted-foreground">
              In-store pickup only • No installation
            </p>
          </CardHeader>
          
          <CardContent className="flex flex-col flex-1 pt-0">
            <div className="space-y-3 text-base font-normal text-foreground/80 flex-1 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span>Free Prep & Shop Tank Tested</span>
              </div>
              {isTiller && hasInternalTank ? (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Includes propeller & internal fuel tank</span>
                </div>
              ) : isTiller && includes12LTank ? (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Includes propeller & 12L fuel tank</span>
                </div>
              ) : isTiller && includes25LTank ? (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Includes propeller & 25L fuel tank</span>
                </div>
              ) : includes12LTank && !isTiller ? (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Includes 12L fuel tank & hose</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Includes propeller</span>
                </div>
              )}
              {isTiller && isInStock && (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Same-day pickup available</span>
                </div>
              )}
            </div>
            
            <Button 
              variant="outline"
              className="w-full border-2 border-foreground text-foreground py-6 text-xs tracking-widest uppercase font-normal rounded-sm hover:bg-foreground hover:text-background transition-all duration-500 premium-btn-hover"
            >
              Select Loose Motor
            </Button>
          </CardContent>
        </Card>
        
        {/* Professional Installation Card */}
        <Card className="relative bg-white hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-primary/50 flex flex-col premium-lift" 
              onClick={handleInstalledSelect}>
          <Badge className="absolute -top-2 -right-2 bg-foreground hover:bg-foreground text-background text-[10px] tracking-[0.15em] uppercase font-light premium-pulse">
            Full Service
          </Badge>
          
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-3">
              <Wrench className="w-8 h-8 text-primary" />
              <CardTitle className="text-2xl font-light tracking-wide text-foreground">Professional Install</CardTitle>
            </div>
            <p className="text-sm font-normal text-muted-foreground">
              {isTiller ? 'Complete motor prep & water test' : 'Complete rigging & water test'}
            </p>
          </CardHeader>
          
          <CardContent className="flex flex-col flex-1 pt-0">
            <div className="space-y-3 text-base font-normal text-foreground/80 flex-1 mb-6">
              {!isTiller && (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Controls & gauges configured</span>
                </div>
              )}
              {isTiller && (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Bolted to transom (if requested)</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span>Marine battery included ($180)</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span>Old motor removal available</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span>Water tested & prop optimized</span>
              </div>
            </div>
            
            <Button 
              variant="outline"
              className="w-full border-2 border-foreground text-foreground py-6 text-xs tracking-widest uppercase font-normal rounded-sm hover:bg-foreground hover:text-background transition-all duration-500 premium-btn-hover"
            >
              Select Installation
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
