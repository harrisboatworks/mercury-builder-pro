import { useId, useState } from 'react';

import { COMPANY_INFO } from '@/lib/companyInfo';

export interface BoatFitSelection {
  boatType: string;
  boatTypeLabel: string;
  lengthFt: number | null;
  maxHp: number;
  minHp: number;
}

export const BOAT_TYPE_OPTIONS = [
  { value: 'aluminum-fishing', label: 'Aluminum fishing boat', phrase: 'aluminum fishing boat' },
  { value: 'pontoon', label: 'Pontoon', phrase: 'pontoon' },
  { value: 'fibreglass-runabout', label: 'Fibreglass runabout or bowrider', phrase: 'fibreglass runabout' },
  { value: 'bass-boat', label: 'Bass boat', phrase: 'bass boat' },
  { value: 'other', label: 'Other', phrase: 'boat' },
] as const;

/** Motors shown start at roughly this share of the capacity plate maximum. */
export const BOAT_FIT_LOWER_SHARE = 0.6;

export function getBoatTypeOption(value: string) {
  return BOAT_TYPE_OPTIONS.find((option) => option.value === value) ?? BOAT_TYPE_OPTIONS[0];
}

export function buildBoatFitSummary(fit: BoatFitSelection): string {
  const lengthPart = fit.lengthFt ? `${fit.lengthFt} ft ` : '';
  const phrase = getBoatTypeOption(fit.boatType).phrase;
  return `Showing ${fit.minHp} to ${fit.maxHp} HP Mercurys for your ${lengthPart}${phrase}. Never exceed your capacity plate.`;
}

interface StartFromYourBoatProps {
  /** Lowest horsepower Harris sells, used for validation only. */
  catalogMinHp: number;
  /** Highest horsepower Harris sells, used for validation only. */
  catalogMaxHp: number;
  onSubmit: (fit: BoatFitSelection) => void;
}

const SMS_DIGITS = COMPANY_INFO.contact.sms.replace(/\D/g, '');

export function StartFromYourBoat({ catalogMinHp, catalogMaxHp, onSubmit }: StartFromYourBoatProps) {
  const fieldId = useId();
  const [boatType, setBoatType] = useState<string>(BOAT_TYPE_OPTIONS[0].value);
  const [length, setLength] = useState('');
  const [maxHp, setMaxHp] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedMaxHp = Number(maxHp);

    if (!maxHp.trim() || !Number.isFinite(parsedMaxHp) || parsedMaxHp <= 0) {
      setError('Enter the maximum horsepower printed on your capacity plate.');
      return;
    }
    if (parsedMaxHp < catalogMinHp || parsedMaxHp > catalogMaxHp) {
      setError(`Enter a number between ${catalogMinHp} and ${catalogMaxHp} HP.`);
      return;
    }

    const parsedLength = Number(length);
    const lengthFt = length.trim() && Number.isFinite(parsedLength) && parsedLength > 0
      ? parsedLength
      : null;

    setError(null);
    onSubmit({
      boatType,
      boatTypeLabel: getBoatTypeOption(boatType).label,
      lengthFt,
      maxHp: parsedMaxHp,
      minHp: Math.round(parsedMaxHp * BOAT_FIT_LOWER_SHARE * 10) / 10,
    });
  };

  const inputClass =
    'w-full rounded-sm border border-[#050E1C]/15 bg-repower-cream px-3 py-2.5 text-[15px] text-[#050E1C] outline-none transition-colors focus:border-[#050E1C] focus:ring-2 focus:ring-[#C9A24A]/40';
  const labelClass =
    'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#050E1C]/60';

  return (
    <section className="bg-repower-paper px-4 pb-4 pt-4 md:px-14">
      <div className="mx-auto max-w-[1400px]">
        <form
          onSubmit={handleSubmit}
          aria-labelledby={`${fieldId}-heading`}
          className="rounded-md border border-[#050E1C]/15 bg-white p-4 shadow-[0_2px_10px_-6px_rgba(5,14,28,0.35)] md:max-w-[640px] md:p-5"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#C8102E]">
            Not sure what fits?
          </p>
          <h2
            id={`${fieldId}-heading`}
            className="font-display mt-1 text-[24px] font-bold tracking-[-0.02em] text-[#050E1C]"
          >
            Start from your boat.
          </h2>
          <p className="mt-1.5 text-[14px] leading-snug text-[#050E1C]/70">
            Tell us what you have. We'll show the Mercurys that fit.
          </p>

          <div className="mt-4">
            <label className={labelClass} htmlFor={`${fieldId}-type`}>
              Boat type
            </label>
            <select
              id={`${fieldId}-type`}
              value={boatType}
              onChange={(event) => setBoatType(event.target.value)}
              className={inputClass}
            >
              {BOAT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor={`${fieldId}-length`}>
                Length (feet)
              </label>
              <input
                id={`${fieldId}-length`}
                type="number"
                inputMode="decimal"
                min={1}
                step="0.5"
                placeholder="16"
                value={length}
                onChange={(event) => setLength(event.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor={`${fieldId}-max-hp`}>
                Max HP on plate
              </label>
              <input
                id={`${fieldId}-max-hp`}
                type="number"
                inputMode="decimal"
                min={catalogMinHp}
                max={catalogMaxHp}
                step="0.5"
                aria-required="true"
                placeholder="60"
                value={maxHp}
                onChange={(event) => {
                  setMaxHp(event.target.value);
                  if (error) setError(null);
                }}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${fieldId}-error` : undefined}
                className={inputClass}
              />
            </div>
          </div>

          {error && (
            <p
              id={`${fieldId}-error`}
              role="alert"
              className="mt-2 text-[13px] font-medium text-[#9A0C24]"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[4px] bg-repower-mercury-red px-6 text-[12px] font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-repower-mercury-red-deep"
          >
            Show motors that fit
            <span aria-hidden="true">→</span>
          </button>

          <p className="mt-3 text-center text-[13px] leading-snug text-[#050E1C]/65">
            Not sure?{' '}
            <a
              href={`sms:${SMS_DIGITS}`}
              className="underline underline-offset-2 hover:text-[#050E1C]"
            >
              Text us a photo of your capacity plate or transom
            </a>{' '}
            and we'll help.
          </p>
        </form>

        <div className="mt-4 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-[#050E1C]/10" />
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#050E1C]/50">
            or pick by horsepower
          </span>
          <span className="h-px flex-1 bg-[#050E1C]/10" />
        </div>
      </div>
    </section>
  );
}

export default StartFromYourBoat;
