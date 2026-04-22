import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Clock, RefreshCw, Eye, Play, Users, Bell, BellOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MotorMatchReview } from "@/components/admin/MotorMatchReview";

interface SyncLog {
  id: string;
  sync_type: string;
  status: string;
  started_at: string;
  completed_at?: string;
  motors_processed: number;
  motors_in_stock: number;
  error_message?: string;
  details?: any;
}

interface StockUpdate {
  id: string;
  model_display: string;
  action: string;
  was_in_stock: boolean;
  now_in_stock: boolean;
  match_score: number;
  match_quality?: string;
  scraped_motor: string;
  new_stock_status?: boolean;
  new_quantity?: number;
  match_reason?: string;
}

interface PendingReview {
  scraped_motor_data: {
    name: string;
    source: string;
    hp?: number;
    family?: string;
    code?: string;
  };
  potential_matches: any[];
  confidence_score: number;
}

interface PreviewData {
  summary: {
    motors_processed: number;
    auto_matched: number;
    queued_for_review: number;
    rejected: number;
    newly_in_stock: number;
    newly_out_of_stock: number;
    stock_updates: StockUpdate[];
    pending_reviews: PendingReview[];
  };
  xml_motors_found: number;
  html_motors_found: number;
  changes_summary: {
    newly_in_stock: number;
    newly_out_of_stock: number;
    still_in_stock: number;
  };
  stock_updates: StockUpdate[];
}

