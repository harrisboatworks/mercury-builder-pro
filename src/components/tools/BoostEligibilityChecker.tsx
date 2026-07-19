import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Mail } from 'lucide-react';

type Family = 'FourStroke' | 'Pro XS' | 'Verado' | 'Racing';
type Verdict = 'preliminarily-eligible' | 'not-listed' | 'needs-review';

type Result = {
  verdict: Verdict;
  message: string;
};

const MIN_STANDARD_SERIAL = '2B529482';
const FACTORY_STANDARD_SERIAL = '3B612425';
const MIN_RACING_150R_SERIAL = '3B547096';
const MIN_VERADO_350_SERIAL = '3B266064';
const MAX_VERADO_350_DEALER_SERIAL = '3B578265';
const FACTORY_VERADO_350_SERIAL = '3B578266';

function normalizeSerial(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function serialAtLeast(serial: string, minimum: string) {
  return serial.localeCompare(minimum, 'en', { sensitivity: 'base', numeric: true }) >= 0;
}

function serialAtMost(serial: string, maximum: string) {
  return serial.localeCompare(maximum, 'en', { sensitivity: 'base', numeric: true }) <= 0;
}

function evaluate(family: Family, hp: number, serialInput: string): Result {
  const serial = normalizeSerial(serialInput);
  if (!/^\d[A-Z]\d{6}$/.test(serial)) {
    return {
      verdict: 'needs-review',
      message: 'That serial format could not be checked. Send HBW a clear photo of the engine identification plate.',
    };
  }

  let listed = false;
  let serialMatch = false;

  if (family === 'FourStroke' && [175, 200, 250, 300].includes(hp)) {
    listed = true;
    if (serialAtLeast(serial, FACTORY_STANDARD_SERIAL)) {
      return {
        verdict: 'needs-review',
        message: 'This serial is in Mercury\'s published factory-equipped range. It may already include Boost or need a dealer software update, so HBW must check its current Mercury status before discussing any purchase.',
      };
    }
    serialMatch = serialAtLeast(serial, MIN_STANDARD_SERIAL);
  } else if (family === 'Pro XS' && [175, 200, 225, 250, 300].includes(hp)) {
    listed = true;
    if (serialAtLeast(serial, FACTORY_STANDARD_SERIAL)) {
      return {
        verdict: 'needs-review',
        message: 'This serial is in Mercury\'s published factory-equipped range. It may already include Boost or need a dealer software update, so HBW must check its current Mercury status before discussing any purchase.',
      };
    }
    serialMatch = serialAtLeast(serial, MIN_STANDARD_SERIAL);
  } else if (family === 'Verado' && [250, 300].includes(hp)) {
    listed = true;
    if (serialAtLeast(serial, FACTORY_STANDARD_SERIAL)) {
      return {
        verdict: 'needs-review',
        message: 'This serial is in Mercury\'s published factory-equipped range. It may already include Boost or need a dealer software update, so HBW must check its current Mercury status before discussing any purchase.',
      };
    }
    serialMatch = serialAtLeast(serial, MIN_STANDARD_SERIAL);
  } else if (family === 'Verado' && hp === 350) {
    listed = true;
    if (serialAtLeast(serial, FACTORY_VERADO_350_SERIAL)) {
      return {
        verdict: 'needs-review',
        message: 'This 350 HP Verado serial is in Mercury\'s published factory-equipped range and may need a dealer software update to interface with Boost. HBW must check its current Mercury status before discussing any purchase.',
      };
    }
    serialMatch = serialAtLeast(serial, MIN_VERADO_350_SERIAL) && serialAtMost(serial, MAX_VERADO_350_DEALER_SERIAL);
  } else if (family === 'Racing' && hp === 150) {
    listed = true;
    if (serialAtLeast(serial, FACTORY_STANDARD_SERIAL)) {
      return {
        verdict: 'needs-review',
        message: 'This Racing 150R serial is in Mercury\'s published factory-equipped range. HBW must check its current Mercury status before discussing any purchase.',
      };
    }
    serialMatch = serialAtLeast(serial, MIN_RACING_150R_SERIAL);
  }

  if (!listed) {
    return {
      verdict: 'not-listed',
      message: 'This family and horsepower combination is not on Mercury\'s published dealer-installed Boost list. A standard 150 FourStroke or 150 Pro XS is not the Racing 150R exception.',
    };
  }

  if (!serialMatch) {
    return {
      verdict: 'not-listed',
      message: 'The family and horsepower are listed, but this serial number is outside the published dealer-installed range.',
    };
  }

  return {
    verdict: 'preliminarily-eligible',
    message: 'The family, horsepower, and serial number match the published dealer-installed range. HBW must still confirm the full model code, current Mercury status, warranty treatment, and Canadian price before booking.',
  };
}

export function BoostEligibilityChecker() {
  const [family, setFamily] = useState<Family>('FourStroke');
  const [hp, setHp] = useState('');
  const [serial, setSerial] = useState('');
  const [result, setResult] = useState<Result | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsedHp = Number.parseInt(hp, 10);
    if (!Number.isFinite(parsedHp)) {
      setResult({ verdict: 'needs-review', message: 'Enter the horsepower shown on the motor, then try again.' });
      return;
    }
    setResult(evaluate(family, parsedHp, serial));
  };

  return (
    <section
      aria-labelledby="boost-checker-heading"
      className="my-10 overflow-hidden rounded-2xl border border-repower-navy-900/15 bg-white shadow-sm"
    >
      <div className="h-1.5 w-full bg-repower-navy-900" aria-hidden="true" />
      <div className="p-6 md:p-8">
        <div className="mb-5 flex items-start gap-3">
          <div className="rounded-lg bg-repower-navy-900/5 p-2 text-repower-navy-900">
            <Zap className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id="boost-checker-heading" className="font-display text-xl font-bold text-repower-navy-900 md:text-2xl">
              Boost Preliminary Eligibility Check
            </h2>
            <p className="mt-1 text-sm text-repower-navy-900/70">
              Check the published dealer-installed range. HBW confirms the exact motor before any purchase.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="boost-family">Engine family</Label>
            <select
              id="boost-family"
              value={family}
              onChange={(event) => setFamily(event.target.value as Family)}
              className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option>FourStroke</option>
              <option>Pro XS</option>
              <option>Verado</option>
              <option>Racing</option>
            </select>
          </div>
          <div>
            <Label htmlFor="boost-hp">Horsepower</Label>
            <Input id="boost-hp" inputMode="numeric" placeholder="e.g. 200" value={hp} onChange={(event) => setHp(event.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="boost-serial">Serial number</Label>
            <Input id="boost-serial" placeholder="e.g. 2B529482" value={serial} onChange={(event) => setSerial(event.target.value)} className="mt-1.5 font-mono uppercase" />
          </div>
          <div className="md:col-span-3 flex flex-col gap-3 sm:flex-row">
            <Button type="submit" className="bg-repower-navy-900 text-white hover:bg-repower-navy-900/90">Check published range</Button>
            <Button type="button" variant="outline" onClick={() => { setHp(''); setSerial(''); setResult(null); }}>Reset</Button>
          </div>
        </form>

        {result && (
          <div aria-live="polite" className="mt-6 rounded-xl border border-repower-navy-900/10 bg-repower-navy-900/[0.03] p-5">
            <strong className="font-display text-lg text-repower-navy-900">
              {result.verdict === 'preliminarily-eligible' ? 'Preliminary match' : result.verdict === 'not-listed' ? 'Not on the published range' : 'Dealer review needed'}
            </strong>
            <p className="mt-1 text-[15px] leading-relaxed text-repower-navy-900">{result.message}</p>
            <p className="mt-3 text-sm text-repower-navy-900/70">
              Boost can improve mid-range acceleration on an eligible motor. It does not add horsepower, top speed, or maximum RPM.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="bg-repower-red text-white hover:bg-repower-red/90">
                <Link to="/contact">Ask HBW to confirm</Link>
              </Button>
              <Button asChild variant="outline">
                <a href="mailto:info@harrisboatworks.ca?subject=Boost%20Eligibility%20Check">
                  <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                  Email plate photo
                </a>
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default BoostEligibilityChecker;
