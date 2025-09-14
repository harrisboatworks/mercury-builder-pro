import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, 
  Settings, 
  Globe, 
  Database, 
  User, 
  Zap, 
  Edit, 
  Trash2, 
  Plus,
  TrendingUp,
  Calendar,
  AlertTriangle
} from 'lucide-react';

interface DataSource {
  id: string;
  name: string;
  base_url: string;
  is_active: boolean;
  scrape_config: any;
  priority: number;
  success_rate: number;
  last_scraped: string | null;
  created_at: string;
  updated_at: string;
}

export const SourceManagement: React.FC = () => {
  const { toast } = useToast();
  const [sources, setSources] = useState<DataSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSource, setEditingSource] = useState<DataSource | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newSource, setNewSource] = useState({
    name: '',
    base_url: '',
    priority: 1,
  });

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const { data, error } = await supabase
        .from('motor_data_sources')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      setSources(data);
    } catch (error) {
      console.error('Error fetching sources:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch data sources',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSource = async (source: DataSource) => {
    try {
      const { error } = await supabase
        .from('motor_data_sources')
        .update(source)
        .eq('id', source.id);

      if (error) throw error;
      
      await fetchSources();
      toast({
        title: 'Success',
        description: 'Data source updated successfully',
      });
    } catch (error) {
      console.error('Error updating source:', error);
      toast({
        title: 'Error',
        description: 'Failed to update data source',
        variant: 'destructive',
      });
    }
  };

  const createSource = async () => {
    if (!newSource.name || !newSource.base_url) return;
    
    try {
      const { error } = await supabase
        .from('motor_data_sources')
        .insert({
          name: newSource.name,
          base_url: newSource.base_url,
          priority: newSource.priority,
        });

      if (error) throw error;
      
      setIsCreating(false);
      setNewSource({ name: '', base_url: '', priority: 1 });
      await fetchSources();
      
      toast({
        title: 'Success',
        description: 'Data source created successfully',
      });
    } catch (error) {
      console.error('Error creating source:', error);
      toast({
        title: 'Error',
        description: 'Failed to create data source',
        variant: 'destructive',
      });
    }
  };

  const deleteSource = async (sourceId: string) => {
    if (!confirm('Are you sure you want to delete this data source?')) return;
    
    try {
      const { error } = await supabase
        .from('motor_data_sources')
        .delete()
        .eq('id', sourceId);

      if (error) throw error;
      
      await fetchSources();
      toast({
        title: 'Success',
        description: 'Data source deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting source:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete data source',
        variant: 'destructive',
      });
    }
  };

  const triggerScraping = async (sourceName: string) => {
    try {
      const { error } = await supabase.functions.invoke('scrape-motor-details-batch', {
        body: {
          source_filter: sourceName,
          batch_size: 10,
          background: true,
        },
      });

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `Started scraping from ${sourceName}`,
      });
    } catch (error) {
      console.error('Error triggering scraping:', error);
      toast({
        title: 'Error',
        description: 'Failed to trigger scraping',
        variant: 'destructive',
      });
    }
  };

  const getSourceIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'harris':
        return <Database className="h-4 w-4" />;
      case 'mercury_official':
        return <Globe className="h-4 w-4" />;
      case 'manual':
        return <User className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  if (isLoading) {
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Data Source Management
            </CardTitle>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Source
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sources.map((source) => (
              <Card key={source.id} className={!source.is_active ? 'opacity-60' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getSourceIcon(source.name)}
                      <h3 className="font-semibold">{source.name}</h3>
                    </div>
                    <Badge variant={source.is_active ? 'default' : 'secondary'}>
                      {source.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Success Rate</span>
                      <span className={source.success_rate > 70 ? 'text-green-600' : 'text-red-600'}>
                        {source.success_rate.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={source.success_rate} className="h-2" />
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3 w-3" />
                      Priority: {source.priority}
                    </div>
                    {source.last_scraped && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        Last: {new Date(source.last_scraped).toLocaleDateString()}
                      </div>
                    )}
                    {!source.last_scraped && (
                      <div className="flex items-center gap-2 text-orange-600">
                        <AlertTriangle className="h-3 w-3" />
                        Never scraped
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <Switch
                      checked={source.is_active}
                      onCheckedChange={(checked) =>
                        updateSource({ ...source, is_active: checked })
                      }
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => triggerScraping(source.name)}
                        disabled={!source.is_active}
                      >
                        <Zap className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingSource(source)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      {source.name !== 'harris' && source.name !== 'manual' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteSource(source.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create New Source Modal */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Data Source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="source-name">Source Name</Label>
              <Input
                id="source-name"
                value={newSource.name}
                onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                placeholder="e.g., boatingmag"
              />
            </div>
            <div>
              <Label htmlFor="source-url">Base URL</Label>
              <Input
                id="source-url"
                value={newSource.base_url}
                onChange={(e) => setNewSource({ ...newSource, base_url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label htmlFor="source-priority">Priority</Label>
              <Select
                value={newSource.priority.toString()}
                onValueChange={(value) => setNewSource({ ...newSource, priority: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 (Highest)</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5 (Lowest)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsCreating(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={createSource}>
                Create Source
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Source Modal */}
      {editingSource && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Data Source: {editingSource.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="edit-url">Base URL</Label>
              <Input
                id="edit-url"
                value={editingSource.base_url}
                onChange={(e) =>
                  setEditingSource({ ...editingSource, base_url: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-priority">Priority</Label>
              <Select
                value={editingSource.priority.toString()}
                onValueChange={(value) =>
                  setEditingSource({ ...editingSource, priority: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 (Highest)</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5 (Lowest)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setEditingSource(null)} variant="outline">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  updateSource(editingSource);
                  setEditingSource(null);
                }}
              >
                Update Source
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};