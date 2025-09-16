import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Search, 
  Loader2, 
  Zap, 
  Clock, 
  TrendingUp, 
  XCircle,
  Activity,
  Edit,
  Trash2,
  ChevronDown,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { MotorManualOverride } from './MotorManualOverride';

// Interfaces
interface MotorInventoryData {
  id: string;
  model: string;
  model_display: string;
  model_number: string | null;
  horsepower: number;
  availability: string;
  stock_number: string | null;
  last_scraped: string | null;
  dealer_price: number | null;
  msrp: number | null;
  sale_price: number | null;
}

interface InventoryStats {
  total: number;
  inStock: number;
  brochure: number;
  sold: number;
  excluded: number;
  withStockNumbers: number;
  withoutStockNumbers: number;
  lastUpdate: string | null;
}

interface SyncLog {
  id: string;
  sync_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  motors_processed: number;
  motors_in_stock: number;
  error_message: string | null;
  details: any;
}

interface SyncStats {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  averageMotorsProcessed: number;
  lastSuccessful: string | null;
  lastFailed: string | null;
}

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

export function UnifiedInventoryDashboard() {
  // Live Inventory State
  const [motors, setMotors] = useState<MotorInventoryData[]>([]);
  const [inventoryStats, setInventoryStats] = useState<InventoryStats | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('all');
  
  // Enhanced Motor Management State
  const [selectedMotors, setSelectedMotors] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [editingMotor, setEditingMotor] = useState<string | null>(null);
  const [motorActions, setMotorActions] = useState<{ [key: string]: boolean }>({});

  // Sync Status State
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [syncStats, setSyncStats] = useState<SyncStats>({
    totalSyncs: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    averageMotorsProcessed: 0,
    lastSuccessful: null,
    lastFailed: null
  });
  const [syncLoading, setSyncLoading] = useState(true);
  const [syncInProgress, setSyncInProgress] = useState(false);

  // Diagnostics State
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [comparison, setComparison] = useState<InventoryComparison[]>([]);
  const [syncStatus, setSyncStatus] = useState<string>('');

  const { toast: uiToast } = useToast();

  // Live Inventory Functions
  const fetchInventoryData = async () => {
    setInventoryLoading(true);
    try {
      const { data: motorsData, error: motorsError } = await supabase
        .from('motor_models')
        .select('id, model, model_display, model_number, horsepower, availability, stock_number, last_scraped, dealer_price, msrp, sale_price')
        .order('last_scraped', { ascending: false });

      if (motorsError) throw motorsError;

      setMotors(motorsData || []);

      const total = motorsData?.length || 0;
      const inStock = motorsData?.filter(m => m.availability === 'In Stock').length || 0;
      const brochure = motorsData?.filter(m => m.availability === 'Brochure').length || 0;
      const sold = motorsData?.filter(m => m.availability === 'Sold').length || 0;
      const excluded = motorsData?.filter(m => m.availability === 'Exclude').length || 0;
      const withStockNumbers = motorsData?.filter(m => m.stock_number).length || 0;
      const withoutStockNumbers = total - withStockNumbers;
      const lastUpdate = motorsData?.[0]?.last_scraped || null;

      setInventoryStats({
        total,
        inStock,
        brochure,
        sold,
        excluded,
        withStockNumbers,
        withoutStockNumbers,
        lastUpdate
      });
    } catch (error) {
      console.error('Error fetching inventory data:', error);
    } finally {
      setInventoryLoading(false);
    }
  };

  const triggerInventoryUpdate = async () => {
    setUpdating(true);
    try {
      uiToast({
        title: "Starting inventory update...",
        description: "This may take up to 60 seconds",
      });

      let result;
      try {
        console.log('Attempting API endpoint call...');
        const response = await fetch('/api/cron/update-inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          throw new Error(`API endpoint failed: ${response.status} ${response.statusText}`);
        }

        result = await response.json();
        if (!result.ok) {
          throw new Error(result.error || 'API endpoint returned error');
        }
      } catch (apiError) {
        console.warn('API endpoint failed, trying direct Supabase call:', apiError);
        
        let totalMotorsFound = 0;
        let totalMotorsSaved = 0;
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= 4) {
          const { data, error } = await supabase.functions.invoke('scrape-inventory', {
            body: { 
              trigger: 'manual-admin',
              page: page,
              at: new Date().toISOString() 
            },
          });

          if (error) break;

          if (data) {
            totalMotorsFound += data.motors_found || 0;
            totalMotorsSaved += data.motors_saved || 0;
            hasMore = data.hasMore && page < 4;
            
            uiToast({
              title: `Page ${page} complete`,
              description: `Found ${data.motors_found} motors (${totalMotorsFound} total so far)`,
            });
          }

          page++;
          if (hasMore) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        result = {
          ok: true,
          result: {
            inventory: {
              motors_found: totalMotorsFound,
              motors_saved: totalMotorsSaved,
              pages_processed: page - 1,
              summary: {
                motors_found: totalMotorsFound,
                motors_inserted: totalMotorsSaved,
                source: 'html-paginated'
              }
            },
            source: 'paginated-supabase'
          }
        };
      }

      const sourceUsed = result.result?.inventory?.summary?.source || result.result?.source || 'unknown';
      const motorsFound = result.result?.inventory?.summary?.motors_found || result.result?.inventory?.motors_found || 0;
      const motorsSaved = result.result?.inventory?.summary?.motors_inserted || result.result?.inventory?.motors_saved || 0;
      const pagesProcessed = result.result?.inventory?.pages_processed || 1;
      
      uiToast({
        title: "Inventory update completed",
        description: `Processed ${pagesProcessed} page(s), found ${motorsFound} motors, saved ${motorsSaved} to database using ${sourceUsed.toUpperCase()} source`,
      });

      await fetchInventoryData();
    } catch (error: any) {
      console.error('Inventory update failed:', error);
      uiToast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const updateMotorAvailability = async (motorId: string, availability: string) => {
    setMotorActions(prev => ({ ...prev, [motorId]: true }));
    try {
      const { error } = await supabase
        .from('motor_models')
        .update({ availability })
        .eq('id', motorId);
      
      if (error) throw error;
      
      uiToast({
        title: "Success",
        description: "Motor availability updated successfully",
      });
      
      fetchInventoryData();
    } catch (error) {
      console.error('Error updating motor availability:', error);
      uiToast({
        title: "Error",
        description: "Failed to update motor availability",
        variant: "destructive",
      });
    } finally {
      setMotorActions(prev => ({ ...prev, [motorId]: false }));
    }
  };

  // Enhanced Motor Management Functions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMotors(new Set(filteredMotors.map(m => m.id)));
    } else {
      setSelectedMotors(new Set());
    }
  };

  const handleSelectMotor = (motorId: string, checked: boolean) => {
    const updated = new Set(selectedMotors);
    if (checked) {
      updated.add(motorId);
    } else {
      updated.delete(motorId);
    }
    setSelectedMotors(updated);
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedMotors.size === 0) return;
    
    setBulkUpdating(true);
    try {
      const { error } = await supabase
        .from('motor_models')
        .update({ availability: newStatus })
        .in('id', Array.from(selectedMotors));
      
      if (error) throw error;
      
      uiToast({
        title: "Success",
        description: `Updated ${selectedMotors.size} motors to ${newStatus}`,
      });
      
      setSelectedMotors(new Set());
      fetchInventoryData();
    } catch (error) {
      console.error('Error updating motors:', error);
      uiToast({
        title: "Error",
        description: "Failed to update motors",
        variant: "destructive",
      });
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedMotors.size === 0) return;
    
    setBulkUpdating(true);
    try {
      const { error } = await supabase
        .from('motor_models')
        .delete()
        .in('id', Array.from(selectedMotors));
      
      if (error) throw error;
      
      uiToast({
        title: "Success",
        description: `Deleted ${selectedMotors.size} motors`,
      });
      
      setSelectedMotors(new Set());
      fetchInventoryData();
    } catch (error) {
      console.error('Error deleting motors:', error);
      uiToast({
        title: "Error",
        description: "Failed to delete motors",
        variant: "destructive",
      });
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleDeleteMotor = async (motorId: string) => {
    setMotorActions(prev => ({ ...prev, [motorId]: true }));
    try {
      const { error } = await supabase
        .from('motor_models')
        .delete()
        .eq('id', motorId);
      
      if (error) throw error;
      
      uiToast({
        title: "Success",
        description: "Motor deleted successfully",
      });
      
      fetchInventoryData();
    } catch (error) {
      console.error('Error deleting motor:', error);
      uiToast({
        title: "Error",
        description: "Failed to delete motor",
        variant: "destructive",
      });
    } finally {
      setMotorActions(prev => ({ ...prev, [motorId]: false }));
    }
  };

  // Sync Status Functions
  const fetchSyncLogs = async () => {
    try {
      const { data: logsData, error } = await supabase
        .from('sync_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setSyncLogs(logsData || []);

      const logs = logsData || [];
      const completed = logs.filter(log => log.status === 'completed');
      const failed = logs.filter(log => log.status === 'failed');
      const avgProcessed = completed.length > 0 
        ? completed.reduce((sum, log) => sum + (log.motors_processed || 0), 0) / completed.length
        : 0;

      setSyncStats({
        totalSyncs: logs.length,
        successfulSyncs: completed.length,
        failedSyncs: failed.length,
        averageMotorsProcessed: Math.round(avgProcessed),
        lastSuccessful: completed.length > 0 ? completed[0].completed_at : null,
        lastFailed: failed.length > 0 ? failed[0].completed_at : null
      });
    } catch (error) {
      console.error('Error fetching sync logs:', error);
      toast.error('Failed to fetch sync logs');
    } finally {
      setSyncLoading(false);
    }
  };

  const triggerManualSync = async () => {
    setSyncInProgress(true);
    
    try {
      toast.info('Starting manual Mercury inventory sync...');
      
      const { data, error } = await supabase.functions.invoke('sync-mercury-inventory');
      
      if (error) throw error;
      
      if (data?.success) {
        toast.success(`Sync completed! ${data.motors_in_stock}/${data.total_motors} motors in stock`);
      } else {
        throw new Error(data?.error || 'Sync failed');
      }
      
      await fetchSyncLogs();
    } catch (error) {
      console.error('Error triggering manual sync:', error);
      toast.error(`Manual sync failed: ${error.message}`);
    } finally {
      setSyncInProgress(false);
    }
  };

  // Diagnostics Functions
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
      setDiagnosticsLoading(true);
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
        
        await fetchDataSources();
        await analyzeInventory();
      }
    } catch (err: any) {
      setSyncStatus(`Sync error: ${err.message}`);
      toast.error('Sync failed: ' + err.message);
    } finally {
      setDiagnosticsLoading(false);
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

  // Initial data loading
  useEffect(() => {
    fetchInventoryData();
    fetchSyncLogs();
    
    const subscription = supabase
      .channel('sync_logs_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sync_logs'
      }, () => {
        fetchSyncLogs();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Helper Functions
  const filteredMotors = motors.filter(motor => {
    const matchesSearch = motor.model_display.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         motor.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         motor.horsepower.toString().includes(searchTerm) ||
                         (motor.model_number && motor.model_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (motor.stock_number && motor.stock_number.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesAvailability = selectedAvailability === 'all' || motor.availability === selectedAvailability;
    
    return matchesSearch && matchesAvailability;
  });

  const getAvailabilityBadgeVariant = (availability: string) => {
    switch (availability) {
      case 'In Stock': return 'default';
      case 'Brochure': return 'secondary';
      case 'Sold': return 'destructive';
      case 'Exclude': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600">Success</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'running':
        return <Badge className="bg-blue-600">Running</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusColor = (rate: number, lastScraped: string | null) => {
    if (!lastScraped) return 'destructive';
    if (rate >= 80) return 'default';
    if (rate >= 50) return 'secondary';
    return 'destructive';
  };

  return (
    <Tabs defaultValue="inventory" className="space-y-6">
      <TabsList>
        <TabsTrigger value="inventory">
          <Activity className="w-4 h-4 mr-2" />
          Live Inventory
        </TabsTrigger>
        <TabsTrigger value="sync">
          <Zap className="w-4 h-4 mr-2" />
          Sync Status
        </TabsTrigger>
        <TabsTrigger value="diagnostics">
          <AlertTriangle className="w-4 h-4 mr-2" />
          Diagnostics
        </TabsTrigger>
      </TabsList>

      {/* Live Inventory Tab */}
      <TabsContent value="inventory" className="space-y-6">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Optimized Operations:</strong> Cron jobs are now separated for better reliability. 
            Each operation runs independently with 50-second timeouts to prevent failures.
          </AlertDescription>
        </Alert>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Motors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventoryStats?.total || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">In Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{inventoryStats?.inStock || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Brochure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{inventoryStats?.brochure || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sold</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{inventoryStats?.sold || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">With Stock #</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventoryStats?.withStockNumbers || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Excluded</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-500">{inventoryStats?.excluded || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">No Stock #</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{inventoryStats?.withoutStockNumbers || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Inventory Management</CardTitle>
                <CardDescription>
                  Monitor and manage motor inventory status
                  {inventoryStats?.lastUpdate && (
                    <span className="block text-sm text-muted-foreground mt-1">
                      Last updated: {new Date(inventoryStats.lastUpdate).toLocaleString()}
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={triggerInventoryUpdate} disabled={inventoryLoading || updating}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${updating ? 'animate-spin' : ''}`} />
                  {updating ? 'Updating...' : 'Update Inventory'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, model number, HP, or stock number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={selectedAvailability} onValueChange={setSelectedAvailability}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="In Stock">In Stock</SelectItem>
                  <SelectItem value="Brochure">Brochure</SelectItem>
                  <SelectItem value="Sold">Sold</SelectItem>
                  <SelectItem value="Exclude">Exclude</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions */}
            {selectedMotors.size > 0 && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">
                  {selectedMotors.size} motor{selectedMotors.size !== 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2 ml-auto">
                  <Select onValueChange={handleBulkStatusChange}>
                    <SelectTrigger className="w-32" disabled={bulkUpdating}>
                      <SelectValue placeholder="Set Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="In Stock">In Stock</SelectItem>
                      <SelectItem value="Brochure">Brochure</SelectItem>
                      <SelectItem value="Sold">Sold</SelectItem>
                      <SelectItem value="Exclude">Exclude</SelectItem>
                    </SelectContent>
                  </Select>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={bulkUpdating}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Motors</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {selectedMotors.size} motor{selectedMotors.size !== 1 ? 's' : ''}? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button variant="outline" onClick={() => setSelectedMotors(new Set())}>
                    Clear Selection
                  </Button>
                </div>
              </div>
            )}

            {inventoryStats && inventoryStats.withoutStockNumbers > 0 && (
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {inventoryStats.withoutStockNumbers} motors are missing stock numbers. This may affect availability detection.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Motors List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Motors ({filteredMotors.length})</CardTitle>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedMotors.size === filteredMotors.length && filteredMotors.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">Select All</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredMotors.map((motor) => (
                <div key={motor.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <Checkbox
                    checked={selectedMotors.has(motor.id)}
                    onCheckedChange={(checked) => handleSelectMotor(motor.id, checked as boolean)}
                  />
                  
                  <div className="flex-1">
                    <div className="font-medium">{motor.model_display || motor.model}</div>
                    <div className="text-sm text-muted-foreground">
                      {motor.horsepower}HP • Model: {motor.model_number || 'N/A'} • Stock: {motor.stock_number || 'N/A'}
                    </div>
                    {motor.last_scraped && (
                      <div className="text-xs text-muted-foreground">
                        Last scraped: {new Date(motor.last_scraped).toLocaleString()}
                      </div>
                    )}
                    {(motor.dealer_price || motor.msrp || motor.sale_price) && (
                      <div className="text-xs text-muted-foreground">
                        {motor.dealer_price && `Dealer: $${motor.dealer_price.toLocaleString()}`}
                        {motor.msrp && ` • MSRP: $${motor.msrp.toLocaleString()}`}
                        {motor.sale_price && ` • Sale: $${motor.sale_price.toLocaleString()}`}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2"
                          disabled={motorActions[motor.id]}
                        >
                          <Badge variant={getAvailabilityBadgeVariant(motor.availability)} className="mr-1">
                            {motor.availability}
                          </Badge>
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => updateMotorAvailability(motor.id, 'In Stock')}>
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="h-4 text-xs">In Stock</Badge>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateMotorAvailability(motor.id, 'Brochure')}>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="h-4 text-xs">Brochure</Badge>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateMotorAvailability(motor.id, 'Sold')}>
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive" className="h-4 text-xs">Sold</Badge>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateMotorAvailability(motor.id, 'Exclude')}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="h-4 text-xs">Exclude</Badge>
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Action Buttons */}
                    <div className="flex gap-1">
                      <Dialog open={editingMotor === motor.id} onOpenChange={(open) => setEditingMotor(open ? motor.id : null)}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            title="Edit Motor"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
                          <DialogHeader>
                            <DialogTitle>Edit Motor Details</DialogTitle>
                            <DialogDescription>
                              Modify motor specifications, features, and pricing
                            </DialogDescription>
                          </DialogHeader>
                          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                            {editingMotor && (
                              <MotorManualOverride 
                                motorId={editingMotor} 
                                onClose={() => setEditingMotor(null)}
                              />
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700"
                        onClick={() => updateMotorAvailability(motor.id, 'Exclude')}
                        disabled={motorActions[motor.id] || motor.availability === 'Exclude'}
                        title="Exclude Motor"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
                            disabled={motorActions[motor.id]}
                            title="Delete Motor"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Motor</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{motor.model_display || motor.model}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteMotor(motor.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    {motorActions[motor.id] && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </div>
              ))}
              {filteredMotors.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No motors found matching current filters
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Sync Status Tab */}
      <TabsContent value="sync" className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Syncs</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{syncStats.totalSyncs}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {syncStats.totalSyncs > 0 ? Math.round((syncStats.successfulSyncs / syncStats.totalSyncs) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {syncStats.successfulSyncs} successful
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Processed</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{syncStats.averageMotorsProcessed}</div>
              <p className="text-xs text-muted-foreground">Motors per sync</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Success</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {syncStats.lastSuccessful 
                  ? formatDistanceToNow(new Date(syncStats.lastSuccessful), { addSuffix: true })
                  : 'Never'
                }
              </div>
              <p className="text-xs text-muted-foreground">Most recent</p>
            </CardContent>
          </Card>
        </div>

        {/* Manual Sync Control */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Manual Sync Control</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Trigger an immediate Mercury inventory sync
                </p>
              </div>
              <Button 
                onClick={triggerManualSync}
                disabled={syncInProgress}
                className="bg-gradient-to-r from-primary to-primary-glow"
              >
                {syncInProgress ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="mr-2 h-4 w-4" />
                )}
                {syncInProgress ? 'Syncing...' : 'Sync Now'}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Sync History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Sync History</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchSyncLogs}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {syncLogs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No sync logs found
                </p>
              ) : (
                syncLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(log.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {formatDistanceToNow(new Date(log.started_at), { addSuffix: true })}
                          </span>
                          {getStatusBadge(log.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {log.status === 'completed' && (
                            <>Processed {log.motors_processed} motors, {log.motors_in_stock} in stock</>
                          )}
                          {log.status === 'failed' && log.error_message && (
                            <>Error: {log.error_message}</>
                          )}
                          {log.status === 'running' && <>Sync in progress...</>}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {log.completed_at ? (
                        <>
                          Completed {formatDistanceToNow(new Date(log.completed_at), { addSuffix: true })}
                        </>
                      ) : (
                        <>Started {formatDistanceToNow(new Date(log.started_at), { addSuffix: true })}</>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Diagnostics Tab */}
      <TabsContent value="diagnostics" className="space-y-6">
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
                disabled={diagnosticsLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {diagnosticsLoading ? (
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
      </TabsContent>
    </Tabs>
  );
}