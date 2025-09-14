import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DataSource {
  id: string;
  name: string;
  base_url: string;
  is_active: boolean;
  last_scraped: string | null;
  success_rate: number;
}

interface InventoryComparison {
  source: string;
  url: string;
  status: 'success' | 'error' | 'pending';
  motorsFound: number;
  inStockCount: number;
  error?: string;
}

export function InventoryDiagnostics() {
  const [loading, setLoading] = useState(false);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [comparison, setComparison] = useState<InventoryComparison[]>([]);
  const [syncStatus, setSyncStatus] = useState<string>('');

  const fetchDataSources = async () => {
    const { data, error } = await supabase
      .from('motor_data_sources')
      .select('*')
      .order('name');
    
    if (error) {
      toast.error('Failed to fetch data sources: ' + error.message);
      return;
    }
    
    setDataSources(data || []);
  };

  const triggerInventorySync = async () => {
    try {
      setLoading(true);
      setSyncStatus('Starting inventory sync...');
      
      const { data, error } = await supabase.functions.invoke('scrape-inventory', {
        body: { 
          trigger: 'manual-diagnostic',
          timestamp: new Date().toISOString(),
          debug: true
        }
      });

      if (error) {
        setSyncStatus(`Sync error: ${error.message}`);
        toast.error('Sync failed: ' + error.message);
      } else {
        setSyncStatus('Sync completed successfully');
        toast.success('Inventory sync completed');
        
        // Refresh data after sync
        await fetchDataSources();
        await analyzeInventory();
      }
    } catch (err: any) {
      setSyncStatus(`Sync error: ${err.message}`);
      toast.error('Sync failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const analyzeInventory = async () => {
    try {
      setSyncStatus('Analyzing current inventory...');
      
      const { data: motorsData, error } = await supabase
        .from('motor_models')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const analysis = {
        total: motorsData?.length || 0,
        inStock: motorsData?.filter(m => m.availability === 'In Stock').length || 0,
        brochure: motorsData?.filter(m => m.availability === 'Brochure').length || 0,
        sold: motorsData?.filter(m => m.availability === 'Sold').length || 0,
        excluded: motorsData?.filter(m => m.availability === 'Exclude').length || 0,
        lastUpdate: motorsData?.[0]?.updated_at || null
      };

      setSyncStatus(`Analysis complete: ${analysis.total} total motors, ${analysis.inStock} in stock`);
      
      // Create comparison data
      const comparisonData: InventoryComparison[] = [
        {
          source: 'Database',
          url: 'Internal',
          status: 'success',
          motorsFound: analysis.total,
          inStockCount: analysis.inStock
        },
        {
          source: 'Harris Boat Works (CA)',
          url: 'https://harrisboatworks.ca',
          status: 'pending',
          motorsFound: 0,
          inStockCount: 0
        }
      ];
      
      setComparison(comparisonData);
      
    } catch (err: any) {
      setSyncStatus(`Analysis error: ${err.message}`);
    }
  };

  const getStatusColor = (rate: number, lastScraped: string | null) => {
    if (!lastScraped) return 'destructive';
    if (rate >= 80) return 'default';
    if (rate >= 50) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Inventory Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button onClick={fetchDataSources} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data Sources
            </Button>
            <Button 
              onClick={triggerInventorySync} 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Manual Inventory Sync
            </Button>
            <Button onClick={analyzeInventory} variant="outline">
              Analyze Current Data
            </Button>
          </div>
          
          {syncStatus && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-700">{syncStatus}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Sources Status */}
      {dataSources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Data Sources Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dataSources.map((source) => (
                <div key={source.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{source.name}</h3>
                    <p className="text-sm text-gray-600">{source.base_url}</p>
                    <p className="text-xs text-gray-500">
                      Last scraped: {source.last_scraped ? new Date(source.last_scraped).toLocaleString() : 'Never'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(source.success_rate, source.last_scraped)}>
                      {source.success_rate}% success
                    </Badge>
                    {source.is_active ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Comparison */}
      {comparison.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Inventory Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {comparison.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{item.source}</h3>
                    <p className="text-sm text-gray-600">{item.url}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={item.status === 'success' ? 'default' : 'secondary'}>
                      {item.status}
                    </Badge>
                    <p className="text-sm">Total: {item.motorsFound}</p>
                    <p className="text-sm font-medium">In Stock: {item.inStockCount}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}