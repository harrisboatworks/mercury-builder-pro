import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle, Zap } from 'lucide-react';

export default function TestEnhancedPricing() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const runEnhancedPricing = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      console.log('Triggering enhanced price scraping...');
      
      const { data, error } = await supabase.functions.invoke('scrape-motor-prices', {
        body: { enhanced: true }
      });
      
      if (error) {
        throw error;
      }
      
      setResult(data);
      console.log('Enhanced pricing result:', data);
      
    } catch (err: any) {
      console.error('Enhanced pricing error:', err);
      setError(err.message || 'Failed to run enhanced pricing');
    } finally {
      setLoading(false);
    }
  };

  const checkUnpricedMotors = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const { data, error } = await supabase
        .from('motor_models')
        .select('id, model, horsepower, motor_type, base_price')
        .or('base_price.is.null,base_price.eq.0')
        .order('horsepower', { ascending: true })
        .limit(20);
        
      if (error) throw error;
      
      setResult({
        type: 'unpriced_check',
        unpricedMotors: data,
        count: data?.length || 0
      });
      
    } catch (err: any) {
      setError(err.message || 'Failed to check unpriced motors');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Zap className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Enhanced Motor Pricing Test</h1>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Enhanced Backup Pricing</h2>
            <p className="text-muted-foreground mb-4">
              Run the improved pricing algorithm that strips configuration codes, applies feature markups, 
              and uses enhanced fallback estimates to price all motors.
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={runEnhancedPricing}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Run Enhanced Pricing
            </Button>
            
            <Button 
              variant="outline" 
              onClick={checkUnpricedMotors}
              disabled={loading}
            >
              Check Unpriced Motors
            </Button>
          </div>
        </div>
      </Card>

      {error && (
        <Card className="p-4 border-destructive">
          <div className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            <span className="font-medium">Error:</span>
            <span>{error}</span>
          </div>
        </Card>
      )}

      {result && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <h3 className="text-lg font-semibold">
              {result.type === 'unpriced_check' ? 'Unpriced Motors Check' : 'Enhanced Pricing Results'}
            </h3>
          </div>
          
          {result.type === 'unpriced_check' ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Found {result.count} motors without pricing:
              </p>
              <div className="max-h-64 overflow-y-auto">
                {result.unpricedMotors?.map((motor: any) => (
                  <div key={motor.id} className="flex justify-between items-center py-1 text-sm">
                    <span>{motor.model}</span>
                    <span className="text-muted-foreground">{motor.horsepower}HP {motor.motor_type}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm"><strong>Motors Scanned:</strong> {result.motorsScanned}</p>
                <p className="text-sm"><strong>Price Entries Found:</strong> {result.priceEntriesFound}</p>
                <p className="text-sm"><strong>Enhanced Matches:</strong> {result.enhancedMatches}</p>
                <p className="text-sm"><strong>Enhanced Fallbacks:</strong> {result.enhancedFallbacks}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm"><strong>Matches Applied:</strong> {result.enhancedMatchesApplied}</p>
                <p className="text-sm"><strong>Fallbacks Applied:</strong> {result.enhancedFallbacksApplied}</p>
                <p className="text-sm text-green-600"><strong>Total Motors Priced:</strong> {result.totalMotorsNowPriced}</p>
                <p className="text-sm"><strong>Still Unpriced:</strong> {result.stillUnpriced}</p>
              </div>
            </div>
          )}
          
          {result.errors && (
            <div className="mt-4 p-3 bg-destructive/10 rounded-md">
              <p className="text-sm font-medium text-destructive mb-2">Errors:</p>
              <div className="text-xs space-y-1">
                {result.errors.map((err: string, i: number) => (
                  <div key={i}>{err}</div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}