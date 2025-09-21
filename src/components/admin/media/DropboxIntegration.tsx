import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FolderSync, Plus, Trash2, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface DropboxConfig {
  id: string;
  folder_path: string;
  motor_assignment_rule: string;
  auto_categorize: boolean;
  sync_enabled: boolean;
  last_sync_at: string | null;
  sync_status: 'idle' | 'syncing' | 'error';
  error_message: string | null;
  files_synced: number;
  created_at: string;
}

export function DropboxIntegration() {
  const [configs, setConfigs] = useState<DropboxConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newFolderPath, setNewFolderPath] = useState('');
  const [newAssignmentRule, setNewAssignmentRule] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('dropbox_sync_config')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      console.error('Failed to load Dropbox configs:', error);
      toast({
        title: "Failed to load configurations",
        description: "Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addConfig = async () => {
    const folderPath = newFolderPath.trim()
    
    if (!folderPath) {
      toast({
        title: "Dropbox URL required",
        description: "Please enter a valid Dropbox shared folder URL.",
        variant: "destructive",
      });
      return;
    }

    // Validate URL format
    if (!folderPath.includes('dropbox.com') && !folderPath.startsWith('scl/fo/') && !folderPath.startsWith('s/')) {
      toast({
        title: "Invalid URL format",
        description: "Please use a valid Dropbox shared folder URL (e.g., https://www.dropbox.com/scl/fo/...)",
        variant: "destructive",
      });
      return;
    }

    setAdding(true);
    try {
      const { error } = await supabase
        .from('dropbox_sync_config')
        .insert({
          folder_path: folderPath,
          motor_assignment_rule: newAssignmentRule.trim() || 'filename_pattern',
          auto_categorize: true,
          sync_enabled: true,
        });

      if (error) throw error;

      toast({
        title: "Configuration added",
        description: "Dropbox folder sync has been configured.",
      });

      setNewFolderPath('');
      setNewAssignmentRule('');
      loadConfigs();
    } catch (error) {
      console.error('Failed to add config:', error);
      toast({
        title: "Failed to add configuration",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const updateConfig = async (id: string, updates: Partial<DropboxConfig>) => {
    try {
      const { error } = await supabase
        .from('dropbox_sync_config')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setConfigs(prev => prev.map(config => 
        config.id === id ? { ...config, ...updates } : config
      ));
    } catch (error) {
      console.error('Failed to update config:', error);
      toast({
        title: "Failed to update configuration",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteConfig = async (id: string) => {
    try {
      const { error } = await supabase
        .from('dropbox_sync_config')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setConfigs(prev => prev.filter(config => config.id !== id));
      toast({
        title: "Configuration deleted",
        description: "Dropbox sync configuration has been removed.",
      });
    } catch (error) {
      console.error('Failed to delete config:', error);
      toast({
        title: "Failed to delete configuration",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const triggerSync = async (id: string) => {
    try {
      // Update UI to show sync is running
      await updateConfig(id, { sync_status: 'syncing' });
      
      // Call the sync edge function
      const { data, error } = await supabase.functions.invoke('sync-dropbox-folder', {
        body: { config_id: id }
      });

      if (error) throw error;

      toast({
        title: "Sync completed",
        description: `Successfully synced ${data.synced_files} out of ${data.total_files} files.`,
      });

      // Refresh configurations to show updated status
      loadConfigs();
      
    } catch (error) {
      console.error('Sync failed:', error);
      await updateConfig(id, { 
        sync_status: 'error', 
        error_message: error.message 
      });
      
      toast({
        title: "Sync failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Loading configurations...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderSync className="h-5 w-5" />
            Dropbox Integration
          </CardTitle>
          <CardDescription>
            Configure real-time synchronization with Dropbox folders for automatic media import.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>How to get Dropbox URL:</strong> Go to your Dropbox folder → Click "Share" → Click "Copy link" → Paste the full URL here.
              Files will be automatically imported and assigned to motors based on your rules.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="folder-path">Dropbox Shared Folder URL</Label>
              <Input
                id="folder-path"
                placeholder="https://www.dropbox.com/scl/fo/abc123/xyz?rlkey=..."
                value={newFolderPath}
                onChange={(e) => setNewFolderPath(e.target.value)}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Paste the full Dropbox shared folder URL from "Copy link"
              </p>
            </div>
            <div>
              <Label htmlFor="assignment-rule">Assignment Rule</Label>
              <Input
                id="assignment-rule"
                placeholder="filename_pattern"
                value={newAssignmentRule}
                onChange={(e) => setNewAssignmentRule(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addConfig} disabled={adding}>
                <Plus className="h-4 w-4 mr-2" />
                {adding ? 'Adding...' : 'Add Folder'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {configs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Sync Configurations</CardTitle>
            <CardDescription>
              Manage your Dropbox folder synchronization settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {configs.map((config) => (
                <Card key={config.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{config.folder_path}</h4>
                        <Badge variant={
                          config.sync_status === 'syncing' ? 'default' :
                          config.sync_status === 'error' ? 'destructive' :
                          'secondary'
                        }>
                          {config.sync_status === 'syncing' && <RefreshCw className="h-3 w-3 animate-spin mr-1" />}
                          {config.sync_status === 'error' && <AlertCircle className="h-3 w-3 mr-1" />}
                          {config.sync_status === 'idle' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {config.sync_status.charAt(0).toUpperCase() + config.sync_status.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        Rule: {config.motor_assignment_rule} • Files synced: {config.files_synced}
                        {config.last_sync_at && (
                          <span> • Last sync: {new Date(config.last_sync_at).toLocaleString()}</span>
                        )}
                      </div>

                      {config.error_message && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{config.error_message}</AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`sync-${config.id}`} className="text-sm">
                          Auto-sync
                        </Label>
                        <Switch
                          id={`sync-${config.id}`}
                          checked={config.sync_enabled}
                          onCheckedChange={(checked) => 
                            updateConfig(config.id, { sync_enabled: checked })
                          }
                        />
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => triggerSync(config.id)}
                        disabled={config.sync_status === 'syncing'}
                      >
                        <RefreshCw className={`h-4 w-4 ${config.sync_status === 'syncing' ? 'animate-spin' : ''}`} />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteConfig(config.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}