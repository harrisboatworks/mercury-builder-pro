import { useState, useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface RebateRow {
  hp_min: number;
  hp_max: number;
  rebate: number;
}

interface RebateCalculatorProps {
  matrix: RebateRow[];
  initialHP?: number;
  onHPChange?: (hp: number) => void;
  className?: string;
}

export function RebateCalculator({ 
  matrix, 
  initialHP = 115, 
  onHPChange,
  className 
}: RebateCalculatorProps) {
  const [selectedHP, setSelectedHP] = useState(initialHP);

  // Calculate min/max HP from matrix
  const { minHP, maxHP } = useMemo(() => {
    if (!matrix.length) return { minHP: 2.5, maxHP: 425 };
    const min = Math.min(...matrix.map(r => r.hp_min));
    const max = Math.max(...matrix.map(r => r.hp_max));
    return { minHP: min, maxHP: max };
  }, [matrix]);

  // Find the rebate for selected HP
  const currentRebate = useMemo(() => {
    const match = matrix.find(row => selectedHP >= row.hp_min && selectedHP <= row.hp_max);
    return match ? match.rebate : 0;
  }, [matrix, selectedHP]);

  // Find the current tier
  const currentTier = useMemo(() => {
    return matrix.find(row => selectedHP >= row.hp_min && selectedHP <= row.hp_max);
  }, [matrix, selectedHP]);

  const handleSliderChange = (value: number[]) => {
    const newHP = value[0];
    setSelectedHP(newHP);
    onHPChange?.(newHP);
  };

  const formatHPRange = (row: RebateRow) => {
    if (row.hp_min === row.hp_max) {
      return `${row.hp_min}HP`;
    }
    return `${row.hp_min}–${row.hp_max}HP`;
  };

  return (
    <Card className={cn('p-6 bg-gradient-to-br from-white to-stone-50 border-border', className)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Factory Rebate Calculator</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Slide to see your rebate based on motor horsepower
          </p>
        </div>

        {/* HP Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{minHP}HP</span>
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold text-foreground">{selectedHP}HP</span>
            </div>
            <span className="text-sm text-muted-foreground">{maxHP}HP</span>
          </div>
          
          <Slider
            value={[selectedHP]}
            onValueChange={handleSliderChange}
            min={minHP}
            max={maxHP}
            step={5}
            className="w-full"
          />
        </div>

        {/* Rebate Result */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentRebate}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 text-center"
          >
            <div className="text-sm text-green-700 font-medium mb-1">
              Your Factory Rebate
            </div>
            <div className="text-4xl font-bold text-green-600">
              ${currentRebate.toLocaleString()}
            </div>
            {currentTier && (
              <Badge variant="secondary" className="mt-3 bg-green-100 text-green-700 border-green-200">
                {formatHPRange(currentTier)} tier
              </Badge>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Quick Reference Tiers */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            All Rebate Tiers
          </div>
          <div className="grid grid-cols-2 gap-2">
            {matrix.map((row, index) => {
              const isActive = selectedHP >= row.hp_min && selectedHP <= row.hp_max;
              return (
                <button
                  key={index}
                  onClick={() => {
                    // Set to middle of range
                    const midHP = Math.round((row.hp_min + row.hp_max) / 2);
                    setSelectedHP(midHP);
                    onHPChange?.(midHP);
                  }}
                  className={cn(
                    'flex justify-between items-center px-3 py-2 rounded-lg text-sm transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold ring-2 ring-primary ring-offset-2'
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                  )}
                >
                  <span>{formatHPRange(row)}</span>
                  <span className="font-semibold">${row.rebate}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <p className="text-xs text-center text-muted-foreground">
          Rebates applied at checkout when you choose the Cash Rebate option
        </p>
      </div>
    </Card>
  );
}
