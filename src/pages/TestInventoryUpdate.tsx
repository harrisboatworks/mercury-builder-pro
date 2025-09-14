import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Play, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TestInventoryUpdate() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const runInventoryUpdate = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('Starting manual inventory update...');
      
      const { data, error } = await supabase.functions.invoke('scrape-inventory', {
        body: { 
          trigger: 'manual-test',
          at: new Date().toISOString()
        },
      });
      
      if (error) {
        throw error;
      }
      
      setResult(data);
      
      toast({
        title: "Inventory Update Complete",
        description: `Updated ${data?.motors_processed || 0} motors successfully`,
      });
      
    } catch (error) {
      console.error('Error updating inventory:', error);
      const errorMessage = (error as Error).message;
      
      setResult({ 
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "Inventory Update Failed", 
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Manual Inventory Update Test
          </CardTitle>
          <CardDescription>
            Test the duplicate detection fix by running a manual inventory scrape and update.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runInventoryUpdate}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Inventory Update...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Start Manual Inventory Update
              </>
            )}
          </Button>
          
          {result && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {result.error ? (
                    <>
                      <XCircle className="h-5 w-5 text-destructive" />
                      Update Failed
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Update Results
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Raw Response:</h4>
                  <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-96">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
                
                {result.summary && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-semibold">Summary:</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-muted/50 p-3 rounded">
                        <div className="font-medium">Motors Processed</div>
                        <div className="text-2xl font-bold text-primary">
                          {result.summary.motors_processed || 0}
                        </div>
                      </div>
                      <div className="bg-muted/50 p-3 rounded">
                        <div className="font-medium">In Stock Motors</div>
                        <div className="text-2xl font-bold text-green-600">
                          {result.summary.in_stock_count || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>What this test does:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Scrapes the latest inventory from Harris Boat Works</li>
              <li>Tests the new duplicate detection logic using stock numbers</li>
              <li>Shows detailed logging of the deduplication process</li>
              <li>Updates the motor_models table with fresh data</li>
              <li>Verifies that we get all 11+ in-stock motors correctly</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}