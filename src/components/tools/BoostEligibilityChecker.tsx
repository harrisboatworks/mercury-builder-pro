import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Mail } from 'lucide-react';

type Verdict = 'eligible' | 'possible' | 'not' | 'undecidable';

type DecodeResult = {
  verdict: Verdict;
  family: string | null;
  hp: number | null;
  yearCode: string | null;
  yearLabel: string | null;
};

const YEAR_MAP: Record<string, string> = {
  Z: '2023',
  A: '2024',
  B: '2025',
  C: '2026',
};

function decode(input: string): DecodeResult {
  const raw = input.trim().toUpperCase().replace(/[\s-]/g, '');
  if (raw.length < 4) {
    return { verdict: 'undecidable', family: null, hp: null, yearCode: null, yearLabel: null };
  }

  const f150Match = /F\s*150/.test(raw);
  const familyMatch = raw.match(/F(\d{2,3})/);
  const family = familyMatch ? 'FourStroke' : null;
  const hp = familyMatch ? parseInt(familyMatch[1], 10) : null;

  // Year code: take the last alphabetic character in the string.
  const alphaTail = raw.match(/[A-Z]/g);
  const yearCode = alphaTail ? alphaTail[alphaTail.length - 1] : null;
  const yearLabel = yearCode && YEAR_MAP[yearCode] ? YEAR_MAP[yearCode] : null;

  if (!f150Match && !familyMatch) {
    return { verdict: 'undecidable', family: null, hp: null, yearCode, yearLabel };
  }

  if (f150Match) {
    if (yearCode && ['Z', 'A', 'B', 'C'].includes(yearCode)) {
      return { verdict: 'eligible', family: 'FourStroke', hp: 150, yearCode, yearLabel };
    }
    return { verdict: 'possible', family: 'FourStroke', hp: 150, yearCode, yearLabel };
  }

  return { verdict: 'not', family, hp, yearCode, yearLabel };
}

export function BoostEligibilityChecker() {
  const [value, setValue] = useState('');
  const [result, setResult] = useState<DecodeResult | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) {
      setResult(null);
      return;
    }
    setResult(decode(value));
  };

  return (
    <section
      aria-labelledby="boost-checker-heading"
      className="my-10 rounded-2xl border border-repower-navy-900/15 bg-white shadow-sm overflow-hidden"
    >
      <div className="h-1.5 w-full bg-repower-navy-900" aria-hidden="true" />
      <div className="p-6 md:p-8">
        <div className="flex items-start gap-3 mb-5">
          <div className="rounded-lg bg-repower-navy-900/5 p-2 text-repower-navy-900">
            <Zap className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="boost-checker-heading"
              className="font-display font-bold text-xl md:text-2xl text-repower-navy-900"
              style={{ letterSpacing: '-0.02em' }}
            >
              Boost Eligibility Checker
            </h2>
            <p className="mt-1 text-sm text-repower-navy-900/70">
              Enter your Mercury motor model number (cowl plate). We'll check it against the current Boost-eligible class.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="boost-model" className="text-sm font-medium text-repower-navy-900">
              Mercury model number
            </Label>
            <Input
              id="boost-model"
              type="text"
              placeholder="e.g. 1F150XLB"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="mt-1.5 font-mono uppercase"
              aria-describedby="boost-model-help"
              autoComplete="off"
            />
            <p id="boost-model-help" className="mt-1 text-xs text-repower-navy-900/60">
              Found on the engine cowl plate. Looks like 1F150XLB or similar.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="submit"
              className="bg-repower-navy-900 hover:bg-repower-navy-900/90 text-white"
            >
              Check eligibility
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setValue('');
                setResult(null);
              }}
              className="border-repower-navy-900/20 text-repower-navy-900 hover:bg-repower-navy-900/5"
            >
              Reset
            </Button>
          </div>
        </form>

        <div aria-live="polite" aria-atomic="true" className="mt-6">
          {result && (
            <div className="rounded-xl border border-repower-navy-900/10 bg-repower-navy-900/[0.03] p-5">
              {result.verdict === 'eligible' && (
                <p className="text-[15px] leading-relaxed text-repower-navy-900">
                  <strong className="font-display font-bold text-lg block mb-1">
                    Likely eligible.
                  </strong>
                  This appears to be a Mercury 150 HP FourStroke from year code{' '}
                  <span className="font-mono">{result.yearCode}</span>
                  {result.yearLabel ? ` (${result.yearLabel})` : ''}, which matches the Boost-eligible class. Mercury Boost adds 10 HP via software (no hardware change) and is typically $1,500 to $3,000 CAD installed at HBW.{' '}
                  <strong>Confirm exact eligibility and current pricing with HBW before buying.</strong>
                </p>
              )}
              {result.verdict === 'possible' && (
                <p className="text-[15px] leading-relaxed text-repower-navy-900">
                  <strong className="font-display font-bold text-lg block mb-1">
                    Possibly eligible.
                  </strong>
                  This appears to be a 150 HP FourStroke but the year code is older than the current V8 generation. Boost may still apply. Confirm with HBW.
                </p>
              )}
              {result.verdict === 'not' && (
                <p className="text-[15px] leading-relaxed text-repower-navy-900">
                  <strong className="font-display font-bold text-lg block mb-1">
                    Not eligible.
                  </strong>
                  Mercury Boost is currently available only on select Mercury 150 HP V8 FourStroke models. Your motor doesn't match that class. If Mercury expands Boost to other classes, we'll update this tool.
                </p>
              )}
              {result.verdict === 'undecidable' && (
                <p className="text-[15px] leading-relaxed text-repower-navy-900">
                  <strong className="font-display font-bold text-lg block mb-1">
                    Couldn't decode this number cleanly.
                  </strong>
                  Email it to info@harrisboatworks.ca with a photo of the cowl plate and we'll confirm eligibility within one business day.
                </p>
              )}

              {(result.family || result.hp || result.yearLabel) && result.verdict !== 'undecidable' && (
                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-md border border-repower-navy-900/10 bg-white px-3 py-2">
                    <p className="text-xs uppercase tracking-wide text-repower-navy-900/60">Family</p>
                    <p className="font-medium text-repower-navy-900">{result.family || '-'}</p>
                  </div>
                  <div className="rounded-md border border-repower-navy-900/10 bg-white px-3 py-2">
                    <p className="text-xs uppercase tracking-wide text-repower-navy-900/60">HP</p>
                    <p className="font-medium text-repower-navy-900">{result.hp ?? '-'}</p>
                  </div>
                  <div className="rounded-md border border-repower-navy-900/10 bg-white px-3 py-2">
                    <p className="text-xs uppercase tracking-wide text-repower-navy-900/60">Year</p>
                    <p className="font-medium text-repower-navy-900">
                      {result.yearLabel || (result.yearCode ? `code ${result.yearCode}` : '-')}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <Button asChild className="bg-repower-red hover:bg-repower-red/90 text-white">
                  <Link to="/quote/motor-selection?service=boost">
                    Get a Boost Upgrade Quote at HBW
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-repower-navy-900/20 text-repower-navy-900 hover:bg-repower-navy-900/5"
                >
                  <a href="mailto:info@harrisboatworks.ca?subject=Boost%20Eligibility%20Check">
                    <Mail className="h-4 w-4 mr-2" aria-hidden="true" />
                    Email serial to HBW
                  </a>
                </Button>
              </div>

              <p className="mt-4 text-xs text-repower-navy-900/60 italic">
                Mercury Boost availability changes when Mercury Marine releases new versions. Always confirm with HBW (905-342-2153) before purchasing the upgrade.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default BoostEligibilityChecker;
