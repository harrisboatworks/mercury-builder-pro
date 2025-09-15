import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type DiscoveryOptions = {
  max_pages?: number;
  include_alts?: boolean;
  do_probe?: boolean;
  force_source?: 'xml' | 'pages' | undefined; // debug: tell function to prefer/fallback
};

type FullOptions = {
  batch_size?: number;
  concurrency?: number;
};

export default function TestScraper() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  // UI state for discovery run
  const [disc, setDisc] = useState<DiscoveryOptions>({
    max_pages: 3,
    include_alts: true,
    do_probe: true,
    force_source: undefined
  });

  // UI state for full run
  const [full, setFull] = useState<FullOptions>({ batch_size: 12, concurrency: 3 });

  const runScraper = async (
    mode: 'discovery' | 'full' | 'seed_brochure',
    overrides?: Partial<DiscoveryOptions & FullOptions>
  ) => {
    setLoading(true);
    setResults(null);
    try {
      console.log(`🚀 Running Mercury ${mode} scraper...`);

      const body =
        mode === 'discovery'
          ? {
              mode: 'discovery',
              max_pages: overrides?.max_pages ?? disc.max_pages ?? 3,
              include_alts: overrides?.include_alts ?? disc.include_alts ?? true,
              do_probe: overrides?.do_probe ?? disc.do_probe ?? true,
              force_source: overrides?.force_source ?? disc.force_source ?? 'auto'
            }
          : mode === 'seed_brochure'
          ? { mode: 'seed_brochure' }
          : {
              mode: 'full',
              batch_size: overrides?.batch_size ?? full.batch_size ?? 12,
              concurrency: overrides?.concurrency ?? full.concurrency ?? 3
            };

      const { data, error } = await supabase.functions.invoke('scrape-inventory-v2', { body });

      if (error) {
        console.error('❌ Scraper error:', error);
        setResults({ success: false, error: error.message, details: error });
      } else {
        console.log('✅ Scraper success:', data);
        setResults({ success: true, ...data });
      }
    } catch (err: any) {
      console.error('💥 Failed to run scraper:', err);
      setResults({ success: false, error: `Network Error: ${err?.message || String(err)}` });
    } finally {
      setLoading(false);
    }
  };

  const Badge = ({ children, tone = 'gray' }: { children: React.ReactNode; tone?: 'gray' | 'blue' | 'green' | 'purple' | 'yellow' | 'red' }) => {
    const map: any = {
      gray: 'bg-gray-100 text-gray-800',
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      purple: 'bg-purple-100 text-purple-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      red: 'bg-red-100 text-red-800'
    };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${map[tone]}`}>{children}</span>;
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Mercury Scraper Test</h1>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Discovery controls */}
        <div className="p-4 border rounded-lg">
          <h2 className="font-semibold mb-3">Discovery (XML-first)</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="block mb-1">max_pages</span>
              <input
                type="number"
                min={1}
                className="w-full border rounded px-3 py-2"
                value={disc.max_pages ?? 3}
                onChange={(e) => setDisc((s) => ({ ...s, max_pages: Number(e.target.value || 1) }))}
              />
            </label>
            <label className="text-sm">
              <span className="block mb-1">include_alts</span>
              <select
                className="w-full border rounded px-3 py-2"
                value={String(disc.include_alts)}
                onChange={(e) => setDisc((s) => ({ ...s, include_alts: e.target.value === 'true' }))}
              >
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="block mb-1">do_probe</span>
              <select
                className="w-full border rounded px-3 py-2"
                value={String(disc.do_probe)}
                onChange={(e) => setDisc((s) => ({ ...s, do_probe: e.target.value === 'true' }))}
              >
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="block mb-1">force_source (debug)</span>
              <select
                className="w-full border rounded px-3 py-2"
                value={disc.force_source ?? ''}
                onChange={(e) =>
                  setDisc((s) => ({
                    ...s,
                    force_source: (e.target.value || undefined) as 'xml' | 'pages' | undefined
                  }))
                }
              >
                <option value="">auto (default)</option>
                <option value="xml">xml</option>
                <option value="pages">pages</option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex gap-3 flex-wrap">
            <button
              onClick={() => runScraper('discovery')}
              disabled={loading}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Running…' : 'Run Discovery'}
            </button>

            <button
              onClick={() => runScraper('discovery', { force_source: 'xml' })}
              disabled={loading}
              className="px-5 py-2.5 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 disabled:opacity-50"
              title="Bypass page fallback to prove XML path works"
            >
              {loading ? 'Running…' : 'Force XML Discovery'}
            </button>

            <button
              onClick={() => runScraper('discovery', { force_source: 'pages' })}
              disabled={loading}
              className="px-5 py-2.5 bg-yellow-100 text-yellow-900 rounded-lg hover:bg-yellow-200 disabled:opacity-50"
              title="Force page crawling (for debugging only)"
            >
              {loading ? 'Running…' : 'Force Pages Discovery'}
            </button>
          </div>
        </div>

        {/* Full controls */}
        <div className="p-4 border rounded-lg">
          <h2 className="font-semibold mb-3">Full Scrape</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="block mb-1">batch_size</span>
              <input
                type="number"
                min={1}
                className="w-full border rounded px-3 py-2"
                value={full.batch_size ?? 12}
                onChange={(e) => setFull((s) => ({ ...s, batch_size: Number(e.target.value || 12) }))}
              />
            </label>
            <label className="text-sm">
              <span className="block mb-1">concurrency</span>
              <input
                type="number"
                min={1}
                max={8}
                className="w-full border rounded px-3 py-2"
                value={full.concurrency ?? 3}
                onChange={(e) => setFull((s) => ({ ...s, concurrency: Number(e.target.value || 3) }))}
              />
            </label>
          </div>

          <div className="mt-4 flex gap-3 flex-wrap">
            <button
              onClick={() => runScraper('full')}
              disabled={loading}
              className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Running…' : 'Run Small Full (12/3)'}
            </button>

            <button
              onClick={() => runScraper('full', { batch_size: 20, concurrency: 4 })}
              disabled={loading}
              className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Running…' : 'Run Full (20/4)'}
            </button>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-xs text-yellow-900">
              Daily server-side run at 5:00 AM (EST). Manual triggers available here and via curl in the README.
            </p>
          </div>
        </div>

        {/* Brochure Seeding */}
        <div className="p-4 border rounded-lg">
          <h2 className="font-semibold mb-3">Brochure Catalog</h2>
          <p className="text-sm text-gray-600 mb-4">
            Seed the database with the complete Mercury model lineup (brochure models)
          </p>
          
          <button
            onClick={() => runScraper('seed_brochure' as any)}
            disabled={loading}
            className="px-5 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? 'Running…' : 'Seed Brochure Catalog'}
          </button>
          
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded">
            <p className="text-xs text-orange-900">
              This adds ~35 Mercury models as brochure entries (is_brochure=true, in_stock=false)
            </p>
          </div>
        </div>
      </div>

      {/* Summary + Results */}
      {results && (
        <div className="mt-8 space-y-4">
          {/* Summary row */}
          <div className="flex flex-wrap gap-2 items-center">
            <Badge tone="blue">mode: {results.mode ?? 'n/a'}</Badge>
            {results.source && <Badge tone="purple">source: {results.source}</Badge>}
            {'urls_discovered' in results && <Badge tone="green">urls: {results.urls_discovered}</Badge>}
            {'total_units' in results && <Badge tone="gray">total_units: {results.total_units}</Badge>}
            {'filtered_units' in results && <Badge tone="gray">filtered_units: {results.filtered_units}</Badge>}
            {'motors_saved' in results && <Badge tone="green">saved: {results.motors_saved}</Badge>}
            {results.success === false && <Badge tone="red">error</Badge>}
          </div>

          {/* Samples */}
          {Array.isArray(results.samples) && results.samples.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Sample URLs</h3>
              <ul className="list-disc pl-6 text-sm">
                {results.samples.slice(0, 10).map((u: string, i: number) => (
                  <li key={i} className="truncate">
                    <a href={u} className="text-blue-600 underline" target="_blank" rel="noreferrer">
                      {u}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Raw JSON */}
          <div>
            <h3 className="font-semibold mb-2">Raw Response</h3>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-xs">{JSON.stringify(results, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}