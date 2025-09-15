import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function TestScraper() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runScraper = async () => {
    setLoading(true);
    setResults(null);
    try {
      console.log('🚀 Triggering Mercury scraper with fixes...');
      
      const { data, error } = await supabase.functions.invoke('scrape-inventory-v2', {
        body: { 
          batch_size: 5,  // Smaller batch for testing
          debug: true 
        }
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
        <button 
          onClick={runScraper}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Running Scraper...' : 'Run Mercury Scraper'}
        </button>

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