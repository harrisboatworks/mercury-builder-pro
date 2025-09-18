import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, DollarSign, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function PriceUpdater() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const updatePricing = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('Triggering motor price scraping...');
      
      const { data, error } = await supabase.functions.invoke('scrape-motor-prices', {
        body: { enhanced: true }
      });
      
      if (error) {
        throw error;
      }
      
      setResult(data);
      toast.success('Motor pricing updated successfully!');
      
      // Refresh the page to show updated prices
      setTimeout(() => window.location.reload(), 2000);
      
    } catch (err: any) {
      console.error('Price update error:', err);
      toast.error('Failed to update pricing: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 mb-4 bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
            Missing Pricing Data
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
            Motors are missing pricing information. Click below to update pricing for all motors.
          </p>
          <Button 
            onClick={updatePricing}
            disabled={loading}
            size="sm"
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <DollarSign className="h-4 w-4" />
            )}
            {loading ? 'Updating Prices...' : 'Update Motor Pricing'}
          </Button>
          
          {result && (
            <div className="mt-3 p-2 bg-green-100 dark:bg-green-900/20 rounded text-sm">
              <p className="text-green-800 dark:text-green-200">
                ✅ Updated {result.totalMotorsNowPriced || 0} motors with pricing
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}