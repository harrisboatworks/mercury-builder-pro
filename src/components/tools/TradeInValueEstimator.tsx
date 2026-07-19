import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DollarSign, Mail } from 'lucide-react';

type Brand = 'Mercury' | 'Yamaha' | 'Honda' | 'Suzuki' | 'Tohatsu' | 'Evinrude/OMC' | 'Other';
type Stroke = '4-stroke' | '2-stroke';
type Condition = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Not running';

const BRANDS: Brand[] = ['Mercury', 'Yamaha', 'Honda', 'Suzuki', 'Tohatsu', 'Evinrude/OMC', 'Other'];
const CONDITIONS: Condition[] = ['Excellent', 'Good', 'Fair', 'Poor', 'Not running'];

type HpRow = { match: (hp: number) => boolean; label: string; t1: [number, number]; t2: [number, number]; t3: [number, number] };

const HP_TABLE: HpRow[] = [
  { match: (h) => h >= 9 && h <= 15, label: '9.9-15 HP', t1: [1800, 3000], t2: [1200, 2000], t3: [600, 1200] },
  { match: (h) => h >= 25 && h <= 30, label: '25-30 HP', t1: [2500, 4000], t2: [1500, 2800], t3: [800, 1600] },
  { match: (h) => h >= 40 && h <= 50, label: '40-50 HP', t1: [3500, 5500], t2: [2200, 3800], t3: [1200, 2200] },
  { match: (h) => h >= 60 && h <= 75, label: '60-75 HP', t1: [5000, 7500], t2: [3200, 5200], t3: [1800, 3200] },
  { match: (h) => h >= 90 && h <= 115, label: '90-115 HP', t1: [7000, 10500], t2: [4500, 7500], t3: [2500, 4500] },
  { match: (h) => h >= 150 && h <= 200, label: '150-200 HP', t1: [9500, 14500], t2: [6500, 10500], t3: [4000, 7000] },
  { match: (h) => h >= 225 && h <= 300, label: '225-300 HP', t1: [13000, 19000], t2: [9000, 14500], t3: [5500, 10000] },
];

type EstimateResult =
  | { kind: 'range'; low: number; high: number; explainer: string }
  | { kind: 'scrap'; low: number; high: number; explainer: string }
  | { kind: 'evinrude'; explainer: string }
  | { kind: 'unsupported'; message: string };

function fmt(n: number) {
  return `$${n.toLocaleString('en-CA')}`;
}

function ageTier(year: number): 't1' | 't2' | 't3' | 'old' {
  if (year >= 2020) return 't1';
  if (year >= 2015) return 't2';
  if (year >= 2010) return 't3';
  return 'old';
}

function brandFactor(brand: Brand, stroke: Stroke): { lowMul: number; highMul: number } | 'evinrude' {
  if (brand === 'Evinrude/OMC') return 'evinrude';
  if (stroke === '2-stroke') return { lowMul: 0.65, highMul: 0.7 };
  if (brand === 'Honda') return { lowMul: 0.85, highMul: 0.9 };
  if (brand === 'Suzuki' || brand === 'Tohatsu') return { lowMul: 0.8, highMul: 0.85 };
  if (brand === 'Other') return { lowMul: 0.75, highMul: 0.8 };
  return { lowMul: 1, highMul: 1 };
}

