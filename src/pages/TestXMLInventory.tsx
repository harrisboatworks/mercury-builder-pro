import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Database, Filter, CheckCircle, AlertCircle } from 'lucide-react';

interface InventoryResult {
  success: boolean;
  summary?: {
    source: string;
    motors_found: number;
    motors_hydrated: number;
    motors_inserted: number;
    timestamp: string;
  };
  error?: string;
}

export default function TestXMLInventory() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InventoryResult | null>(null);
  const { toast } = useToast();

  const testXMLInventory = async () => {
    setLoading(true);
    setResult(null);

    try {
      toast({
        title: "Testing XML inventory scraper...",
        description: "This will fetch Mercury motors from the XML feed",
      });

      const { data, error } = await supabase.functions.invoke('scrape-inventory', {
        body: { 
          source: 'xml',
          useXmlFeed: true,
          trigger: 'xml-test',
          at: new Date().toISOString() 
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      setResult(data);

      if (data.success) {
        toast({
          title: "XML inventory test completed",
          description: `Found ${data.summary?.motors_found || 0} Mercury motors using ${data.summary?.source} source`,
        });
      } else {
        toast({
          title: "XML inventory test failed",
          description: data.error || "Unknown error occurred",
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('XML inventory test failed:', error);
      setResult({
        success: false,
        error: error.message
      });
      
      toast({
        title: "Test failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">XML Inventory Scraper Test</h1>
          <p className="text-muted-foreground">
            Test the new XML-based inventory scraping that filters only Mercury outboard motors
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              XML Feed Inventory Test
            </CardTitle>
            <CardDescription>
              This test will fetch the complete XML inventory feed from Harris Boat Works and 
              filter it to include only new Mercury outboard motors (excluding boats, pontoons, 
              trailers, and other non-motor items).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={testXMLInventory} 
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Testing XML Scraper...' : 'Test XML Inventory Scraper'}
              </Button>
            </div>

            {result && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <h3 className="text-lg font-semibold">
                    {result.success ? 'Test Successful' : 'Test Failed'}
                  </h3>
                </div>

                {result.success && result.summary && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Badge variant="outline" className="mb-2">
                            <Filter className="h-4 w-4 mr-1" />
                            Data Source
                          </Badge>
                          <p className="text-2xl font-bold text-primary">
                            {result.summary.source.toUpperCase()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm font-medium text-muted-foreground">Motors Found</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {result.summary.motors_found}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm font-medium text-muted-foreground">Motors Processed</p>
                          <p className="text-2xl font-bold text-green-600">
                            {result.summary.motors_hydrated}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm font-medium text-muted-foreground">Motors Inserted</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {result.summary.motors_inserted}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {result.error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800">
                      <strong>Error:</strong> {result.error}
                    </p>
                  </div>
                )}

                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                    View Raw Response
                  </summary>
                  <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            )}

            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>What this test does:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Fetches the complete XML inventory feed from Harris Boat Works</li>
                <li>Parses the XML structure to extract all inventory items</li>
                <li>Applies intelligent filtering to include only Mercury outboard motors</li>
                <li>Excludes boats, pontoons, trailers, parts, and accessories</li>
                <li>Processes motor data with specifications and images</li>
                <li>Updates the motor_models table with filtered results</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}