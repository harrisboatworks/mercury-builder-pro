import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Wrench, Phone } from 'lucide-react';

type BoatType = 'Aluminum' | 'Pontoon' | 'Fiberglass' | 'Bass' | 'Center console';
type HpClass = '25-30' | '40-60' | '75-115' | '150-200' | '225-300' | '350-400';
type Family = 'FourStroke' | 'Pro XS' | 'Verado';

const BOAT_TYPES: BoatType[] = ['Aluminum', 'Pontoon', 'Fiberglass', 'Bass', 'Center console'];
const HP_CLASSES: HpClass[] = ['25-30', '40-60', '75-115', '150-200', '225-300', '350-400'];

type Row = {
  hp: HpClass;
  family: Family;
  motor: [number, number];
  rigging: [number, number];
  allIn: [number, number];
};

const ROWS: Row[] = [
  { hp: '25-30', family: 'FourStroke', motor: [5500, 7500], rigging: [1500, 2500], allIn: [7500, 10000] },
  { hp: '40-60', family: 'FourStroke', motor: [9500, 13500], rigging: [1500, 3000], allIn: [11000, 16500] },
  { hp: '75-115', family: 'FourStroke', motor: [14500, 19500], rigging: [2000, 4000], allIn: [16500, 23500] },
  { hp: '75-115', family: 'Pro XS', motor: [17000, 22000], rigging: [2500, 4000], allIn: [19500, 26000] },
  { hp: '150-200', family: 'FourStroke', motor: [20500, 26500], rigging: [3500, 6000], allIn: [24000, 32500] },
  { hp: '150-200', family: 'Pro XS', motor: [22500, 28500], rigging: [3500, 6000], allIn: [26000, 34500] },
  { hp: '225-300', family: 'Pro XS', motor: [28500, 36500], rigging: [5000, 8000], allIn: [33500, 44500] },
  { hp: '350-400', family: 'Verado', motor: [39500, 48500], rigging: [6000, 10000], allIn: [45500, 58500] },
];

const BOOST_RANGE: [number, number] = [1500, 3000];

function familiesFor(hp: HpClass | ''): Family[] {
  if (!hp) return [];
  return Array.from(new Set(ROWS.filter((r) => r.hp === hp).map((r) => r.family)));
}

function fmt(n: number) {
  return `$${Math.round(n).toLocaleString('en-CA')}`;
}