function compute(input: {
  brand: Brand;
  year: number;
  hp: number;
  stroke: Stroke;
  hours: number | null;
  condition: Condition;
}): EstimateResult {
  const { brand, year, hp, stroke, hours, condition } = input;

  if (brand === 'Evinrude/OMC') {
    return {
      kind: 'evinrude',
      explainer: 'Trade value typically scrap-only. Bring it in for a hands-on assessment.',
    };
  }

  const row = HP_TABLE.find((r) => r.match(hp));
  if (!row) {
    return {
      kind: 'unsupported',
      message: `${hp} HP is outside our quick-estimate chart. Call HBW at 905-342-2153 or email info@harrisboatworks.ca for a hands-on quote.`,
    };
  }

  const tier = ageTier(year);
  if (tier === 'old') {
    return {
      kind: 'scrap',
      low: 100,
      high: 500,
      explainer: `${year} is older than our quick-estimate chart goes. Scrap-credit range applies; bring it in for a real number.`,
    };
  }

  if (condition === 'Not running' || (hours !== null && hours >= 2000)) {
    return {
      kind: 'scrap',
      low: 100,
      high: 500,
      explainer:
        condition === 'Not running'
          ? 'Non-running motors trade as scrap-credit only.'
          : 'Motors with 2,000+ hours trade as scrap-credit only.',
    };
  }

  const baseRange = row[tier];
  const factor = brandFactor(brand, stroke);
  if (factor === 'evinrude') {
    return { kind: 'evinrude', explainer: 'Trade value typically scrap-only. Bring it in for a hands-on assessment.' };
  }

  let low = baseRange[0] * factor.lowMul;
  let high = baseRange[1] * factor.highMul;

  let pickLow = low;
  let pickHigh = high;
  if (condition === 'Excellent') {
    pickLow = high * 0.92;
    pickHigh = high;
  } else if (condition === 'Good') {
    const mid = (low + high) / 2;
    pickLow = mid * 0.95;
    pickHigh = mid * 1.05;
  } else if (condition === 'Fair') {
    pickLow = low;
    pickHigh = low * 1.1;
  } else if (condition === 'Poor') {
    pickLow = low * 0.45;
    pickHigh = low * 0.55;
  }

  if (hours !== null) {
    if (hours < 200) {
      pickLow = Math.max(pickLow, high * 0.9);
      pickHigh = high;
    } else if (hours <= 500) {
      const mid = (low + high) / 2;
      pickLow = mid * 0.92;
      pickHigh = mid * 1.08;
    } else if (hours <= 1000) {
      pickLow = low;
      pickHigh = low * 1.12;
    } else if (hours <= 2000) {
      pickLow = low * 0.55;
      pickHigh = low * 0.65;
    }
  }

  const round = (n: number) => Math.max(0, Math.round(n / 50) * 50);
  pickLow = round(pickLow);
  pickHigh = round(pickHigh);
  if (pickHigh < pickLow) pickHigh = pickLow;

  const hoursText = hours === null ? 'hours not provided' : `${hours.toLocaleString('en-CA')} hours`;
  const explainer = `Based on a ${year} ${brand} ${hp} HP ${stroke}, ${condition.toLowerCase()} condition, ${hoursText}. Range reflects HBW's typical Ontario trade values for the ${row.label} class.`;

  return { kind: 'range', low: pickLow, high: pickHigh, explainer };
}

