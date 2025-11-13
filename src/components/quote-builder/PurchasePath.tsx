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
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-light tracking-wide text-gray-900 mb-3">
          Great Choice! {selectedMotor?.model}
        </h2>
        <p className="text-gray-500 font-light">How would you like to purchase this motor?</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto items-stretch">
        <motion.div variants={cardVariants}>
          <Card className="relative hover:shadow-lg transition-all duration-200 cursor-pointer group border-2 hover:border-primary/50 flex flex-col" 
                onClick={handleLooseMotorSelect}>
          <Badge className="absolute -top-2 -right-2 bg-gray-900 hover:bg-gray-900 text-white text-[10px] tracking-[0.15em] uppercase font-light">
            Quick & Easy
          </Badge>
          
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-3">
              <Package className="w-8 h-8 text-primary" />
              <CardTitle className="text-2xl font-light tracking-wide text-gray-900">Loose Motor</CardTitle>
            </div>
            <p className="text-sm font-light text-gray-500">
              In-store pickup only • No installation
            </p>
          </CardHeader>
          
          <CardContent className="flex flex-col flex-1 pt-0">
            <div className="flex flex-col gap-3 text-base font-light text-gray-600 flex-1 space-y-2 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-sm">✓</span>
                <span>Free Prep</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-sm">✓</span>
                <span>Shop Tank Tested</span>
              </div>
              {isTiller ? (
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-sm">✓</span>
                  <span>Includes propeller & internal fuel tank</span>
                </div>
              ) : includes12LTank ? (
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-sm">✓</span>
                  <span>Includes 12L fuel tank & hose</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-sm">✓</span>
                  <span>Ready for rigging & accessories</span>
                </div>
              )}
              {isTiller && isInStock && (
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-sm">✓</span>
                  <span>Same-day pickup available</span>
                </div>
              )}
            </div>
            
            <Button 
              variant="outline"
              className="w-full border-2 border-gray-900 text-gray-900 py-6 text-xs tracking-widest uppercase font-light rounded-sm hover:bg-gray-900 hover:text-white transition-all duration-500"
            >
              Select Loose Motor
            </Button>
          </CardContent>
        </Card>
        </motion.div>
        
        <motion.div variants={cardVariants}>
          <Card className="relative hover:shadow-lg transition-all duration-200 cursor-pointer group border-2 hover:border-primary/50 flex flex-col" 
                onClick={handleInstalledSelect}>
          <Badge className="absolute -top-2 -right-2 bg-black hover:bg-black text-white text-[10px] tracking-[0.15em] uppercase font-light">
            Full Service
          </Badge>
          
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-3">
              <Wrench className="w-8 h-8 text-primary" />
              <CardTitle className="text-2xl font-light tracking-wide text-gray-900">Professional Installation</CardTitle>
            </div>
            <p className="text-sm font-light text-gray-500">
              {isTiller ? 'Complete motor prep & water test' : 'Complete rigging & water test'}
            </p>
          </CardHeader>
          
          <CardContent className="flex flex-col flex-1 pt-0">
            <div className="flex flex-col gap-3 text-base font-light text-gray-600 flex-1 space-y-2 mb-6">
              {!isTiller && (
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-sm">✓</span>
                  <span>Controls & gauges configured</span>
                </div>
              )}
              {isTiller && (
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-sm">✓</span>
                  <span>Securely bolted to transom (if requested)</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-sm">✓</span>
                <span>Marine battery included ($180)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-sm">✓</span>
                <span>Old motor removal available</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-sm">✓</span>
                <span>Water tested & prop optimized</span>
              </div>
            </div>
            
            <Button 
              variant="outline"
              className="w-full border-2 border-gray-900 text-gray-900 py-6 text-xs tracking-widest uppercase font-light rounded-sm hover:bg-gray-900 hover:text-white transition-all duration-500"
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
