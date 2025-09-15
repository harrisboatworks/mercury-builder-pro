import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function TestScraper() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const runScraper = async (mode: 'discovery' | 'full', options?: { batch_size?: number; concurrency?: number }) => {
    setLoading(true);
    setResults(null);
    try {
      console.log(`🚀 Running Mercury ${mode} scraper...`);
      
      const body = mode === 'discovery' 
        ? { mode: 'discovery' }
        : { 
            mode: 'full',
            batch_size: options?.batch_size || 12,
            concurrency: options?.concurrency || 3
          };
      
      const { data, error } = await supabase.functions.invoke('scrape-inventory-v2', {
        body
      });
      
      if (error) {
        console.error('❌ Scraper error:', error);
        setResults({ 
          error: error.message,
          details: error 
        });
      } else {
        console.log('✅ Scraper success:', data);
        setResults({
          success: true,
          ...data
        });
      }
    } catch (err) {
      console.error('💥 Failed to run scraper:', err);
      setResults({ 
        error: `Network Error: ${err.message}`,
        type: 'network_error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Mercury Scraper Test</h1>
      
      <div className="space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <button 
            onClick={() => runScraper('discovery')}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Running Discovery...' : 'Run Discovery (XML-first)'}
          </button>
          
          <button 
            onClick={() => runScraper('full', { batch_size: 12, concurrency: 3 })}
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Running Full...' : 'Run Small Full (12/3)'}
          </button>
          
          <button 
            onClick={() => runScraper('full', { batch_size: 20, concurrency: 4 })}
            disabled={loading}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Running Full...' : 'Run Full (20/4)'}
          </button>
        </div>
        
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Full Scrape:</strong> Runs server-side via Supabase schedule daily at 5:00 AM EST to avoid timeout issues.
            For manual triggers, use the curl command in the project README.
          </p>
        </div>

        {results && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Results:</h2>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}