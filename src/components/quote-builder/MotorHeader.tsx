"use client";

type Props = {
  name: string;             // e.g., "Mercury FourStroke 25HP EFI"
  modelYear?: number;       // e.g., 2025
  hp?: number;              // 25
  sku?: string | null;
  imageUrl?: string | null;
  specs?: Array<{ label: string; value: string }>;
  why?: string[];           // 2–3 bullets
  specSheetUrl?: string | null;
};

export default function MotorHeader({
  name,
  modelYear,
  hp,
  sku,
  imageUrl,
  specs = [],
  why = [],
  specSheetUrl,
}: Props) {
  return (
    <section className="mb-6 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start gap-4">
        {imageUrl ? (
          <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
            <img src={imageUrl} alt={name} className="h-full w-full object-contain" />
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold leading-tight text-slate-900 dark:text-white">
            {name}
            {modelYear ? <span className="ml-2 text-slate-500 dark:text-slate-400">({modelYear})</span> : null}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {specs.map((s, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300"
                title={s.label}
              >
                <span className="mr-1 font-medium">{s.label}:</span> {s.value}
              </span>
            ))}
            {sku ? (
              <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-xs text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:ring-slate-700">
                SKU: {sku}
              </span>
            ) : null}
          </div>

          {why.length ? (
            <ul className="mt-3 space-y-1 text-sm text-slate-700 dark:text-slate-300">
              {why.slice(0, 3).map((w, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span aria-hidden className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400/80 dark:bg-slate-500" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {specSheetUrl ? (
            <div className="mt-3">
              <a
                href={specSheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary hover:underline"
              >
                View spec sheet (PDF)
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}