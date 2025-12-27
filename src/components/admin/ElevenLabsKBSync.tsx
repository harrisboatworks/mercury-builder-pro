import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface StaticDocResult {
  name: string;
  success: boolean;
  id?: string;
  error?: string;
}

export function ElevenLabsKBSync() {
  const [syncState, setSyncState] = useState<SyncState | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastStaticResults, setLastStaticResults] = useState<StaticDocResult[] | null>(null);

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
    setLastStaticResults(null);
    try {
      const { data, error } = await supabase.functions.invoke('sync-elevenlabs-kb', {
        method: 'POST',
        body: {},
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.success) {
        const staticCount = data.staticDocsCount || 0;
        toast.success('Knowledge Base synced successfully', {
          description: `${data.motorCount} motors + ${staticCount} static docs synced`,
        });
        if (data.staticResults) {
          setLastStaticResults(data.staticResults);
        }
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
          Sync motor inventory and static knowledge to the voice AI agent
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
            {syncing ? 'Syncing All...' : 'Sync All'}
          </Button>
        </div>
        
        {syncState?.error_message && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{syncState.error_message}</p>
          </div>
        )}
        
        {syncState?.document_name && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-xs text-muted-foreground">Inventory: {syncState.document_name}</p>
          </div>
        )}
        
        {/* Static Documents Results */}
        {lastStaticResults && lastStaticResults.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Static Documents</span>
            </div>
            {lastStaticResults.map((result, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                <span className="truncate flex-1">{result.name}</span>
                {result.success ? (
                  <CheckCircle className="w-3 h-3 text-green-600 ml-2" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-red-600 ml-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
