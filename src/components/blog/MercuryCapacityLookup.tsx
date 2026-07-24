import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { mercuryOutboardCapacities } from '@/data/mercuryOutboardCapacities';

type HorsepowerBand = 'all' | 'portable' | 'midrange' | 'high';

const bands: Array<{ value: HorsepowerBand; label: string }> = [
  { value: 'all', label: 'All horsepower' },
  { value: 'portable', label: '2.5-30 HP' },
  { value: 'midrange', label: '35-115 HP' },
  { value: 'high', label: '150-600 HP' },
];

function firstHorsepower(model: string): number {
  const match = model.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function matchesBand(model: string, band: HorsepowerBand): boolean {
  if (band === 'all') return true;
  const hp = firstHorsepower(model);
  if (band === 'portable') return hp <= 30;
  if (band === 'midrange') return hp > 30 && hp <= 115;
  return hp > 115;
}

function formatGearcaseCapacity(value: string): string {
  if (value === 'None' || value === 'Not listed') return value;
  return `${value} oz`;
}

export function MercuryCapacityLookup() {
  const [query, setQuery] = useState('');
  const [band, setBand] = useState<HorsepowerBand>('all');

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return mercuryOutboardCapacities.filter((row) => {
      if (!matchesBand(row.model, band)) return false;
      if (!needle) return true;
      return [
        row.model,
        row.year,
        row.notes,
        row.crankcaseQt,
        row.crankcaseL,
        row.gearcaseOz,
        row.crankcaseOil,
        row.gearLube,
        row.oilFilter,
      ].some((value) => value.toLowerCase().includes(needle));
    });
  }, [band, query]);

  return (
    <section
      aria-labelledby="mercury-capacity-lookup-heading"
      className="not-prose my-8 overflow-hidden rounded-2xl border border-repower-navy-900/15 bg-white shadow-sm"
    >
      <div className="bg-repower-navy-900 px-5 py-6 text-white sm:px-7">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-repower-mercury-red">
          HBW reference lookup
        </p>
        <h2 id="mercury-capacity-lookup-heading" className="text-2xl font-bold sm:text-3xl">
          Find Your Mercury Oil Capacities
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/80">
          Search by horsepower, year, displacement, serial break, Verado, Pro XS, V6 or V8.
          These are Mercury reference capacities. The dipstick and the manual for your serial
          number decide the final fill.
        </p>
      </div>

      <div className="space-y-4 border-b border-repower-navy-900/10 bg-repower-navy-900/[0.035] px-5 py-5 sm:px-7">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-repower-navy-900">
            Search the chart
          </span>
          <span className="relative block">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-repower-navy-900/45"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try 9.9, 2B094996, 200 V8, or 350 Verado"
              className="w-full rounded-xl border border-repower-navy-900/20 bg-white py-3 pl-11 pr-4 text-base text-repower-navy-900 outline-none transition placeholder:text-repower-navy-900/45 focus:border-repower-mercury-red focus:ring-2 focus:ring-repower-mercury-red/20"
            />
          </span>
        </label>

        <div aria-label="Filter by horsepower" className="flex flex-wrap gap-2">
          {bands.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setBand(item.value)}
              aria-pressed={band === item.value}
              className={
                band === item.value
                  ? 'rounded-full bg-repower-mercury-red px-4 py-2 text-sm font-semibold text-white'
                  : 'rounded-full border border-repower-navy-900/15 bg-white px-4 py-2 text-sm font-semibold text-repower-navy-900 transition hover:border-repower-navy-900/35'
              }
            >
              {item.label}
            </button>
          ))}
        </div>

        <p aria-live="polite" className="text-sm text-repower-navy-900/65">
          Showing {rows.length} of {mercuryOutboardCapacities.length} model and year entries
        </p>
      </div>

      {rows.length ? (
        <>
          <div className="divide-y divide-repower-navy-900/10 md:hidden">
            {rows.map((row) => (
              <article
                key={`${row.model}-${row.year}-${row.notes}`}
                className="space-y-3 px-5 py-5"
              >
                <div>
                  <h3 className="text-lg font-bold text-repower-navy-900">{row.model}</h3>
                  <p className="text-sm font-semibold text-repower-mercury-red">{row.year}</p>
                  <p className="mt-1 text-sm text-repower-navy-900/65">{row.notes}</p>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div>
                    <dt className="text-repower-navy-900/55">Crankcase</dt>
                    <dd className="font-semibold text-repower-navy-900">
                      {row.crankcaseQt} qt / {row.crankcaseL} L
                    </dd>
                  </div>
                  <div>
                    <dt className="text-repower-navy-900/55">Gearcase</dt>
                    <dd className="font-semibold text-repower-navy-900">
                      {formatGearcaseCapacity(row.gearcaseOz)}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-repower-navy-900/55">Crankcase oil</dt>
                    <dd className="font-semibold text-repower-navy-900">{row.crankcaseOil}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-repower-navy-900/55">Oil filter</dt>
                    <dd className="font-mono font-semibold text-repower-navy-900">{row.oilFilter}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-repower-navy-900/[0.055] text-xs uppercase tracking-wide text-repower-navy-900/70">
                <tr>
                  <th className="px-4 py-3">Model / HP</th>
                  <th className="px-4 py-3">Year and identifier</th>
                  <th className="px-4 py-3 text-right">Crankcase</th>
                  <th className="px-4 py-3 text-right">Gearcase</th>
                  <th className="px-4 py-3">Oil</th>
                  <th className="px-4 py-3">Oil filter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-repower-navy-900/10">
                {rows.map((row) => (
                  <tr key={`${row.model}-${row.year}-${row.notes}`} className="align-top">
                    <th className="whitespace-nowrap px-4 py-4 font-bold text-repower-navy-900">
                      {row.model}
                    </th>
                    <td className="min-w-52 px-4 py-4">
                      <span className="font-semibold text-repower-mercury-red">{row.year}</span>
                      <span className="mt-1 block text-repower-navy-900/65">{row.notes}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right font-semibold text-repower-navy-900">
                      {row.crankcaseQt} qt
                      <span className="block text-xs font-normal text-repower-navy-900/55">
                        {row.crankcaseL} L
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right font-semibold text-repower-navy-900">
                      {formatGearcaseCapacity(row.gearcaseOz)}
                    </td>
                    <td className="min-w-48 px-4 py-4 text-repower-navy-900">
                      {row.crankcaseOil}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-mono font-semibold text-repower-navy-900">
                      {row.oilFilter}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="px-5 py-10 text-center sm:px-7">
          <p className="font-semibold text-repower-navy-900">No matching entry</p>
          <p className="mt-1 text-sm text-repower-navy-900/60">
            Try a horsepower, displacement, family name or serial break.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setBand('all');
            }}
            className="mt-4 rounded-lg bg-repower-navy-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Clear filters
          </button>
        </div>
      )}

      <div className="border-t border-repower-navy-900/10 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950 sm:px-7">
        <strong>Before filling:</strong> match the engine family, model year, displacement,
        gearcase and serial break. Capacities are approximate. Fill and verify using the exact
        Mercury manual and the engine dipstick.
      </div>
    </section>
  );
}