export function RepowerCostEstimator() {
  const [boat, setBoat] = useState<BoatType | ''>('');
  const [hpClass, setHpClass] = useState<HpClass | ''>('');
  const [family, setFamily] = useState<Family | ''>('');
  const [hasTrade, setHasTrade] = useState<'yes' | 'no' | ''>('');
  const [tradeValue, setTradeValue] = useState<string>('');
  const [boost, setBoost] = useState<'yes' | 'no' | ''>('');

  const availableFamilies = useMemo(() => familiesFor(hpClass), [hpClass]);
  const showBoost = hpClass === '150-200' && family === 'Pro XS';

  // Reset family if HP class changes and current family is no longer valid.
  if (family && !availableFamilies.includes(family as Family)) {
    setFamily('');
  }
  if (!showBoost && boost) {
    setBoost('');
  }

  const row = useMemo(
    () => ROWS.find((r) => r.hp === hpClass && r.family === family) || null,
    [hpClass, family],
  );

  const ready = boat !== '' && hpClass !== '' && family !== '' && hasTrade !== '' && (hasTrade === 'no' || tradeValue !== '');
  const tradeNum = hasTrade === 'yes' ? Math.max(0, parseFloat(tradeValue) || 0) : 0;

  const result = useMemo(() => {
    if (!ready || !row) return null;
    let lowAll = row.allIn[0];
    let highAll = row.allIn[1];

    let boostLow = 0;
    let boostHigh = 0;
    if (showBoost && boost === 'yes') {
      boostLow = BOOST_RANGE[0];
      boostHigh = BOOST_RANGE[1];
      lowAll += boostLow;
      highAll += boostHigh;
    }

    let netLow = lowAll;
    let netHigh = highAll;
    if (tradeNum > 0) {
      // Cap subtraction at the all-in low end so net never goes negative.
      const cappedLow = Math.min(tradeNum, lowAll);
      const cappedHigh = Math.min(tradeNum, highAll);
      netLow = lowAll - cappedLow;
      netHigh = highAll - cappedHigh;
    }

    return {
      motor: row.motor,
      rigging: row.rigging,
      allIn: [lowAll, highAll] as [number, number],
      boost: showBoost && boost === 'yes' ? ([boostLow, boostHigh] as [number, number]) : null,
      tradeNum,
      net: [netLow, netHigh] as [number, number],
    };
  }, [ready, row, showBoost, boost, tradeNum]);

  const handleReset = () => {
    setBoat('');
    setHpClass('');
    setFamily('');
    setHasTrade('');
    setTradeValue('');
    setBoost('');
  };

  return (
    <section
      aria-labelledby="repower-estimator-heading"
      className="my-10 rounded-2xl border border-repower-navy-900/15 bg-white shadow-sm overflow-hidden"
    >
      <div className="h-1.5 w-full bg-repower-navy-900" aria-hidden="true" />
      <div className="p-6 md:p-8">
        <div className="flex items-start gap-3 mb-5">
          <div className="rounded-lg bg-repower-navy-900/5 p-2 text-repower-navy-900">
            <Wrench className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="repower-estimator-heading"
              className="font-display font-bold text-xl md:text-2xl text-repower-navy-900"
              style={{ letterSpacing: '-0.02em' }}
            >
              Repower Cost Estimator
            </h2>
            <p className="mt-1 text-sm text-repower-navy-900/70">
              Planning-level CAD ranges for a Mercury repower. Final number is a live quote at mercuryrepower.ca.
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="space-y-6"
        >
          {/* Boat type */}
          <fieldset>
            <legend className="text-sm font-medium text-repower-navy-900 mb-2">Boat type</legend>
            <RadioGroup
              value={boat}
              onValueChange={(v) => setBoat(v as BoatType)}
              className="grid grid-cols-2 sm:grid-cols-5 gap-2"
            >
              {BOAT_TYPES.map((b) => (
                <label
                  key={b}
                  htmlFor={`boat-${b}`}
                  className="flex items-center gap-2 rounded-md border border-repower-navy-900/15 px-3 py-2 cursor-pointer hover:bg-repower-navy-900/[0.03] text-sm text-repower-navy-900"
                >
                  <RadioGroupItem id={`boat-${b}`} value={b} />
                  <span>{b}</span>
                </label>
              ))}
            </RadioGroup>
          </fieldset>

          {/* HP class */}
          <fieldset>
            <legend className="text-sm font-medium text-repower-navy-900 mb-2">HP class</legend>
            <RadioGroup
              value={hpClass}
              onValueChange={(v) => setHpClass(v as HpClass)}
              className="grid grid-cols-2 sm:grid-cols-3 gap-2"
            >
              {HP_CLASSES.map((h) => (
                <label
                  key={h}
                  htmlFor={`hp-${h}`}
                  className="flex items-center gap-2 rounded-md border border-repower-navy-900/15 px-3 py-2 cursor-pointer hover:bg-repower-navy-900/[0.03] text-sm text-repower-navy-900"
                >
                  <RadioGroupItem id={`hp-${h}`} value={h} />
                  <span>
                    {h} HP{h === '225-300' ? ' (V6)' : h === '350-400' ? ' (V8)' : ''}
                  </span>
                </label>
              ))}
            </RadioGroup>
          </fieldset>

          {/* Motor family (depends on HP) */}
          {availableFamilies.length > 0 && (
            <fieldset>
              <legend className="text-sm font-medium text-repower-navy-900 mb-2">Motor family</legend>
              <RadioGroup
                value={family}
                onValueChange={(v) => setFamily(v as Family)}
                className="flex flex-wrap gap-2"
              >
                {availableFamilies.map((f) => (
                  <label
                    key={f}
                    htmlFor={`fam-${f}`}
                    className="flex items-center gap-2 rounded-md border border-repower-navy-900/15 px-3 py-2 cursor-pointer hover:bg-repower-navy-900/[0.03] text-sm text-repower-navy-900"
                  >
                    <RadioGroupItem id={`fam-${f}`} value={f} />
                    <span>{f}</span>
                  </label>
                ))}
              </RadioGroup>
            </fieldset>
          )}

          {/* Boost (conditional) */}
          {showBoost && (
            <fieldset>
              <legend className="text-sm font-medium text-repower-navy-900 mb-2">
                Add Mercury Boost?
              </legend>
              <RadioGroup
                value={boost}
                onValueChange={(v) => setBoost(v as 'yes' | 'no')}
                className="flex flex-wrap gap-2"
              >
                {(['yes', 'no'] as const).map((v) => (
                  <label
                    key={v}
                    htmlFor={`boost-${v}`}
                    className="flex items-center gap-2 rounded-md border border-repower-navy-900/15 px-3 py-2 cursor-pointer hover:bg-repower-navy-900/[0.03] text-sm text-repower-navy-900"
                  >
                    <RadioGroupItem id={`boost-${v}`} value={v} />
                    <span>{v === 'yes' ? 'Yes' : 'No'}</span>
                  </label>
                ))}
              </RadioGroup>
            </fieldset>
          )}

          {/* Trade-in */}
          <fieldset>
            <legend className="text-sm font-medium text-repower-navy-900 mb-2">Trade-in?</legend>
            <RadioGroup
              value={hasTrade}
              onValueChange={(v) => setHasTrade(v as 'yes' | 'no')}
              className="flex flex-wrap gap-2"
            >
              {(['yes', 'no'] as const).map((v) => (
                <label
                  key={v}
                  htmlFor={`trade-${v}`}
                  className="flex items-center gap-2 rounded-md border border-repower-navy-900/15 px-3 py-2 cursor-pointer hover:bg-repower-navy-900/[0.03] text-sm text-repower-navy-900"
                >
                  <RadioGroupItem id={`trade-${v}`} value={v} />
                  <span>{v === 'yes' ? 'Yes' : 'No'}</span>
                </label>
              ))}
            </RadioGroup>

            {hasTrade === 'yes' && (
              <div className="mt-3">
                <Label htmlFor="trade-value" className="text-sm font-medium text-repower-navy-900">
                  Estimated trade value (CAD)
                </Label>
                <Input
                  id="trade-value"
                  type="number"
                  min={0}
                  step={100}
                  placeholder="e.g. 4500"
                  value={tradeValue}
                  onChange={(e) => setTradeValue(e.target.value)}
                  className="mt-1.5 max-w-xs"
                />
              </div>
            )}
          </fieldset>

          <div>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="border-repower-navy-900/20 text-repower-navy-900 hover:bg-repower-navy-900/5"
            >
              Reset
            </Button>
          </div>
        </form>

        <div aria-live="polite" aria-atomic="true" className="mt-6">
          {result && (
            <div className="rounded-xl border border-repower-navy-900/10 bg-repower-navy-900/[0.03] p-5">
              <p className="text-xs uppercase tracking-wide text-repower-navy-900/60 mb-1">
                All-in CAD range
              </p>
              <p className="font-display font-bold text-2xl md:text-3xl text-repower-navy-900">
                {fmt(result.net[0])} - {fmt(result.net[1])}
              </p>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-repower-navy-900/15 text-repower-navy-900/70">
                      <th className="py-2 pr-3 font-semibold">Line item</th>
                      <th className="py-2 pr-3 font-semibold text-right">Range (CAD)</th>
                    </tr>
                  </thead>
                  <tbody className="text-repower-navy-900">
                    <tr className="border-b border-repower-navy-900/10">
                      <td className="py-2 pr-3">Motor (list)</td>
                      <td className="py-2 pr-3 text-right">{fmt(result.motor[0])} - {fmt(result.motor[1])}</td>
                    </tr>
                    <tr className="border-b border-repower-navy-900/10">
                      <td className="py-2 pr-3">Rigging + install</td>
                      <td className="py-2 pr-3 text-right">{fmt(result.rigging[0])} - {fmt(result.rigging[1])}</td>
                    </tr>
                    {result.boost && (
                      <tr className="border-b border-repower-navy-900/10">
                        <td className="py-2 pr-3">Mercury Boost upgrade</td>
                        <td className="py-2 pr-3 text-right">{fmt(result.boost[0])} - {fmt(result.boost[1])}</td>
                      </tr>
                    )}
                    {result.tradeNum > 0 && (
                      <tr className="border-b border-repower-navy-900/10 text-repower-red">
                        <td className="py-2 pr-3">Trade-in credit</td>
                        <td className="py-2 pr-3 text-right">- {fmt(result.tradeNum)}</td>
                      </tr>
                    )}
                    <tr className="font-semibold">
                      <td className="py-2 pr-3">Net all-in</td>
                      <td className="py-2 pr-3 text-right">{fmt(result.net[0])} - {fmt(result.net[1])}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="mt-4 text-xs text-repower-navy-900/60 italic">
                Planning-level CAD ranges as of May 2026. Final pricing depends on configuration, lender approval, Mercury availability, and the live quote. Build a current quote at mercuryrepower.ca for today's exact numbers.
              </p>

              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <Button asChild className="bg-repower-red hover:bg-repower-red/90 text-white">
                  <Link to="/quote/motor-selection">
                    Build a Real Quote at mercuryrepower.ca
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-repower-navy-900/20 text-repower-navy-900 hover:bg-repower-navy-900/5"
                >
                  <a href="tel:9053422153">
                    <Phone className="h-4 w-4 mr-2" aria-hidden="true" />
                    Talk to HBW: 905-342-2153
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default RepowerCostEstimator;
