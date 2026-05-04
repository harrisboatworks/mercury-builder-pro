import { useState, useMemo } from 'react';
// icons removed: design uses typography + hairlines, no icon chrome
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Fallback motor pricing (CAD selling price; used only while live query loads)
// Sourced from current motor_models table (sale_price → dealer_price → msrp → base_price)
const fallbackMotorPrices: Record<number, { min: number; max: number; avg: number }> = {
  40: { min: 9460, max: 10054, avg: 9682 },
  60: { min: 12161, max: 13189, avg: 12692 },
  75: { min: 14190, max: 14190, avg: 14190 },
  90: { min: 14812, max: 15323, avg: 15068 },
  115: { min: 17320, max: 17716, avg: 17556 },
  150: { min: 22022, max: 24233, avg: 23085 },
};

const riggingCosts: Record<string, { min: number; max: number; avg: number; label: string }> = {
  keep: { min: 0, max: 300, avg: 150, label: 'Keep Existing Controls' },
  upgrade: { min: 800, max: 1400, avg: 1100, label: 'Upgrade Controls' },
  replace: { min: 1800, max: 2600, avg: 2200, label: 'Full Controls Replacement' },
};

// Flat installation + propeller fee
const installationCosts: Record<number, number> = {
  40: 900,
  60: 900,
  75: 900,
  90: 900,
  115: 900,
  150: 900,
};

const presetScenarios = [
  { name: '16ft Fishing Boat', hp: 60, newBoatValue: 35000, rigging: 'upgrade' },
  { name: '18ft Pontoon', hp: 90, newBoatValue: 45000, rigging: 'upgrade' },
  { name: '17ft Bass Boat', hp: 115, newBoatValue: 55000, rigging: 'replace' },
  { name: '14ft Aluminum', hp: 40, newBoatValue: 25000, rigging: 'keep' },
];

const hpOptions = [40, 60, 75, 90, 115, 150];

