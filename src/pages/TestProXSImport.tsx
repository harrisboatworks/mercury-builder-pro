import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function TestProXSImport() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const testPricelistImport = async () => {
    setIsLoading(true);
    setResults(null);
    
    try {
      console.log('Testing pricelist import with ProXS detection...');
      
      const { data, error } = await supabase.functions.invoke('seed-from-pricelist', {
        body: {
          price_list_url: 'https://www.harrisboatworks.ca/mercurypricelist',
          dry_run: true, // Don't actually update the database
          force: true
        }
      });

      if (error) {
        console.error('Import error:', error);
        toast({
          title: "Import Failed",
          description: error.message || "Unknown error occurred",
          variant: "destructive",
        });
        return;
      }

      console.log('Import results:', data);
      setResults(data);
      
      toast({
        title: "Test Completed",
        description: `Found ${data?.rows_analyzed || 0} motors, ${data?.would_create || 0} would be created`,
      });
      
    } catch (error) {
      console.error('Test failed:', error);
      toast({
        title: "Test Failed", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkCurrentProXS = async () => {
    try {
      const { data, error } = await supabase
        .from('motor_models')
        .select('model_display, model, horsepower')
        .eq('is_brochure', true)
        .or('model.eq.Pro XS,model_display.ilike.%proxs%,model_display.ilike.%pro xs%')
        .limit(20);

      if (error) throw error;
      
      console.log('Current ProXS models:', data);
      toast({
        title: "Current ProXS Count",
        description: `Found ${data.length} ProXS models in database`,
      });
      
    } catch (error) {
      console.error('Failed to check ProXS models:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ProXS Import Testing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={testPricelistImport}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Test Pricelist Import (Dry Run)
            </Button>
            
            <Button 
              variant="outline" 
              onClick={checkCurrentProXS}
            >
              Check Current ProXS Models
            </Button>
          </div>

          {results && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold">Import Test Results:</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{results.rows_analyzed || 0}</div>
                    <div className="text-sm text-muted-foreground">Rows Analyzed</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{results.would_create || 0}</div>
                    <div className="text-sm text-muted-foreground">Would Create</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{results.would_update || 0}</div>
                    <div className="text-sm text-muted-foreground">Would Update</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{results.skipped || 0}</div>
                    <div className="text-sm text-muted-foreground">Skipped</div>
                  </CardContent>
                </Card>
              </div>

              {results.sample_new_rows && results.sample_new_rows.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Sample New Motors Found:</h4>
                  <div className="space-y-2">
                    {results.sample_new_rows.slice(0, 10).map((motor: any, index: number) => (
                      <div key={index} className="p-2 border rounded text-sm">
                        <div className="font-medium">{motor.model_display}</div>
                        <div className="text-muted-foreground">
                          Model: {motor.model} | HP: {motor.horsepower} | Price: ${motor.dealer_price}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.skip_reasons && (
                <div>
                  <h4 className="font-semibold mb-2">Skip Reasons:</h4>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                    {JSON.stringify(results.skip_reasons, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}