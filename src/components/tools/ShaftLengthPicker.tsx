import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Ruler, Phone } from 'lucide-react';

type Result = {
  shaftClass: 'short' | 'long' | 'xlong' | 'edge';
  label: string;
  why: string;
  queryParam: string | null;
};

function classify(inches: number): Result {
  if (inches >= 13 && inches <= 16) {
    return {
      shaftClass: 'short',
      label: 'Short shaft (15 inch)',
      why: 'Most kicker and portable Mercury motors. The wrong shaft length here causes prop ventilation.',
      queryParam: 'short-15',
    };
  }
  if (inches >= 17 && inches <= 21) {
    return {
      shaftClass: 'long',
      label: 'Long shaft (20 inch)',
      why: 'The default Mercury shaft length. About 80% of Ontario boats are this class.',
      queryParam: 'long-20',
    };
  }
  if (inches >= 22 && inches <= 26) {
    return {
      shaftClass: 'xlong',
      label: 'Extra-long shaft (25 inch)',
      why: 'Required when the transom-to-waterline distance is large (deep-V hulls, offshore-style consoles). Wrong length here drags the prop too deep.',
      queryParam: 'xlong-25',
    };
  }
  return {
    shaftClass: 'edge',
    label: 'Edge case',
    why: 'Call HBW for help measuring your transom. Heights outside 13 to 26 inches need a hands-on check.',
    queryParam: null,
  };
}

export function ShaftLengthPicker() {
  const [value, setValue] = useState<string>('');
  const num = parseFloat(value);
  const result = useMemo<Result | null>(() => {
    if (!value || Number.isNaN(num) || num <= 0) return null;
    return classify(num);
  }, [value, num]);

  const colorBar =
    result?.shaftClass === 'edge'
      ? 'bg-repower-red'
      : 'bg-repower-navy-900';

  return (
    <section
      aria-labelledby="shaft-picker-heading"
      className="my-10 rounded-2xl border border-repower-navy-900/15 bg-white shadow-sm overflow-hidden"
    >
      <div className={`h-1.5 w-full ${colorBar}`} aria-hidden="true" />
      <div className="p-6 md:p-8">
        <div className="flex items-start gap-3 mb-4">
          <div className="rounded-lg bg-repower-navy-900/5 p-2 text-repower-navy-900">
            <Ruler className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="shaft-picker-heading"
              className="font-display font-bold text-xl md:text-2xl text-repower-navy-900"
              style={{ letterSpacing: '-0.02em' }}
            >
              Shaft Length Picker
            </h2>
            <p className="mt-1 text-sm text-repower-navy-900/70">
              Measure from the top of your transom straight down to the bottom of the hull. Enter that number below.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <Label
              htmlFor="transom-height"
              className="text-sm font-medium text-repower-navy-900"
            >
              Transom height (inches)
            </Label>
            <Input
              id="transom-height"
              type="number"
              inputMode="decimal"
              min={1}
              step={0.5}
              placeholder="e.g. 20"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="mt-1.5"
              aria-describedby="transom-help"
            />
            <p id="transom-help" className="mt-1.5 text-xs text-repower-navy-900/60">
              Typical Ontario aluminum boats: 19 to 21 inches.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setValue('')}
            className="border-repower-navy-900/20 text-repower-navy-900 hover:bg-repower-navy-900/5"
          >
            Reset
          </Button>
        </div>

        <div
          aria-live="polite"
          aria-atomic="true"
          className="mt-6"
        >
          {result && (
            <div className="rounded-xl border border-repower-navy-900/10 bg-repower-navy-900/[0.03] p-5">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <h3 className="font-display font-bold text-lg text-repower-navy-900">
                  Recommendation: {result.label}
                </h3>
                <span className="text-xs uppercase tracking-wide text-repower-navy-900/60">
                  Based on {num} inch transom
                </span>
              </div>
              <p className="mt-2 text-[15px] leading-relaxed text-repower-navy-900/80">
                {result.why}
              </p>

              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                {result.queryParam ? (
                  <Button
                    asChild
                    className="bg-repower-red hover:bg-repower-red/90 text-white"
                  >
                    <Link to={`/quote/motor-selection?shaft=${result.queryParam}`}>
                      Build a Quote with the Right Shaft
                    </Link>
                  </Button>
                ) : (
                  <Button
                    asChild
                    className="bg-repower-red hover:bg-repower-red/90 text-white"
                  >
                    <a href="tel:9053422153">
                      <Phone className="h-4 w-4 mr-2" aria-hidden="true" />
                      Call HBW: 905-342-2153
                    </a>
                  </Button>
                )}
                <Button
                  asChild
                  variant="outline"
                  className="border-repower-navy-900/20 text-repower-navy-900 hover:bg-repower-navy-900/5"
                >
                  <Link to="/contact">Ask HBW to verify fit</Link>
                </Button>
              </div>

              <p className="mt-4 text-xs text-repower-navy-900/60">
                Final fitment is verified by HBW staff at the boat. The recommendation above is a starting point.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default ShaftLengthPicker;
