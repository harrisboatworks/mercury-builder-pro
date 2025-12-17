import { useState, useMemo } from 'react';
import { Calculator, TrendingUp, Check, Zap, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

// Motor pricing based on HP (from repower guide)
const motorPriceRanges: Record<number, { min: number; max: number; avg: number }> = {
  40: { min: 4500, max: 6000, avg: 5250 },
  60: { min: 6000, max: 8500, avg: 7250 },
  75: { min: 8000, max: 10500, avg: 9250 },
  90: { min: 9500, max: 12500, avg: 11000 },
  115: { min: 11500, max: 15000, avg: 13250 },
  150: { min: 15000, max: 20000, avg: 17500 },
};

const riggingCosts: Record<string, { min: number; max: number; avg: number; label: string }> = {
  keep: { min: 0, max: 500, avg: 250, label: 'Keep Existing Controls' },
  upgrade: { min: 1500, max: 2500, avg: 2000, label: 'Upgrade Controls' },
  replace: { min: 3000, max: 4000, avg: 3500, label: 'Full Rigging Replacement' },
};

const installationCosts: Record<number, number> = {
  40: 800,
  60: 900,
  75: 1000,
  90: 1100,
  115: 1200,
  150: 1500,
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
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <Calculator className="w-4 h-4" />
          Interactive ROI Calculator
        </div>
        <h2 className="text-3xl md:text-4xl font-light text-foreground mb-4">
          Compare Your Savings
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Select up to 3 horsepower options to see a side-by-side comparison of repower costs vs. buying new.
        </p>
      </div>

      {/* Preset Scenarios */}
      <div className="mb-8">
        <Label className="text-sm text-muted-foreground mb-3 block">Quick Scenarios</Label>
        <div className="flex flex-wrap gap-2">
          {presetScenarios.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                activePreset === preset.name
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              )}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-10">
        {/* Configuration Panel */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Select Horsepower Options <span className="text-muted-foreground">(up to 3)</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {hpOptions.map((hp) => (
                <button
                  key={hp}
                  onClick={() => toggleHP(hp)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all border-2",
                    selectedHPs.includes(hp)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted border-border text-foreground"
                  )}
                >
                  {hp} HP
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-3 block">Rigging Condition</Label>
            <RadioGroup
              value={riggingCondition}
              onValueChange={(value) => {
                setRiggingCondition(value);
                setActivePreset(null);
              }}
              className="space-y-2"
            >
              {Object.entries(riggingCosts).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-3">
                  <RadioGroupItem value={key} id={key} />
                  <Label htmlFor={key} className="flex-1 cursor-pointer">
                    <span className="font-medium">{value.label}</span>
                    <span className="text-muted-foreground ml-2">
                      ({formatCurrency(value.min)} - {formatCurrency(value.max)})
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="text-sm font-medium mb-3 block">
              Comparable New Boat Value: {formatCurrency(newBoatValue)}
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
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>$25,000</span>
              <span>$100,000</span>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-6">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Cost Comparison
          </h3>

          {/* Comparison Cards */}
          <div className="space-y-4">
            {calculations.map((calc) => (
              <div
                key={calc.hp}
                className={cn(
                  "bg-background rounded-xl p-4 border-2 transition-all",
                  bestValue?.hp === calc.hp && calculations.length > 1
                    ? "border-green-500 ring-2 ring-green-500/20"
                    : "border-border"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">{calc.hp} HP</span>
                    {bestValue?.hp === calc.hp && calculations.length > 1 && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        Best Value
                      </span>
                    )}
                  </div>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(calc.totalRepower)}
                  </span>
                </div>

                {/* Cost Breakdown */}
                <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                  <div className="text-center p-2 bg-muted rounded-lg">
                    <div className="text-muted-foreground text-xs">Motor</div>
                    <div className="font-medium">{formatCurrency(calc.motorCost)}</div>
                  </div>
                  <div className="text-center p-2 bg-muted rounded-lg">
                    <div className="text-muted-foreground text-xs">Rigging</div>
                    <div className="font-medium">{formatCurrency(calc.riggingCost)}</div>
                  </div>
                  <div className="text-center p-2 bg-muted rounded-lg">
                    <div className="text-muted-foreground text-xs">Install</div>
                    <div className="font-medium">{formatCurrency(calc.installCost)}</div>
                  </div>
                </div>

                {/* Visual Bar */}
                <div className="relative h-6 bg-muted rounded-full overflow-hidden mb-2">
                  <div
                    className="absolute inset-y-0 left-0 bg-primary/80 rounded-full transition-all duration-500"
                    style={{ width: `${calc.costPercent}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                    {calc.costPercent}% of new boat cost
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">You Save:</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(calc.savings)} ({calc.savingsPercent}%)
                  </span>
                </div>
              </div>
            ))}

            {/* New Boat Reference */}
            <div className="bg-muted/50 rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Comparable New Boat</span>
                <span className="text-xl font-semibold">{formatCurrency(newBoatValue)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quote from guide */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-6 md:p-8 mb-8 border border-primary/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-xl md:text-2xl font-light text-foreground mb-2">
              "You get <span className="font-semibold text-primary">70% of the benefit</span> for{' '}
              <span className="font-semibold text-primary">{calculations[0]?.costPercent || 28}% of the cost</span>"
            </p>
            <p className="text-muted-foreground">
              Based on your selections, repowering gives you a nearly-new boat experience at a fraction of the price.
            </p>
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button asChild size="lg" className="text-base">
          <Link to="/quote/motor-selection">
            <Check className="w-5 h-5 mr-2" />
            Build Your Repower Quote
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="text-base">
          <a href="tel:9053422153">
            Talk to a Repower Expert
          </a>
        </Button>
      </div>

      {/* Disclaimer */}
      <p className="text-center text-xs text-muted-foreground mt-6 flex items-center justify-center gap-1">
        <Info className="w-3 h-3" />
        Estimates based on typical repower projects. Final pricing depends on specific motor selection and boat condition.
      </p>
    </div>
  );
}