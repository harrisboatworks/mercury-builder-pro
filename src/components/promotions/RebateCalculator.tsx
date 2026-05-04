import { useState, useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
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
  className,
}: RebateCalculatorProps) {
  const [selectedHP, setSelectedHP] = useState(initialHP);

  const { minHP, maxHP } = useMemo(() => {
    if (!matrix.length) return { minHP: 2.5, maxHP: 425 };
    const min = Math.min(...matrix.map(r => r.hp_min));
    const max = Math.max(...matrix.map(r => r.hp_max));
    return { minHP: min, maxHP: max };
  }, [matrix]);

  const currentRebate = useMemo(() => {
    const match = matrix.find(row => selectedHP >= row.hp_min && selectedHP <= row.hp_max);
    return match ? match.rebate : 0;
  }, [matrix, selectedHP]);

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
    <div
      className={cn(
        'rounded-[12px] border border-repower-navy-900/10 bg-repower-cream p-8',
        className
      )}
    >
      <div className="space-y-7">
        {/* Eyebrow + Anchor */}
        <div className="space-y-2">
          <div
            className="text-[12px] font-semibold uppercase text-repower-mercury-red"
            style={{ letterSpacing: '0.14em' }}
          >
            Your Rebate
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentRebate}
              initial={{ y: 6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -6, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="font-display font-bold text-[36px] leading-none text-repower-navy-900"
              style={{ letterSpacing: '-0.02em' }}
            >
              ${currentRebate.toLocaleString()}
            </motion.div>
          </AnimatePresence>
          {currentTier && (
            <div
              className="font-display font-semibold text-[14px] text-repower-navy-900"
              style={{ color: 'hsl(var(--repower-navy-900) / 0.7)' }}
            >
              {formatHPRange(currentTier)} tier
            </div>
          )}
        </div>

        {/* Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span
              className="text-[12px] text-repower-navy-900"
              style={{ color: 'hsl(var(--repower-navy-900) / 0.6)' }}
            >
              {minHP}HP
            </span>
            <span className="font-display font-semibold text-[16px] text-repower-navy-900">
              {selectedHP}HP
            </span>
            <span
              className="text-[12px] text-repower-navy-900"
              style={{ color: 'hsl(var(--repower-navy-900) / 0.6)' }}
            >
              {maxHP}HP
            </span>
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

        {/* Tier Pills */}
        <div className="space-y-2">
          <div
            className="text-[11px] font-semibold uppercase text-repower-navy-900"
            style={{ letterSpacing: '0.14em', color: 'hsl(var(--repower-navy-900) / 0.55)' }}
          >
            All Rebate Tiers
          </div>
          <div className="grid grid-cols-2 gap-2">
            {matrix.map((row, index) => {
              const isActive = selectedHP >= row.hp_min && selectedHP <= row.hp_max;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    const midHP = Math.round((row.hp_min + row.hp_max) / 2);
                    setSelectedHP(midHP);
                    onHPChange?.(midHP);
                  }}
                  className={cn(
                    'flex items-center justify-between gap-2 px-3 py-2 rounded-[10px] bg-white border text-[13px] transition-all',
                    isActive
                      ? 'border-repower-navy-900 ring-1 ring-repower-navy-900'
                      : 'border-repower-navy-900/10 hover:border-repower-navy-900/30'
                  )}
                >
                  <span className="flex items-center gap-2 font-medium text-repower-navy-900">
                    <span
                      className={cn(
                        'inline-block w-1.5 h-1.5 rounded-full',
                        isActive ? 'bg-repower-mercury-red' : 'bg-transparent'
                      )}
                      aria-hidden="true"
                    />
                    {formatHPRange(row)}
                  </span>
                  <span className="font-display font-bold text-repower-mercury-red">
                    ${row.rebate}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footnote */}
        <p
          className="text-[12px] text-repower-navy-900"
          style={{ color: 'hsl(var(--repower-navy-900) / 0.6)' }}
        >
          Rebates applied at checkout when you choose the Cash Rebate option
        </p>
      </div>
    </div>
  );
}