export function TradeInValueEstimator() {
  const [brand, setBrand] = useState<Brand | ''>('');
  const [year, setYear] = useState<string>('');
  const [hp, setHp] = useState<string>('');
  const [stroke, setStroke] = useState<Stroke | ''>('');
  const [hours, setHours] = useState<string>('');
  const [condition, setCondition] = useState<Condition | ''>('');
  const [submitted, setSubmitted] = useState(false);

  const yearNum = parseInt(year, 10);
  const hpNum = parseFloat(hp);
  const hoursNum = hours === '' ? null : parseInt(hours, 10);

  const ready =
    brand !== '' &&
    !Number.isNaN(yearNum) &&
    yearNum >= 1990 &&
    yearNum <= 2025 &&
    !Number.isNaN(hpNum) &&
    hpNum > 0 &&
    stroke !== '' &&
    condition !== '';

  const result = useMemo<EstimateResult | null>(() => {
    if (!submitted || !ready) return null;
    return compute({
      brand: brand as Brand,
      year: yearNum,
      hp: hpNum,
      stroke: stroke as Stroke,
      hours: hoursNum !== null && !Number.isNaN(hoursNum) ? hoursNum : null,
      condition: condition as Condition,
    });
  }, [submitted, ready, brand, yearNum, hpNum, stroke, hoursNum, condition]);

  const handleReset = () => {
    setBrand('');
    setYear('');
    setHp('');
    setStroke('');
    setHours('');
    setCondition('');
    setSubmitted(false);
  };

  return (
    <section
      aria-labelledby="trade-estimator-heading"
      className="my-10 rounded-2xl border border-repower-navy-900/15 bg-white shadow-sm overflow-hidden"
    >
      <div className="h-1.5 w-full bg-repower-navy-900" aria-hidden="true" />
      <div className="p-6 md:p-8">
        <div className="flex items-start gap-3 mb-5">
          <div className="rounded-lg bg-repower-navy-900/5 p-2 text-repower-navy-900">
            <DollarSign className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="trade-estimator-heading"
              className="font-display font-bold text-xl md:text-2xl text-repower-navy-900"
              style={{ letterSpacing: '-0.02em' }}
            >
              Trade-In Value Estimator
            </h2>
            <p className="mt-1 text-sm text-repower-navy-900/70">
              Quick CAD range based on HBW's typical Ontario trade values. Final number is confirmed in person.
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
          className="space-y-6"
        >
          <fieldset>
            <legend className="text-sm font-medium text-repower-navy-900 mb-2">Brand</legend>
            <RadioGroup
              value={brand}
              onValueChange={(v) => setBrand(v as Brand)}
              className="grid grid-cols-2 sm:grid-cols-4 gap-2"
            >
              {BRANDS.map((b) => (
                <label
                  key={b}
                  htmlFor={`brand-${b}`}
                  className="flex items-center gap-2 rounded-md border border-repower-navy-900/15 px-3 py-2 cursor-pointer hover:bg-repower-navy-900/[0.03] text-sm text-repower-navy-900"
                >
                  <RadioGroupItem id={`brand-${b}`} value={b} />
                  <span>{b}</span>
                </label>
              ))}
            </RadioGroup>
          </fieldset>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="trade-year" className="text-sm font-medium text-repower-navy-900">
                Model year
              </Label>
              <Input
                id="trade-year"
                type="number"
                min={1990}
                max={2025}
                placeholder="e.g. 2018"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-repower-navy-900/60">1990 - 2025</p>
            </div>
            <div>
              <Label htmlFor="trade-hp" className="text-sm font-medium text-repower-navy-900">
                Horsepower
              </Label>
              <Input
                id="trade-hp"
                type="number"
                min={1}
                placeholder="e.g. 90"
                value={hp}
                onChange={(e) => setHp(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-repower-navy-900 mb-2">Stroke type</legend>
            <RadioGroup
              value={stroke}
              onValueChange={(v) => setStroke(v as Stroke)}
              className="flex flex-wrap gap-2"
            >
              {(['4-stroke', '2-stroke'] as Stroke[]).map((s) => (
                <label
                  key={s}
                  htmlFor={`stroke-${s}`}
                  className="flex items-center gap-2 rounded-md border border-repower-navy-900/15 px-3 py-2 cursor-pointer hover:bg-repower-navy-900/[0.03] text-sm text-repower-navy-900"
                >
                  <RadioGroupItem id={`stroke-${s}`} value={s} />
                  <span>{s}</span>
                </label>
              ))}
            </RadioGroup>
          </fieldset>

          <div>
            <Label htmlFor="trade-hours" className="text-sm font-medium text-repower-navy-900">
              Engine hours <span className="text-repower-navy-900/60 font-normal">(optional)</span>
            </Label>
            <Input
              id="trade-hours"
              type="number"
              min={0}
              placeholder="e.g. 350"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-repower-navy-900 mb-2">Condition</legend>
            <RadioGroup
              value={condition}
              onValueChange={(v) => setCondition(v as Condition)}
              className="grid grid-cols-2 sm:grid-cols-5 gap-2"
            >
              {CONDITIONS.map((c) => (
                <label
                  key={c}
                  htmlFor={`cond-${c}`}
                  className="flex items-center gap-2 rounded-md border border-repower-navy-900/15 px-3 py-2 cursor-pointer hover:bg-repower-navy-900/[0.03] text-sm text-repower-navy-900"
                >
                  <RadioGroupItem id={`cond-${c}`} value={c} />
                  <span>{c}</span>
                </label>
              ))}
            </RadioGroup>
          </fieldset>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="submit"
              disabled={!ready}
              className="bg-repower-navy-900 hover:bg-repower-navy-900/90 text-white"
            >
              Estimate Trade Value
            </Button>
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
              {result.kind === 'range' && (
                <>
                  <p className="text-xs uppercase tracking-wide text-repower-navy-900/60 mb-1">
                    Estimated trade-in range
                  </p>
                  <p className="font-display font-bold text-2xl md:text-3xl text-repower-navy-900">
                    {fmt(result.low)} - {fmt(result.high)} CAD
                  </p>
                  <p className="mt-3 text-[15px] leading-relaxed text-repower-navy-900/80">
                    {result.explainer}
                  </p>
                </>
              )}
              {result.kind === 'scrap' && (
                <>
                  <p className="text-xs uppercase tracking-wide text-repower-navy-900/60 mb-1">
                    Scrap-credit range
                  </p>
                  <p className="font-display font-bold text-2xl md:text-3xl text-repower-navy-900">
                    {fmt(result.low)} - {fmt(result.high)} CAD
                  </p>
                  <p className="mt-3 text-[15px] leading-relaxed text-repower-navy-900/80">
                    {result.explainer}
                  </p>
                </>
              )}
              {result.kind === 'evinrude' && (
                <>
                  <p className="text-xs uppercase tracking-wide text-repower-navy-900/60 mb-1">
                    Evinrude / OMC
                  </p>
                  <p className="font-display font-bold text-xl text-repower-navy-900">
                    Scrap value only
                  </p>
                  <p className="mt-3 text-[15px] leading-relaxed text-repower-navy-900/80">
                    {result.explainer}
                  </p>
                </>
              )}
              {result.kind === 'unsupported' && (
                <p className="text-[15px] leading-relaxed text-repower-navy-900/80">
                  {result.message}
                </p>
              )}

              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <Button asChild className="bg-repower-red hover:bg-repower-red/90 text-white">
                  <Link to="/quote/motor-selection?trade=yes">
                    Get a personalized trade quote
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-repower-navy-900/20 text-repower-navy-900 hover:bg-repower-navy-900/5"
                >
                  <a href="mailto:info@harrisboatworks.ca?subject=Trade-In%20Photos">
                    <Mail className="h-4 w-4 mr-2" aria-hidden="true" />
                    Email photos to info@harrisboatworks.ca
                  </a>
                </Button>
              </div>

              <p className="mt-4 text-xs text-repower-navy-900/60 italic">
                This is a preliminary estimate. Actual trade value is confirmed in person after we run the motor and inspect it. The number above is a starting point, not a guarantee.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default TradeInValueEstimator;
