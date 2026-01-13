import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Minus } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface PackageComparisonTableProps {
  selectedId: string;
  currentCoverageYears: number;
  isManualStart: boolean;
  includesProp: boolean;
  canAddFuelTank: boolean;
}

interface ComparisonFeature {
  label: string;
  good: boolean;
  better: boolean;
  best: boolean;
  conditional?: 'isManualStart' | 'includesProp' | 'canAddFuelTank';
}

const COMPARISON_FEATURES: ComparisonFeature[] = [
  { label: 'Mercury outboard motor', good: true, better: true, best: true },
  { label: 'Standard controls & rigging', good: true, better: true, best: true },
  { label: 'Professional installation', good: true, better: true, best: true },
  { label: 'Marine starting battery', good: false, better: true, best: true, conditional: 'isManualStart' },
  { label: '7 years total warranty', good: false, better: true, best: true },
  { label: '8 years total warranty', good: false, better: false, best: true },
  { label: 'Premium aluminum propeller', good: false, better: false, best: true, conditional: 'includesProp' },
  { label: 'External fuel tank & hose', good: false, better: false, best: true, conditional: 'canAddFuelTank' },
  { label: 'Priority scheduling', good: false, better: true, best: true },
  { label: 'White-glove installation', good: false, better: false, best: true },
];

const PACKAGE_LABELS = {
  good: 'Essential',
  better: 'Complete',
  best: 'Premium'
};

export function PackageComparisonTable({
  selectedId,
  currentCoverageYears,
  isManualStart,
  includesProp,
  canAddFuelTank
}: PackageComparisonTableProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Filter features based on conditions
  const filteredFeatures = COMPARISON_FEATURES.filter(feature => {
    if (feature.conditional === 'isManualStart') return !isManualStart;
    if (feature.conditional === 'includesProp') return !includesProp;
    if (feature.conditional === 'canAddFuelTank') return canAddFuelTank;
    return true;
  });

  const renderCheckmark = (hasFeature: boolean, packageId: string) => (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
      className={cn(
        "flex items-center justify-center w-6 h-6 rounded-full",
        hasFeature 
          ? "bg-emerald-500/20 text-emerald-400" 
          : "bg-stone-700/50 text-stone-600"
      )}
    >
      {hasFeature ? (
        <Check className="w-3.5 h-3.5" />
      ) : (
        <Minus className="w-3 h-3" />
      )}
    </motion.div>
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-stone-800/30 border border-stone-700/50 hover:bg-stone-800/50 transition-colors group"
        >
          <span className="text-sm font-medium text-stone-300 group-hover:text-white transition-colors">
            Compare all features
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-stone-400 group-hover:text-white transition-colors" />
          </motion.div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="mt-4 bg-stone-800/30 border border-stone-700/50 rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-4 bg-stone-700/50">
                  <div className="p-3 text-sm font-medium text-stone-400">
                    Features
                  </div>
                  {(['good', 'better', 'best'] as const).map((pkg) => (
                    <div 
                      key={pkg}
                      className={cn(
                        "p-3 text-center text-sm font-semibold transition-colors",
                        selectedId === pkg 
                          ? "bg-primary/20 text-primary" 
                          : "text-stone-300"
                      )}
                    >
                      {PACKAGE_LABELS[pkg]}
                    </div>
                  ))}
                </div>

                {/* Feature Rows */}
                <div className="divide-y divide-stone-700/30">
                  {filteredFeatures.map((feature, idx) => (
                    <motion.div
                      key={feature.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className={cn(
                        "grid grid-cols-4 items-center",
                        idx % 2 === 0 ? "bg-stone-800/20" : "bg-transparent"
                      )}
                    >
                      <div className="p-3 text-sm text-stone-300">
                        {feature.label}
                      </div>
                      {(['good', 'better', 'best'] as const).map((pkg) => (
                        <div 
                          key={pkg}
                          className={cn(
                            "p-3 flex justify-center",
                            selectedId === pkg && "bg-primary/5"
                          )}
                        >
                          {renderCheckmark(feature[pkg], pkg)}
                        </div>
                      ))}
                    </motion.div>
                  ))}
                </div>

                {/* Warranty Timeline */}
                <div className="p-4 border-t border-stone-700/50 bg-stone-800/40">
                  <p className="text-xs text-stone-400 mb-3 text-center font-medium uppercase tracking-wider">
                    Warranty Timeline
                  </p>
                  <div className="relative h-8 bg-stone-700/50 rounded-full overflow-hidden">
                    {/* Base coverage (Essential) */}
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(currentCoverageYears / 8) * 100}%` }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      className="absolute left-0 top-0 h-full bg-stone-500 rounded-l-full"
                    />
                    
                    {/* Complete extension */}
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((7 - currentCoverageYears) / 8) * 100}%` }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                      className="absolute top-0 h-full bg-blue-500"
                      style={{ left: `${(currentCoverageYears / 8) * 100}%` }}
                    />
                    
                    {/* Premium extension */}
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(1 / 8) * 100}%` }}
                      transition={{ delay: 0.6, duration: 0.5 }}
                      className="absolute top-0 h-full bg-amber-500 rounded-r-full"
                      style={{ left: `${(7 / 8) * 100}%` }}
                    />

                    {/* Year markers */}
                    {[0, 3, 5, 7, 8].map((year) => (
                      <div
                        key={year}
                        className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
                        style={{ left: `${(year / 8) * 100}%`, transform: `translateX(-50%) translateY(-50%)` }}
                      >
                        <div className="w-1 h-4 bg-white/30 rounded-full" />
                      </div>
                    ))}
                  </div>
                  
                  {/* Legend */}
                  <div className="flex items-center justify-center gap-6 mt-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-stone-500" />
                      <span className="text-stone-400">Essential ({currentCoverageYears}yr)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-stone-400">Complete (7yr)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="text-stone-400">Premium (8yr)</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CollapsibleContent>
    </Collapsible>
  );
}
