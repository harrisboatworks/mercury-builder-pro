import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestPriceScraping() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testPriceScraping = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Calling scrape-motor-prices function...');
      
      const { data, error } = await supabase.functions.invoke('scrape-motor-prices', {
        body: { test: true }
      });

      if (error) {
        console.error('Function error:', error);
        setError(error.message || 'Unknown error occurred');
      } else {
        console.log('Function result:', data);
        setResult(data);
      }
    } catch (err) {
      console.error('Catch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const checkMotorPrices = async () => {
    try {
      const { data: motors, error } = await supabase
        .from('motor_models')
        .select('id, model, horsepower, base_price')
        .or('base_price.is.null,base_price.eq.0')
        .limit(10);

      if (error) {
        setError(error.message);
      } else {
        console.log('Motors without prices:', motors);
        setResult({ motorsWithoutPrices: motors });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Price Scraping</CardTitle>
          <CardDescription>
            Test the motor price scraping functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={testPriceScraping} 
              disabled={loading}
            >
              {loading ? 'Testing...' : 'Test Price Scraping'}
            </Button>
            <Button 
              onClick={checkMotorPrices} 
              variant="outline"
            >
              Check Motors Without Prices
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive rounded-md">
              <p className="text-destructive font-medium">Error:</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {result && (
            <div className="p-4 bg-muted rounded-md">
              <p className="font-medium mb-2">Result:</p>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}