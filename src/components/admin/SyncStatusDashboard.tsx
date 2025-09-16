import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Zap, RefreshCw, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

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

export function SyncStatusDashboard() {
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [stats, setStats] = useState<SyncStats>({
    totalSyncs: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    averageMotorsProcessed: 0,
    lastSuccessful: null,
    lastFailed: null
  });
  const [loading, setLoading] = useState(true);
  const [syncInProgress, setSyncInProgress] = useState(false);

  async function fetchSyncLogs() {
    try {
      const { data: logsData, error } = await supabase
        .from('sync_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setSyncLogs(logsData || []);

      // Calculate stats
      const logs = logsData || [];
      const completed = logs.filter(log => log.status === 'completed');
      const failed = logs.filter(log => log.status === 'failed');
      const avgProcessed = completed.length > 0 
        ? completed.reduce((sum, log) => sum + (log.motors_processed || 0), 0) / completed.length
        : 0;

      setStats({
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
      setLoading(false);
    }
  }

  async function triggerManualSync() {
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
      
      // Refresh logs
      await fetchSyncLogs();
      
    } catch (error) {
      console.error('Error triggering manual sync:', error);
      toast.error(`Manual sync failed: ${error.message}`);
    } finally {
      setSyncInProgress(false);
    }
  }

  useEffect(() => {
    fetchSyncLogs();
    
    // Set up real-time subscription for sync logs
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

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Syncs</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSyncs}</div>
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
              {stats.totalSyncs > 0 ? Math.round((stats.successfulSyncs / stats.totalSyncs) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.successfulSyncs} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processed</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageMotorsProcessed}</div>
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
              {stats.lastSuccessful 
                ? formatDistanceToNow(new Date(stats.lastSuccessful), { addSuffix: true })
                : 'Never'
              }
            </div>
            <p className="text-xs text-muted-foreground">Most recent</p>
          </CardContent>
        </Card>
      </div>

      {/* Manual Sync Button */}
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

      {/* Sync Logs */}
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
    </div>
  );
}