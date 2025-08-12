// src/components/quote-builder/PurchasePath.tsx
import { motion } from "framer-motion";
import { Package, Wrench, Sparkles } from "lucide-react";

interface PurchasePathProps {
  selectedMotor: any;
  onSelectPath: (path: 'loose' | 'installed') => void;
}

export default function PurchasePath({ selectedMotor, onSelectPath }: PurchasePathProps) {
  const model = (selectedMotor?.model || '').toUpperCase();
  const hp = typeof selectedMotor?.hp === 'string' ? parseInt(selectedMotor.hp, 10) : selectedMotor?.hp;
  const isTiller = (hp ?? 0) <= 30 && (/\bH\b/.test(model) || model.includes('TILLER'));
  const isInStock = selectedMotor?.stockStatus === 'In Stock';
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[#2A4D69] mb-2">
          Great Choice! {selectedMotor?.model}
        </h2>
        <p className="text-gray-600">How would you like to purchase this motor?</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        <motion.button
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectPath('loose')}
          className="relative p-8 border-2 border-gray-200 rounded-3xl hover:border-blue-500 hover:shadow-2xl transition-all bg-white text-left group"
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
              <span>Ready to run with PDI</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</div>
              <span>Add fuel tank & accessories</span>
            </div>
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
          onClick={() => onSelectPath('installed')}
          className="relative p-8 border-2 border-gray-200 rounded-3xl hover:border-blue-500 hover:shadow-2xl transition-all bg-white text-left group"
        >
          <div className="absolute -top-3 -right-3 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
            Full Service
          </div>
          
          <Wrench className="w-16 h-16 mb-4 text-blue-600 group-hover:scale-110 transition-transform" />
          <h3 className="text-2xl font-bold mb-2">Professional Installation</h3>
          <p className="text-gray-600 mb-4">
            Complete rigging & water test
          </p>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</div>
              <span>Controls & gauges configured</span>
            </div>
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
    </motion.div>
  );
}