export function RepowerROICalculator() {
  const [selectedHPs, setSelectedHPs] = useState<number[]>([90]);
  const [riggingCondition, setRiggingCondition] = useState('upgrade');
  const [newBoatValue, setNewBoatValue] = useState(45000);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Fetch live motor prices from database
  const { data: liveMotorPrices } = useQuery({
    queryKey: ['motor-price-ranges-repower'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('motor_models')
        .select('horsepower, base_price, dealer_price, sale_price, msrp')
        .in('horsepower', hpOptions);

      if (error) throw error;

      // Group by HP using selling-price hierarchy: sale_price → dealer_price → msrp → base_price
      const grouped: Record<number, number[]> = {};
      data?.forEach((motor: any) => {
        const hp = motor.horsepower;
        const price = motor.sale_price ?? motor.dealer_price ?? motor.msrp ?? motor.base_price;
        if (hp && hpOptions.includes(hp) && price && price > 0) {
          if (!grouped[hp]) grouped[hp] = [];
          grouped[hp].push(Number(price));
        }
      });

      const result: Record<number, { min: number; max: number; avg: number }> = {};
      Object.entries(grouped).forEach(([hp, prices]) => {
        const hpNum = Number(hp);
        result[hpNum] = {
          min: Math.min(...prices),
          max: Math.max(...prices),
          avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
        };
      });

      return result;
    },
    staleTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
  });

  // Use live prices if available, fallback to hardcoded
  const motorPriceRanges = liveMotorPrices && Object.keys(liveMotorPrices).length > 0 
    ? { ...fallbackMotorPrices, ...liveMotorPrices }
    : fallbackMotorPrices;

  const toggleHP = (hp: number) => {
    if (selectedHPs.includes(hp)) {
      if (selectedHPs.length > 1) {
        setSelectedHPs(selectedHPs.filter(h => h !== hp));
      }
    } else if (selectedHPs.length < 3) {
      setSelectedHPs([...selectedHPs, hp].sort((a, b) => a - b));
    }
    setActivePreset(null);
  };

  const applyPreset = (preset: typeof presetScenarios[0]) => {
    setSelectedHPs([preset.hp]);
    setRiggingCondition(preset.rigging);
    setNewBoatValue(preset.newBoatValue);
    setActivePreset(preset.name);
  };

  const calculations = useMemo(() => {
    return selectedHPs.map(hp => {
      const motorCost = motorPriceRanges[hp]?.avg || 10000;
      const riggingCost = riggingCosts[riggingCondition]?.avg || 2000;
      const installCost = installationCosts[hp] || 1000;
      const totalRepower = motorCost + riggingCost + installCost;
      const savings = newBoatValue - totalRepower;
      const savingsPercent = Math.round((savings / newBoatValue) * 100);
      const costPercent = Math.round((totalRepower / newBoatValue) * 100);

      return {
        hp,
        motorCost,
        riggingCost,
        installCost,
        totalRepower,
        savings,
        savingsPercent,
        costPercent,
      };
    });
  }, [selectedHPs, riggingCondition, newBoatValue]);

  // Find best value (highest savings percentage that's reasonable)
  const bestValue = useMemo(() => {
    if (calculations.length <= 1) return null;
    return calculations.reduce((best, calc) => 
      calc.savingsPercent > best.savingsPercent ? calc : best
    );
  }, [calculations]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-10">
        <p className="font-sans font-semibold text-[11px] md:text-xs uppercase text-repower-mercury-red mb-4 flex items-center gap-3">
          <span className="inline-block h-px w-8 bg-repower-mercury-red/60" />
          Interactive Calculator
        </p>
        <h3 className="font-display font-bold text-repower-navy-900 leading-[1.05] mb-4 text-[clamp(28px,3.5vw,44px)] tracking-[-0.03em]">
          Compare your savings.
        </h3>
        <p className="font-sans text-[16px] md:text-[17px] text-repower-navy-900/65 max-w-[60ch]">
          Select up to 3 horsepower options to see a side by side comparison of repower costs vs. buying new.
        </p>
      </div>

      {/* Preset Scenarios */}
      <div className="mb-8">
        <Label className="font-sans text-xs uppercase tracking-[0.18em] text-repower-navy-900/55 mb-3 block">
          Quick Scenarios
        </Label>
        <div className="flex flex-wrap gap-2">
          {presetScenarios.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className={cn(
                "px-4 py-2 rounded-none text-sm font-medium font-sans transition-colors border",
                activePreset === preset.name
                  ? "bg-repower-navy-900 text-repower-cream border-repower-navy-900"
                  : "bg-transparent text-repower-navy-900 border-repower-navy-900/20 hover:border-repower-navy-900/60"
              )}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-10">
        {/* Configuration Panel */}
        <div className="bg-white border border-repower-navy-900/10 rounded-none p-6 md:p-8 space-y-8">
          <div>
            <Label className="font-sans text-xs uppercase tracking-[0.18em] text-repower-navy-900/55 mb-3 block">
              Horsepower <span className="normal-case tracking-normal text-repower-navy-900/45">(up to 3)</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {hpOptions.map((hp) => (
                <button
                  key={hp}
                  onClick={() => toggleHP(hp)}
                  className={cn(
                    "px-4 py-2 rounded-none text-sm font-medium font-sans transition-colors border",
                    selectedHPs.includes(hp)
                      ? "bg-repower-navy-900 text-repower-cream border-repower-navy-900"
                      : "bg-transparent text-repower-navy-900 border-repower-navy-900/20 hover:border-repower-navy-900/60"
                  )}
                >
                  {hp} HP
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="font-sans text-xs uppercase tracking-[0.18em] text-repower-navy-900/55 mb-3 block">
              Rigging Condition
            </Label>
            <RadioGroup
              value={riggingCondition}
              onValueChange={(value) => {
                setRiggingCondition(value);
                setActivePreset(null);
              }}
              className="space-y-3"
            >
              {Object.entries(riggingCosts).map(([key, value]) => {
                const selected = riggingCondition === key;
                return (
                  <label
                    key={key}
                    htmlFor={key}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-none border cursor-pointer transition-colors",
                      selected
                        ? "border-repower-gold bg-repower-gold/[0.06]"
                        : "border-repower-navy-900/10 bg-white hover:border-repower-navy-900/30"
                    )}
                  >
                    <RadioGroupItem value={key} id={key} />
                    <span className="flex-1 font-sans text-sm text-repower-navy-900">
                      <span className="font-medium">{value.label}</span>
                      <span className="text-repower-navy-900/55 ml-2">
                        ({formatCurrency(value.min)} to {formatCurrency(value.max)})
                      </span>
                    </span>
                  </label>
                );
              })}
            </RadioGroup>
          </div>

          <div>
            <Label className="font-sans text-xs uppercase tracking-[0.18em] text-repower-navy-900/55 mb-3 block">
              Comparable New Boat Value:{' '}
              <span className="normal-case tracking-normal text-repower-navy-900 font-semibold">
                {formatCurrency(newBoatValue)}
              </span>
            </Label>
            <Slider
              value={[newBoatValue]}
              onValueChange={(value) => {
                setNewBoatValue(value[0]);
                setActivePreset(null);
              }}
              min={25000}
              max={100000}
              step={1000}
              className="w-full"
            />
            <div className="flex justify-between font-sans text-xs text-repower-navy-900/55 mt-2">
              <span>$25,000</span>
              <span>$100,000</span>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="bg-repower-cream border border-repower-navy-900/10 rounded-none p-6 md:p-8">
          <p className="font-sans font-semibold text-[11px] md:text-xs uppercase text-repower-mercury-red mb-6 flex items-center gap-3">
            <span className="inline-block h-px w-8 bg-repower-mercury-red/60" />
            Cost Comparison
          </p>

          {/* Comparison Cards */}
          <div className="space-y-4">
            {calculations.map((calc) => {
              const isBest = bestValue?.hp === calc.hp && calculations.length > 1;
              return (
                <div
                  key={calc.hp}
                  className={cn(
                    "rounded-none p-5 border transition-colors bg-white",
                    isBest
                      ? "border-repower-gold"
                      : "border-repower-navy-900/10"
                  )}
                >
                  <div className="flex items-start justify-between mb-4 gap-4">
                    <div className="flex items-center gap-3">
                      <span className="font-sans font-semibold text-xs uppercase tracking-[0.18em] text-repower-navy-900/55">{calc.hp} HP</span>
                      {isBest && (
                        <span className="px-2 py-0.5 font-sans text-[10px] uppercase tracking-[0.18em] text-repower-gold border border-repower-gold/60">
                          Best Value
                        </span>
                      )}
                    </div>
                    <span className="font-display font-bold text-[clamp(28px,3vw,40px)] tracking-[-0.025em] leading-none text-repower-navy-900">
                      {formatCurrency(calc.totalRepower)}
                    </span>
                  </div>

                  {/* Cost Breakdown */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { label: 'Motor', value: calc.motorCost },
                      { label: 'Rigging', value: calc.riggingCost },
                      { label: 'Install', value: calc.installCost },
                    ].map((row) => (
                      <div key={row.label} className="text-center p-3 border border-repower-navy-900/10">
                        <div className="font-sans text-[10px] uppercase tracking-[0.18em] text-repower-navy-900/55 mb-1">
                          {row.label}
                        </div>
                        <div className="font-sans font-semibold text-sm text-repower-navy-900">
                          {formatCurrency(row.value)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Visual Bar */}
                  <div className="relative h-1.5 bg-repower-navy-900/10 overflow-hidden mb-3">
                    <div
                      className="absolute inset-y-0 left-0 bg-repower-gold transition-all duration-500"
                      style={{ width: `${calc.costPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between font-sans text-xs text-repower-navy-900/55 mb-3">
                    <span>{calc.costPercent}% of new boat cost</span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-repower-navy-900/10">
                    <span className="font-sans text-[11px] uppercase tracking-[0.18em] text-repower-mercury-red font-semibold">You save</span>
                    <span className="font-sans text-[11px] uppercase tracking-[0.18em] text-repower-mercury-red font-semibold">
                      {formatCurrency(calc.savings)} ({calc.savingsPercent}%)
                    </span>
                  </div>
                </div>
              );
            })}

            {/* New Boat Reference */}
            <div className="border border-repower-navy-900/10 bg-white p-5 flex items-center justify-between">
              <span className="font-sans text-xs uppercase tracking-[0.18em] text-repower-navy-900/55">Comparable new boat</span>
              <span className="font-display font-bold text-xl text-repower-navy-900">
                {formatCurrency(newBoatValue)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quote from guide */}
      <div className="border border-repower-navy-900/10 bg-white rounded-none p-6 md:p-10 mb-8">
        <p className="font-display text-xl md:text-2xl text-repower-navy-900 leading-snug mb-3">
          You get{' '}
          <span className="text-repower-mercury-red font-bold">70% of the benefit</span>{' '}
          for{' '}
          <span className="text-repower-mercury-red font-bold">
            {calculations[0]?.costPercent || 28}% of the cost.
          </span>
        </p>
        <p className="font-sans text-sm md:text-base text-repower-navy-900/65 max-w-[60ch]">
          Based on your selections, repowering gives you a nearly new boat experience at a fraction of the price.
        </p>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild size="lg" className="bg-repower-navy-900 text-repower-cream hover:bg-repower-navy-900/90 rounded-none font-sans">
          <Link to="/quote/motor-selection">Build your repower quote</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="border-repower-navy-900/30 text-repower-navy-900 hover:bg-repower-navy-900 hover:text-repower-cream rounded-none font-sans">
          <a href="tel:9053422153">Talk to a repower expert</a>
        </Button>
      </div>

      {/* Disclaimer */}
      <p className="text-center font-sans text-xs text-repower-navy-900/55 mt-6">
        Estimates based on typical repower projects. Final pricing depends on specific motor selection and boat condition.
      </p>
    </div>
  );
}