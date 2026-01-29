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
  const hasInternalTank = hp && hp <= 6;  // Only ≤6HP have internal tanks
  const includes12LTank = hp && hp >= 8 && hp <= 20;  // 8-20HP (both tiller & remote)
  const includes25LTank = hp && hp >= 25 && hp <= 30 && isTiller;  // 25-30HP tiller only
  
  const handleLooseMotorSelect = () => {
    onSelectPath('loose');
  };
  
  const handleInstalledSelect = () => {
    onSelectPath('installed');
  };
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto items-stretch">
        <motion.div variants={cardVariants}>
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
            <p className="text-sm font-light text-muted-foreground">
              In-store pickup only • No installation
            </p>
          </CardHeader>
          
          <CardContent className="flex flex-col flex-1 pt-0">
            <div className="space-y-3 text-base font-light text-muted-foreground flex-1 mb-6">
              <div className="flex flex-row items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-left">Free Prep</span>
              </div>
              <div className="flex flex-row items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-left">Shop Tank Tested</span>
              </div>
              {isTiller && hasInternalTank ? (
                <div className="flex flex-row items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-left">Includes propeller & internal fuel tank</span>
                </div>
              ) : isTiller && includes12LTank ? (
                <div className="flex flex-row items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-left">Includes propeller & 12L fuel tank</span>
                </div>
              ) : isTiller && includes25LTank ? (
                <div className="flex flex-row items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-left">Includes propeller & 25L fuel tank</span>
                </div>
              ) : includes12LTank && !isTiller ? (
                <div className="flex flex-row items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-left">Includes 12L fuel tank & hose</span>
                </div>
              ) : (
                <div className="flex flex-row items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-left">Includes propeller</span>
                </div>
              )}
              {isTiller && isInStock && (
                <div className="flex flex-row items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-left">Same-day pickup available</span>
                </div>
              )}
            </div>
            
            <Button 
              variant="outline"
              className="w-full border-2 border-foreground text-foreground py-6 text-xs tracking-widest uppercase font-light rounded-sm hover:bg-foreground hover:text-background transition-all duration-500 premium-btn-hover"
            >
              Select Loose Motor
            </Button>
          </CardContent>
        </Card>
        </motion.div>
        
        <motion.div variants={cardVariants}>
          <Card className="relative bg-white hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-primary/50 flex flex-col premium-lift" 
                onClick={handleInstalledSelect}>
          <Badge className="absolute -top-2 -right-2 bg-foreground hover:bg-foreground text-background text-[10px] tracking-[0.15em] uppercase font-light premium-pulse">
            Full Service
          </Badge>
          
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-3">
              <Wrench className="w-8 h-8 text-primary" />
              <CardTitle className="text-2xl font-light tracking-wide text-foreground">Professional Installation</CardTitle>
            </div>
            <p className="text-sm font-light text-muted-foreground">
              {isTiller ? 'Complete motor prep & water test' : 'Complete rigging & water test'}
            </p>
          </CardHeader>
          
          <CardContent className="flex flex-col flex-1 pt-0">
            <div className="space-y-3 text-base font-light text-muted-foreground flex-1 mb-6">
              {!isTiller && (
                <div className="flex flex-row items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-left">Controls & gauges configured</span>
                </div>
              )}
              {isTiller && (
                <div className="flex flex-row items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-left">Securely bolted to transom (if requested)</span>
                </div>
              )}
              <div className="flex flex-row items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-left">Marine battery included ($180)</span>
              </div>
              <div className="flex flex-row items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-left">Old motor removal available</span>
              </div>
              <div className="flex flex-row items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-left">Water tested & prop optimized</span>
              </div>
            </div>
            
            <Button 
              variant="outline"
              className="w-full border-2 border-foreground text-foreground py-6 text-xs tracking-widest uppercase font-light rounded-sm hover:bg-foreground hover:text-background transition-all duration-500 premium-btn-hover"
            >
              Select Installation
            </Button>
          </CardContent>
        </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
