import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlayCircle, RefreshCw } from 'lucide-react';

interface CronJobStatus {
  jobname: string;
  schedule: string;
  active: boolean;
  last_run: string | null;
}

interface CronJobLog {
  id: string;
  job_name: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  result: any;
  error_message: string | null;
  motors_found: number;
  motors_updated: number;
}

export function CronJobMonitor() {
  const [cronStatus, setCronStatus] = useState<CronJobStatus | null>(null);
  const [cronLogs, setCronLogs] = useState<CronJobLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [testRunning, setTestRunning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCronStatus();
    fetchCronLogs();
  }, []);

  const fetchCronStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('get_cron_job_status');
      if (error) throw error;
      setCronStatus(data?.[0] || null);
    } catch (error) {
      console.error('Error fetching cron status:', error);
      toast({
        title: "Error",
        description: "Failed to fetch cron job status",
        variant: "destructive",
      });
    }
  };

  const fetchCronLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('cron_job_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setCronLogs(data || []);
    } catch (error) {
      console.error('Error fetching cron logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const runManualTest = async () => {
    setTestRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-mercury-inventory', {
        body: { manual_test: true, dry_run: false }
      });

      if (error) throw error;

      toast({
        title: "Manual Test Started",
        description: "Mercury inventory sync is running manually",
      });

      // Refresh logs after a delay
      setTimeout(() => {
        fetchCronLogs();
        fetchCronStatus();
      }, 2000);

    } catch (error) {
      console.error('Manual test failed:', error);
      toast({
        title: "Manual Test Failed",
        description: error.message || "Failed to start manual test",
        variant: "destructive",
      });
    } finally {
      setTestRunning(false);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([fetchCronStatus(), fetchCronLogs()]);
    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cron Job Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Mercury Inventory Sync - Daily Schedule</CardTitle>
            <CardDescription>
              Automated daily sync at 8:00 AM EST (13:00 UTC)
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={refreshData} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={runManualTest} 
              disabled={testRunning}
              size="sm"
            >
              {testRunning ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <PlayCircle className="w-4 h-4 mr-2" />
              )}
              Manual Test
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {cronStatus ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium">Status</p>
                <Badge variant={cronStatus.active ? "default" : "secondary"}>
                  {cronStatus.active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Schedule</p>
                <p className="text-sm text-muted-foreground">{cronStatus.schedule}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Last Run</p>
                <p className="text-sm text-muted-foreground">
                  {cronStatus.last_run 
                    ? new Date(cronStatus.last_run).toLocaleString()
                    : "Never"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Next Run</p>
                <p className="text-sm text-muted-foreground">Daily 8:00 AM EST</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No cron job found</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Runs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sync Runs</CardTitle>
          <CardDescription>
            Last 10 inventory sync executions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cronLogs.length > 0 ? (
            <div className="space-y-4">
              {cronLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={
                        log.status === 'completed' ? 'default' :
                        log.status === 'failed' ? 'destructive' : 'secondary'
                      }>
                        {log.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(log.started_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm">
                      Motors Found: {log.motors_found} | Updated: {log.motors_updated}
                    </div>
                    {log.error_message && (
                      <div className="text-sm text-destructive mt-1">
                        Error: {log.error_message}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {log.completed_at ? (
                      `Duration: ${Math.round(
                        (new Date(log.completed_at).getTime() - new Date(log.started_at).getTime()) / 1000
                      )}s`
                    ) : (
                      "Running..."
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No sync runs recorded yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}