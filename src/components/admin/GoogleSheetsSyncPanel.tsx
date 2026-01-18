import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, RefreshCw, Clock, AlertTriangle, HelpCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface GoogleSheetsConfig {
  id: string;
  sheet_url: string;
  sheet_gid: string | null;
  last_sync: string | null;
  auto_sync_enabled: boolean;
  sync_frequency: string;
}

interface SyncResult {
  success: boolean;
  motorsFound?: number;
  motorsMatched?: number;
  motorsUnmatched?: number;
  matched?: string[];
  unmatched?: string[];
  error?: string;
  sheetGid?: string;
}

export function GoogleSheetsSyncPanel() {
  const { toast } = useToast();
  const [config, setConfig] = useState<GoogleSheetsConfig | null>(null);
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetGid, setSheetGid] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('google_sheets_config')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setConfig(data as GoogleSheetsConfig);
        setSheetUrl(data.sheet_url);
        setSheetGid(data.sheet_gid || '');
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!sheetUrl.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a valid Google Sheets URL',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      if (config) {
        // Update existing
        const { error } = await supabase
          .from('google_sheets_config')
          .update({ 
            sheet_url: sheetUrl,
            sheet_gid: sheetGid.trim() || null,
          })
          .eq('id', config.id);

        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('google_sheets_config')
          .insert({ 
            sheet_url: sheetUrl,
            sheet_gid: sheetGid.trim() || null,
          })
          .select()
          .single();

        if (error) throw error;
        setConfig(data as GoogleSheetsConfig);
      }

      toast({
        title: 'Success',
        description: 'Google Sheets configuration saved',
      });

      await fetchConfig();
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: 'Error',
        description: 'Failed to save configuration',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerSync = async () => {
    if (!config) {
      toast({
        title: 'Error',
        description: 'Please save Google Sheets URL first',
        variant: 'destructive',
      });
      return;
    }

    setSyncing(true);
    setSyncResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('sync-google-sheets-inventory', {
        body: { 
          sheetUrl: config.sheet_url,
          sheetGid: config.sheet_gid || undefined,
        },
      });

      if (error) throw error;

      setSyncResult(data);

      if (data.success) {
        toast({
          title: 'Sync Complete',
          description: `Matched ${data.motorsMatched} of ${data.motorsFound} motors from sheet`,
        });
        await fetchConfig();
      } else {
        toast({
          title: 'Sync Failed',
          description: data.error || 'Unknown error',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to sync',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const toggleAutoSync = async () => {
    if (!config) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('google_sheets_config')
        .update({ auto_sync_enabled: !config.auto_sync_enabled })
        .eq('id', config.id);

      if (error) throw error;

      await fetchConfig();
      
      toast({
        title: 'Success',
        description: `Auto-sync ${!config.auto_sync_enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error toggling auto-sync:', error);
      toast({
        title: 'Error',
        description: 'Failed to update auto-sync setting',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Google Sheets Inventory Sync</CardTitle>
          <CardDescription>
            Sync in-stock motors from a published Google Sheet. Motors listed in the "New Mercury Motors" tab will be marked "In Stock", all others revert to "Brochure".
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Published Google Sheets URL</label>
            <div className="flex gap-2">
              <Input
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                disabled={loading}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Paste the URL from your browser when viewing the Google Sheet
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              Sheet Tab GID
              <span className="text-xs text-muted-foreground font-normal">(for "New Mercury Motors" tab)</span>
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., 1042549170"
                value={sheetGid}
                onChange={(e) => setSheetGid(e.target.value)}
                disabled={loading}
              />
              <Button onClick={saveConfig} disabled={loading || !sheetUrl.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
            <div className="flex items-start gap-2 p-2 bg-muted/50 rounded-md">
              <HelpCircle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                <strong>How to find:</strong> Click the "New Mercury Motors" tab in your sheet, then look at the browser URL. Copy the number after <code className="bg-muted px-1 rounded">gid=</code>
                <br />
                Example: <code className="bg-muted px-1 rounded">...edit#gid=<strong>1042549170</strong></code>
              </p>
            </div>
          </div>

          {config && (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Auto-Sync (Daily 6 AM)</span>
                  <Badge variant={config.auto_sync_enabled ? 'default' : 'secondary'}>
                    {config.auto_sync_enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                {config.last_sync && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Last synced {formatDistanceToNow(new Date(config.last_sync), { addSuffix: true })}
                  </p>
                )}
                {config.sheet_gid && (
                  <p className="text-xs text-muted-foreground">
                    Using GID: {config.sheet_gid}
                  </p>
                )}
              </div>
              <Button onClick={toggleAutoSync} variant="outline" disabled={loading}>
                {config.auto_sync_enabled ? 'Disable' : 'Enable'}
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={triggerSync} 
              disabled={!config || syncing}
              className="flex-1"
            >
              {syncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Now
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {syncResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {syncResult.success ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Sync Successful
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  Sync Failed
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {syncResult.success && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{syncResult.motorsFound}</div>
                    <div className="text-xs text-muted-foreground">Total in Sheet</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                    <div className="text-2xl font-bold text-green-600">{syncResult.motorsMatched}</div>
                    <div className="text-xs text-muted-foreground">Matched</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg bg-amber-50 dark:bg-amber-950">
                    <div className="text-2xl font-bold text-amber-600">{syncResult.motorsUnmatched}</div>
                    <div className="text-xs text-muted-foreground">Unmatched</div>
                  </div>
                </div>

                {syncResult.matched && syncResult.matched.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Matched Motors ({syncResult.matched.length})
                    </h4>
                    <div className="max-h-48 overflow-y-auto space-y-1 p-3 bg-muted/50 rounded-lg text-xs">
                      {syncResult.matched.map((motor, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-green-600">✓</span>
                          <span>{motor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {syncResult.unmatched && syncResult.unmatched.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      Unmatched Models ({syncResult.unmatched.length})
                    </h4>
                    <div className="max-h-48 overflow-y-auto space-y-1 p-3 bg-muted/50 rounded-lg text-xs">
                      {syncResult.unmatched.map((model, i) => (
                        <div key={i} className="flex items-center gap-2 text-muted-foreground">
                          <span className="text-amber-600">⚠</span>
                          <span>{model}</span>
                        </div>
                      ))}
                    </div>
                    <Alert>
                      <AlertDescription className="text-xs">
                        These models from your sheet couldn't be matched to motors in the database. Check for typos or add them manually.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </>
            )}

            {!syncResult.success && (
              <Alert variant="destructive">
                <AlertDescription>{syncResult.error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
            <div>
              <p className="font-medium">Paste Your Google Sheet URL</p>
              <p className="text-muted-foreground text-xs">Copy the URL from your browser when viewing the spreadsheet</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
            <div>
              <p className="font-medium">Enter the Sheet Tab GID</p>
              <p className="text-muted-foreground text-xs">Click "New Mercury Motors" tab, copy the GID number from the URL (e.g., 1042549170)</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</div>
            <div>
              <p className="font-medium">Automatic Daily Sync</p>
              <p className="text-muted-foreground text-xs">Every day at 6 AM, motors in your sheet are marked "In Stock", others revert to "Brochure"</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
