import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, X, Globe, Database, FileText, Link, Cloud, Zap, TestTube } from 'lucide-react';

interface CustomSource {
  id: string;
  motor_id: string;
  source_type: string;
  source_url: string;
  source_name: string;
  is_active: boolean;
  priority: number;
  scrape_config: any;
  last_scraped: string | null;
  success_rate: number;
  created_at: string;
}

interface CustomSourceManagerProps {
  motorId: string;
  motorModel: string;
}

const SOURCE_TYPES = [
  { value: 'direct_url', label: 'Direct Image URL', icon: Link },
  { value: 'gallery_url', label: 'Image Gallery', icon: Globe },
  { value: 'dropbox', label: 'Dropbox Folder', icon: Cloud },
  { value: 'google_drive', label: 'Google Drive', icon: Cloud },
  { value: 'pdf_url', label: 'PDF Document', icon: FileText },
  { value: 'api_endpoint', label: 'API Endpoint', icon: Zap },
];

export const CustomSourceManager: React.FC<CustomSourceManagerProps> = ({
  motorId,
  motorModel,
}) => {
  const { toast } = useToast();
  const [sources, setSources] = useState<CustomSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSource, setNewSource] = useState({
    source_type: '',
    source_url: '',
    source_name: '',
    priority: 1,
  });

  useEffect(() => {
    fetchCustomSources();
  }, [motorId]);

  const fetchCustomSources = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('motor_custom_sources')
        .select('*')
        .eq('motor_id', motorId)
        .order('priority', { ascending: true });

      if (error) throw error;
      setSources(data || []);
    } catch (error) {
      console.error('Error fetching custom sources:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch custom sources',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSource = async () => {
    if (!newSource.source_type || !newSource.source_url || !newSource.source_name) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('motor_custom_sources')
        .insert({
          motor_id: motorId,
          source_type: newSource.source_type,
          source_url: newSource.source_url,
          source_name: newSource.source_name,
          priority: newSource.priority,
          created_by: user.user?.id,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Custom source added successfully',
      });

      setNewSource({
        source_type: '',
        source_url: '',
        source_name: '',
        priority: 1,
      });
      setShowAddForm(false);
      fetchCustomSources();
    } catch (error) {
      console.error('Error adding custom source:', error);
      toast({
        title: 'Error',
        description: 'Failed to add custom source',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    try {
      const { error } = await supabase
        .from('motor_custom_sources')
        .delete()
        .eq('id', sourceId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Custom source deleted successfully',
      });

      fetchCustomSources();
    } catch (error) {
      console.error('Error deleting custom source:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete custom source',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (sourceId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('motor_custom_sources')
        .update({ is_active: !isActive })
        .eq('id', sourceId);

      if (error) throw error;

      fetchCustomSources();
    } catch (error) {
      console.error('Error toggling source status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update source status',
        variant: 'destructive',
      });
    }
  };

  const handleTestSource = async (source: CustomSource) => {
    try {
      toast({
        title: 'Testing Source',
        description: 'Testing source connectivity...',
      });

      // Call the multi-source scraper with this specific source
      const { data, error } = await supabase.functions.invoke('multi-source-scraper', {
        body: {
          motor_id: motorId,
          custom_url: source.source_url,
          source_type: source.source_type,
          background: false,
        },
      });

      if (error) throw error;

      toast({
        title: 'Test Complete',
        description: `Found ${data?.images_found || 0} images from this source`,
      });

      fetchCustomSources();
    } catch (error) {
      console.error('Error testing source:', error);
      toast({
        title: 'Test Failed',
        description: 'Failed to test source connectivity',
        variant: 'destructive',
      });
    }
  };

  const handleScrapeWithCustomSources = async () => {
    try {
      toast({
        title: 'Scraping Started',
        description: 'Processing all custom sources for this motor...',
      });

      // Call the multi-source scraper to process all custom sources for this motor
      const { data, error } = await supabase.functions.invoke('multi-source-scraper', {
        body: {
          motor_id: motorId,
          include_custom_sources: true,
          background: true,
        },
      });

      if (error) throw error;

      toast({
        title: 'Scraping Complete',
        description: `Processed motor with custom sources`,
      });

      fetchCustomSources();
    } catch (error) {
      console.error('Error scraping with custom sources:', error);
      toast({
        title: 'Scraping Failed',
        description: 'Failed to process custom sources',
        variant: 'destructive',
      });
    }
  };

  const getSourceTypeInfo = (sourceType: string) => {
    return SOURCE_TYPES.find(type => type.value === sourceType);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Custom Image Sources</h3>
          <p className="text-sm text-muted-foreground">
            Add custom sources to scrape images for {motorModel}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleScrapeWithCustomSources()}
          >
            <Globe className="h-4 w-4 mr-2" />
            Scrape All Sources
          </Button>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Source
          </Button>
        </div>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Custom Source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="source_type">Source Type</Label>
                <Select
                  value={newSource.source_type}
                  onValueChange={(value) => setNewSource({ ...newSource, source_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="source_name">Source Name</Label>
                <Input
                  id="source_name"
                  placeholder="e.g., Manufacturer Gallery"
                  value={newSource.source_name}
                  onChange={(e) => setNewSource({ ...newSource, source_name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="source_url">Source URL</Label>
              <Input
                id="source_url"
                placeholder="https://example.com/images or dropbox.com/folder"
                value={newSource.source_url}
                onChange={(e) => setNewSource({ ...newSource, source_url: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="priority">Priority (1-10)</Label>
              <Input
                id="priority"
                type="number"
                min="1"
                max="10"
                value={newSource.priority}
                onChange={(e) => setNewSource({ ...newSource, priority: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddSource} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Source
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {sources.map((source) => {
          const sourceInfo = getSourceTypeInfo(source.source_type);
          const Icon = sourceInfo?.icon || Database;

          return (
            <Card key={source.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{source.source_name}</h4>
                        <Badge variant={source.is_active ? 'default' : 'secondary'}>
                          {source.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">
                          Priority {source.priority}
                        </Badge>
                        {source.success_rate > 0 && (
                          <Badge variant={source.success_rate > 70 ? 'default' : 'destructive'}>
                            {source.success_rate}% success
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{sourceInfo?.label}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-md">
                        {source.source_url}
                      </p>
                      {source.last_scraped && (
                        <p className="text-xs text-muted-foreground">
                          Last scraped: {new Date(source.last_scraped).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestSource(source)}
                    >
                      <TestTube className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(source.id, source.is_active)}
                    >
                      {source.is_active ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSource(source.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {sources.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Custom Sources</h3>
              <p className="text-muted-foreground mb-4">
                Add custom image sources to enhance this motor's image collection
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Source
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};