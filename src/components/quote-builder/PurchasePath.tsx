// src/components/quote-builder/PurchasePath.tsx
import { motion } from "framer-motion";
import { Package, Wrench, Sparkles, Battery, Info } from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface PurchasePathProps {
  selectedMotor: any;
  onSelectPath: (path: 'loose' | 'installed', options?: { battery?: boolean }) => void;
}

export default function PurchasePath({ selectedMotor, onSelectPath }: PurchasePathProps) {
  const [needsBattery, setNeedsBattery] = useState(false);
  
  const model = (selectedMotor?.model || '').toUpperCase();
  const hp = typeof selectedMotor?.hp === 'string' ? parseInt(selectedMotor.hp, 10) : selectedMotor?.hp;
  const isTiller = model.includes('TILLER') || (hp && hp <= 30 && (/\bH\b/.test(model) || model.includes('MH')));
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
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#2A4D69] mb-2">
          Great Choice! {selectedMotor?.model}
        </h2>
        <p className="text-gray-600">How would you like to purchase this motor?</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        <motion.button
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLooseMotorSelect}
          className="relative p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors border-2 border-gray-200 hover:border-blue-500 hover:shadow-2xl text-left group"
        >
          <div className="absolute -top-3 -right-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            Quick & Easy
          </div>
          
          <Package className="w-16 h-16 mb-4 text-blue-600 group-hover:scale-110 transition-transform" />
          <h3 className="text-2xl font-bold mb-2">Loose Motor</h3>
          <p className="text-gray-600 mb-4">
            In-store pickup only • No installation
          </p>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</div>
              <span>Free Prep</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</div>
              <span>Shop Tank Tested</span>
            </div>
            {isTiller ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</div>
                <span>Includes propeller & internal fuel tank</span>
              </div>
            ) : includes12LTank ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</div>
                <span>Includes 12L fuel tank & hose</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</div>
                <span>Ready for rigging & accessories</span>
              </div>
            )}
            {isTiller && isInStock && (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</div>
                <span>Same-day pickup available</span>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex items-center gap-2 text-yellow-600">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-bold">Earn 30 XP</span>
          </div>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleInstalledSelect}
          className="relative p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors border-2 border-gray-200 hover:border-blue-500 hover:shadow-2xl text-left group"
        >
          <div className="absolute -top-3 -right-3 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
            Full Service
          </div>
          
          <Wrench className="w-16 h-16 mb-4 text-blue-600 group-hover:scale-110 transition-transform" />
          <h3 className="text-2xl font-bold mb-2">Professional Installation</h3>
          <p className="text-gray-600 mb-4">
            {isTiller ? 'Complete motor prep & water test' : 'Complete rigging & water test'}
          </p>
          
          <div className="space-y-2 text-sm">
            {!isTiller && (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</div>
                <span>Controls & gauges configured</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</div>
              <span>Old motor removal available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</div>
              <span>Water tested & prop optimized</span>
            </div>
          </div>
          
          <div className="mt-4 flex items-center gap-2 text-yellow-600">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-bold">Earn 50 XP</span>
          </div>
        </motion.button>
      </div>
      
      {isElectricStart && (
        <TooltipProvider>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-2xl mx-auto mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-200"
          >
            <div className="flex items-start gap-4">
              <Battery className="w-8 h-8 text-blue-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-blue-900 mb-2">Battery Required</h4>
                <p className="text-blue-700 text-sm mb-4">
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
                        <span className="font-medium text-blue-900">Add Deka Marine Master Battery</span>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">$179.99</Badge>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-blue-600 cursor-help" />
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
                      <p className="text-sm text-blue-600">
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
                  className="w-24 h-24 object-contain rounded-lg"
                  loading="lazy"
                />
              </div>
            </div>
          </motion.div>
        </TooltipProvider>
      )}
    </motion.div>
  );
}
