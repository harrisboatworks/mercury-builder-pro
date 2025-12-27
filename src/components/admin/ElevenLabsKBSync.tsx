import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Brain, RefreshCw, CheckCircle, AlertCircle, Clock, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SyncState {
  id: string;
  agent_id: string;
  document_id: string | null;
  document_name: string | null;
  last_synced_at: string | null;
  sync_status: string | null;
  motor_count: number | null;
  in_stock_count: number | null;
  error_message: string | null;
}

interface StaticSyncResult {
  documentName: string;
  documentId: string | null;
  success: boolean;
  error?: string;
}

export function ElevenLabsKBSync() {
  const [syncState, setSyncState] = useState<SyncState | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingStatic, setSyncingStatic] = useState(false);
  const [lastStaticSync, setLastStaticSync] = useState<StaticSyncResult[] | null>(null);

  const fetchSyncState = async () => {
    try {
      const { data, error } = await supabase
        .from('elevenlabs_sync_state')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching sync state:', error);
      }
      setSyncState(data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSyncState();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-elevenlabs-kb', {
        method: 'POST',
        body: {},
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.success) {
        toast.success('Knowledge Base synced successfully', {
          description: `${data.motorCount} motors synced (${data.inStockCount} in stock)`,
        });
        await fetchSyncState();
      } else {
        throw new Error(data?.error || 'Unknown error');
      }
    } catch (err: any) {
      console.error('Sync error:', err);
      toast.error('Sync failed', {
        description: err.message,
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleStaticSync = async () => {
    setSyncingStatic(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-elevenlabs-static-kb', {
        method: 'POST',
        body: {},
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.success) {
        toast.success('Static Knowledge synced successfully', {
          description: `${data.successCount} documents synced`,
        });
        setLastStaticSync(data.results);
      } else if (data?.results) {
        toast.warning('Partial sync completed', {
          description: `${data.successCount} of ${data.documentsProcessed} documents synced`,
        });
        setLastStaticSync(data.results);
      } else {
        throw new Error(data?.error || 'Unknown error');
      }
    } catch (err: any) {
      console.error('Static sync error:', err);
      toast.error('Static sync failed', {
        description: err.message,
      });
    } finally {
      setSyncingStatic(false);
    }
  };

  const getStatusBadge = () => {
    if (!syncState) return <Badge variant="outline">Never synced</Badge>;
    
    switch (syncState.sync_status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Success</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Error</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          ElevenLabs Voice AI Knowledge Base
        </CardTitle>
        <CardDescription>
          Sync motor inventory to the voice AI agent's knowledge base
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              {getStatusBadge()}
            </div>
            <p className="text-sm text-muted-foreground">
              Last synced: {formatDate(syncState?.last_synced_at ?? null)}
            </p>
            {syncState?.motor_count && (
              <p className="text-sm text-muted-foreground">
                {syncState.motor_count} motors ({syncState.in_stock_count} in stock)
              </p>
            )}
          </div>
          
          <Button 
            onClick={handleSync} 
            disabled={syncing || loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>
        
        {syncState?.error_message && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{syncState.error_message}</p>
          </div>
        )}
        
        {syncState?.document_name && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-xs text-muted-foreground">Document: {syncState.document_name}</p>
            <p className="text-xs text-muted-foreground font-mono">ID: {syncState.document_id}</p>
          </div>
        )}
        
        <Separator className="my-4" />
        
        {/* Static Knowledge Sync Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Static Knowledge Documents</span>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Sync Harris guide, Mercury products, Repower guide, and Service FAQ
          </p>
          
          <Button 
            onClick={handleStaticSync} 
            disabled={syncingStatic}
            variant="outline"
            className="gap-2 w-full"
          >
            <RefreshCw className={`w-4 h-4 ${syncingStatic ? 'animate-spin' : ''}`} />
            {syncingStatic ? 'Syncing Static Knowledge...' : 'Sync Static Knowledge'}
          </Button>
          
          {lastStaticSync && (
            <div className="space-y-2">
              {lastStaticSync.map((result, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                  <span className="truncate flex-1">{result.documentName}</span>
                  {result.success ? (
                    <CheckCircle className="w-3 h-3 text-green-600 ml-2" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-red-600 ml-2" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}