export default function AdminStockSync() {
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showMatchReview, setShowMatchReview] = useState(false);
  const [pendingMatchesCount, setPendingMatchesCount] = useState(0);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [alertsToggleSaving, setAlertsToggleSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSyncLogs();
    fetchPendingMatchesCount();
    fetchAlertsToggle();
  }, []);

  const fetchAlertsToggle = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_sources')
        .select('value')
        .eq('key', 'lightspeed_alerts_enabled')
        .maybeSingle();
      if (error) throw error;
      // Missing row defaults to enabled
      setAlertsEnabled(!data || data.value !== 'false');
    } catch (error) {
      console.error('Error fetching alerts toggle:', error);
    }
  };

  const toggleAlerts = async (next: boolean) => {
    setAlertsToggleSaving(true);
    try {
      const { error } = await supabase
        .from('admin_sources')
        .upsert(
          { key: 'lightspeed_alerts_enabled', value: next ? 'true' : 'false', updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );
      if (error) throw error;
      setAlertsEnabled(next);
      toast({
        title: next ? 'SMS alerts enabled' : 'SMS alerts disabled',
        description: next
          ? 'You will receive SMS on Lightspeed sync failures and suspicious motor count drops.'
          : 'Lightspeed sync failure alerts are muted. Re-enable any time.',
      });
    } catch (error: any) {
      console.error('Error updating alerts toggle:', error);
      toast({
        title: 'Failed to update setting',
        description: error.message || 'Could not save the toggle.',
        variant: 'destructive',
      });
    } finally {
      setAlertsToggleSaving(false);
    }
  };

  const fetchPendingMatchesCount = async () => {
    try {
      const { count, error } = await supabase
        .from('pending_motor_matches')
        .select('*', { count: 'exact', head: true })
        .in('review_status', ['pending', 'no_match']);

      if (error) throw error;
      setPendingMatchesCount(count || 0);
    } catch (error) {
      console.error('Error fetching pending matches count:', error);
    }
  };

  const fetchSyncLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('sync_logs')
        .select('*')
        .eq('sync_type', 'stock')
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSyncLogs(data || []);
    } catch (error) {
      console.error('Error fetching sync logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch sync logs",
        variant: "destructive",
      });
    }
  };

  const runPreview = async () => {
    // Preview mode is no longer supported by the Lightspeed sync (it's an authoritative source).
    toast({
      title: "Preview not available",
      description: "Lightspeed sync runs as a direct authoritative update. Click Apply Sync to run.",
    });
  };

  const runSync = async () => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('sync-lightspeed-inventory', {
        body: { trigger: 'manual-admin' }
      });

      if (response.error) throw response.error;

      toast({
        title: "Lightspeed Sync Complete",
        description: `Matched ${response.data?.matched ?? 0} of ${response.data?.uniqueModels ?? 0} unique models from Lightspeed (${response.data?.totalUnitsAvailable ?? 0} units total)`,
      });

      // Refresh logs
      await fetchSyncLogs();
      setPreviewData(null);
      setShowPreview(false);
    } catch (error) {
      console.error('Error running sync:', error);
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to run Lightspeed sync",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'running':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Running</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMatchQualityColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stock Inventory Sync</h1>
          <p className="text-muted-foreground mt-1">
            Sync stock status from Lightspeed DMS (mercury_motor_inventory view)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={runPreview}
            disabled={loading}
            variant="outline"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview Changes
          </Button>
          <Button
            onClick={runSync}
            disabled={loading}
          >
            <Play className="w-4 h-4 mr-2" />
            Apply Sync
          </Button>
          <Button
            onClick={() => setShowMatchReview(true)}
            disabled={pendingMatchesCount === 0}
            variant="outline"
          >
            <Users className="w-4 h-4 mr-2" />
            Review Matches
            {pendingMatchesCount > 0 && (
              <Badge className="ml-2 bg-amber-100 text-amber-800">
                {pendingMatchesCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This sync pulls available new Mercury motors directly from Lightspeed DMS and updates stock status,
          quantity, and dealer pricing on existing motor records. It does not create new motors and skips any
          model marked as "Exclude".
        </AlertDescription>
      </Alert>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Stock Sync Preview</DialogTitle>
            <DialogDescription>
              Review the proposed changes before applying them
            </DialogDescription>
          </DialogHeader>
          
          {previewData && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {previewData.changes_summary.newly_in_stock}
                    </div>
                    <div className="text-sm text-muted-foreground">Newly In Stock</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-red-600">
                      {previewData.changes_summary.newly_out_of_stock}
                    </div>
                    <div className="text-sm text-muted-foreground">Newly Out of Stock</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {previewData.changes_summary.still_in_stock}
                    </div>
                    <div className="text-sm text-muted-foreground">Still In Stock</div>
                  </CardContent>
                </Card>
              </div>

              {/* Details Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Motor Model</TableHead>
                      <TableHead>Stock Status</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Match Quality</TableHead>
                      <TableHead>Match Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.stock_updates.slice(0, 50).map((update, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {update.model_display}
                        </TableCell>
                        <TableCell>
                          {update.new_stock_status ? (
                            <Badge className="bg-green-500">In Stock</Badge>
                          ) : (
                            <Badge variant="secondary">Out of Stock</Badge>
                          )}
                        </TableCell>
                        <TableCell>{update.new_quantity}</TableCell>
                        <TableCell>
                          <span className={getMatchQualityColor(update.match_score)}>
                            {Math.round(update.match_score * 100)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {update.match_reason}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {previewData.stock_updates.length > 50 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Showing first 50 of {previewData.stock_updates.length} updates
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Cancel
                </Button>
                <Button onClick={runSync} disabled={loading}>
                  Apply Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Recent Sync Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sync History</CardTitle>
        </CardHeader>
        <CardContent>
          {syncLogs.length === 0 ? (
            <p className="text-muted-foreground">No sync logs found</p>
          ) : (
            <div className="space-y-3">
              {syncLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusBadge(log.status)}
                    <div>
                      <div className="font-medium">
                        {log.motors_processed} motors processed, {log.motors_in_stock} in stock
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(log.started_at)}
                      </div>
                    </div>
                  </div>
                  {log.details && (
                    <div className="text-sm text-muted-foreground">
                      {log.details.xml_motors_found} XML motors → {log.details.matches_found} matches
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <MotorMatchReview
        isOpen={showMatchReview}
        onClose={() => setShowMatchReview(false)}
        onReviewComplete={() => {
          fetchPendingMatchesCount();
          fetchSyncLogs();
        }}
      />
    </div>
  );
}