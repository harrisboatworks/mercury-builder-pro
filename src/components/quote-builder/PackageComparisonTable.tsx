import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Check, Minus } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface PackageComparisonTableProps {
  selectedId?: string | null;
  onSelectPackage?: (packageId: string) => void;
  currentCoverageYears: number;
  isManualStart?: boolean;
  includesProp?: boolean;
  canAddFuelTank?: boolean;
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
  { label: 'FREE Mercury Hat', good: false, better: true, best: true },
  { label: 'FREE Mercury Shirt', good: false, better: false, best: true },
];

const PACKAGE_LABELS = {
  good: 'Essential',
  better: 'Complete',
  best: 'Premium'
};

const PACKAGE_LABELS_SHORT = {
  good: 'Ess.',
  better: 'Comp.',
  best: 'Prem.'
};

export function PackageComparisonTable({
  selectedId,
  onSelectPackage,
  currentCoverageYears,
  isManualStart,
  includesProp,
  canAddFuelTank
}: PackageComparisonTableProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { triggerHaptic } = useHapticFeedback();

  // Handle quick select from column header
  const handleColumnSelect = (packageId: string) => {
    triggerHaptic('packageChanged');
    onSelectPackage?.(packageId);
  };

  // Filter features based on conditions
  const filteredFeatures = COMPARISON_FEATURES.filter(feature => {
    if (feature.conditional === 'isManualStart') return !isManualStart;
    if (feature.conditional === 'includesProp') return !includesProp;
    if (feature.conditional === 'canAddFuelTank') return canAddFuelTank;
    return true;
  });

  // Handle scroll to hide swipe hint
  const handleScroll = () => {
    if (!hasScrolled) {
      setHasScrolled(true);
      setShowSwipeHint(false);
    }
  };

  // Reset hint when table opens
  useEffect(() => {
    if (isOpen) {
      setShowSwipeHint(true);
      setHasScrolled(false);
    }
  }, [isOpen]);

  const renderCheckmark = (hasFeature: boolean, packageId: string) => (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
      className={cn(
        "flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0",
        hasFeature 
          ? "bg-emerald-100 text-emerald-600" 
          : "bg-muted text-muted-foreground/40"
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
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-colors group"
        >
          <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
            Compare all features
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
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
              <div className="mt-4 bg-white rounded-xl border shadow-lg overflow-hidden">
                {/* Scrollable Table Container */}
                <div className="relative">
                  <div 
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="overflow-x-auto scrollbar-hide touch-pan-x scroll-smooth"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                  >
                    <table className="w-full min-w-[420px]">
                      {/* Header */}
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="sticky left-0 z-10 bg-muted/50 p-3 text-left text-sm font-medium text-muted-foreground min-w-[130px] shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
                            Features
                          </th>
                          {(['good', 'better', 'best'] as const).map((pkg) => (
                            <th 
                              key={pkg}
                              onClick={() => handleColumnSelect(pkg)}
                              className={cn(
                                "p-3 text-center text-sm font-semibold transition-all min-w-[80px] cursor-pointer relative",
                                "hover:bg-primary/20 active:scale-95",
                                selectedId && selectedId === pkg 
                                  ? "bg-primary/10 text-primary" 
                                  : "text-foreground hover:text-primary"
                              )}
                            >
                              {/* Selected column top indicator */}
                              {selectedId && selectedId === pkg && (
                                <motion.div
                                  layoutId="column-header-highlight"
                                  className="absolute inset-x-0 top-0 h-1 bg-primary rounded-t"
                                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                              )}
                              <span className="hidden sm:inline">{PACKAGE_LABELS[pkg]}</span>
                              <span className="sm:hidden">{PACKAGE_LABELS_SHORT[pkg]}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>

                      {/* Feature Rows */}
                      <tbody className="divide-y divide-border">
                        {filteredFeatures.map((feature, idx) => (
                          <motion.tr
                            key={feature.label}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className={idx % 2 === 0 ? "bg-muted/30" : "bg-white"}
                          >
                            <td className={cn(
                              "sticky left-0 z-10 p-3 text-sm text-foreground min-w-[130px] shadow-[2px_0_4px_rgba(0,0,0,0.05)]",
                              idx % 2 === 0 ? "bg-muted/30" : "bg-white"
                            )}>
                              {feature.label}
                            </td>
                            {(['good', 'better', 'best'] as const).map((pkg) => (
                              <td 
                                key={pkg}
                                onClick={() => handleColumnSelect(pkg)}
                                className={cn(
                                  "p-3 relative cursor-pointer transition-colors",
                                  "hover:bg-primary/10",
                                  selectedId && selectedId === pkg && "bg-primary/5"
                                )}
                              >
                                {/* Selected column highlight bar */}
                                {selectedId && selectedId === pkg && (
                                  <motion.div
                                    layoutId={`column-cell-highlight-${idx}`}
                                    className="absolute inset-y-0 left-0 w-0.5 bg-primary"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                  />
                                )}
                                <div className="flex justify-center">
                                  {renderCheckmark(feature[pkg], pkg)}
                                </div>
                              </td>
                            ))}
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Swipe hint overlay - mobile only */}
                  <AnimatePresence>
                    {showSwipeHint && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ 
                          opacity: 1,
                          x: [0, 8, 0, 8, 0]
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ 
                          opacity: { duration: 0.3 },
                          x: { 
                            duration: 1.5, 
                            ease: "easeInOut",
                            times: [0, 0.25, 0.5, 0.75, 1]
                          }
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground bg-white/95 px-2.5 py-1.5 rounded-full shadow-md border border-border/50 md:hidden pointer-events-none"
                      >
                        <span>Swipe</span>
                        <ChevronRight className="w-3 h-3" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Scroll fade indicator - mobile only */}
                  <div 
                    className={cn(
                      "absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent pointer-events-none transition-opacity duration-300 md:hidden",
                      hasScrolled && "opacity-40"
                    )} 
                  />
                </div>

                {/* Warranty Timeline */}
                <div className="p-4 border-t border-border bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-3 text-center font-medium uppercase tracking-wider">
                    Warranty Timeline
                  </p>
                  <div className="relative h-8 bg-muted rounded-full overflow-hidden">
                    {/* Base coverage (Essential) */}
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(currentCoverageYears / 8) * 100}%` }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      className="absolute left-0 top-0 h-full bg-slate-400 rounded-l-full"
                    />
                    
                    {/* Complete extension */}
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((7 - currentCoverageYears) / 8) * 100}%` }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                      className="absolute top-0 h-full bg-primary"
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
                        <div className="w-1 h-4 bg-white/50 rounded-full" />
                      </div>
                    ))}
                  </div>
                  
                  {/* Legend */}
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-slate-400" />
                      <span className="text-muted-foreground">Essential ({currentCoverageYears}yr)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <span className="text-muted-foreground">Complete (7yr)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="text-muted-foreground">Premium (8yr)</span>
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
