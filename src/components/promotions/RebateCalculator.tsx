import { useState, useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { getRebateTierForHP, type RebateTier } from '@/lib/promotion-discounts';

// Actual Mercury FourStroke HP steps. The slider snaps to these so the
// calculator can never land on a non-existent HP (which would show $0).
const MERCURY_HP_STEPS: number[] = [
  2.5, 3.5, 4, 5, 6, 8, 9.9, 15, 20, 25, 30, 40, 50, 60, 75, 90, 115, 150, 175,
  200, 225, 250, 300, 350, 400, 425,
];

type RebateRow = RebateTier;

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
  const [requestedHP, setSelectedHP] = useState(initialHP);
  const eligibleSteps = useMemo(() => MERCURY_HP_STEPS.filter(
    hp => Boolean(getRebateTierForHP(matrix, hp))
  ), [matrix]);
  const selectedHP = eligibleSteps.includes(requestedHP)
    ? requestedHP
    : (eligibleSteps[0] ?? 0);
  const selectedIndex = Math.max(0, eligibleSteps.indexOf(selectedHP));
  const minHP = eligibleSteps[0];
  const maxHP = eligibleSteps[eligibleSteps.length - 1];
  const currentTier = getRebateTierForHP(matrix, selectedHP);
  const currentRebate = currentTier?.rebate ?? 0;

  const handleSliderChange = (value: number[]) => {
    const newHP = eligibleSteps[value[0]];
    if (newHP === undefined) return;
    setSelectedHP(newHP);
    onHPChange?.(newHP);
  };

  if (!eligibleSteps.length) return null;

  const formatHPRange = (row: RebateRow) => {
    if (row.hp_min === row.hp_max) {
      return `${row.hp_min}HP`;
    }
    return `${row.hp_min}–${row.hp_max}HP`;
  };

  return (
    <div
      className={cn(
        'rounded-[12px] border border-repower-navy-900/10 bg-repower-cream p-5 sm:p-8',
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
              data-testid="rebate-anchor"
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
              Selected: {selectedHP}HP
            </span>
            <span
              className="text-[12px] text-repower-navy-900"
              style={{ color: 'hsl(var(--repower-navy-900) / 0.6)' }}
            >
              {maxHP}HP
            </span>
          </div>

          <Slider
            value={[selectedIndex]}
            thumbProps={{ "aria-label": "Engine horsepower", "aria-valuetext": `${selectedHP} horsepower` }}
            disabled={eligibleSteps.length < 2}
            onValueChange={handleSliderChange}
            min={0}
            max={Math.max(1, eligibleSteps.length - 1)}
            step={1}
            className="w-full py-2 [&>span:first-child]:bg-repower-navy-900/20 [&>span:first-child>span]:bg-repower-mercury-red"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {matrix.map((row, index) => {
              const isActive = currentTier === row;
              return (
                <button
                  key={index}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => {
                    const midHP = eligibleSteps.find(hp => hp >= row.hp_min && hp <= row.hp_max);
                    if (midHP === undefined) return;
                    setSelectedHP(midHP);
                    onHPChange?.(midHP);
                  }}
                  className={cn(
                    'flex flex-row items-center justify-between gap-2 px-3 py-2 rounded-[10px] bg-white border text-[13px] transition-all',
                    isActive
                      ? 'border-repower-navy-900 ring-1 ring-repower-navy-900'
                      : 'border-repower-navy-900/10 hover:border-repower-navy-900/30'
                  )}
                >
                  <span className="flex flex-row items-center gap-2 font-medium text-repower-navy-900">
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
          Eligible rebates are included in your quote by horsepower, subject to dealer verification. Qualifying promo financing can be added (OAC).
        </p>
      </div>
    </div>
  );
}
