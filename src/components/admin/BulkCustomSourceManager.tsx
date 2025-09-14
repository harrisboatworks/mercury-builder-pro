import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Play, Database, Globe, Zap, Search, Plus, X, TestTube, Link, FileText, Cloud } from 'lucide-react';

interface BulkStats {
  total_motors: number;
  motors_with_custom_sources: number;
  total_custom_sources: number;
  active_custom_sources: number;
}

interface Motor {
  id: string;
  model: string;
  horsepower: number;
  make: string;
}

interface CustomSource {
  id: string;
  motor_id: string;
  source_type: string;
  source_url: string;
  source_name: string;
  is_active: boolean;
  priority: number;
  success_rate: number;
  last_scraped: string | null;
}

const SOURCE_TYPES = [
  { value: 'direct_url', label: 'Direct Image URL', icon: Link },
  { value: 'gallery_url', label: 'Image Gallery', icon: Globe },
  { value: 'dropbox', label: 'Dropbox Folder', icon: Cloud },
  { value: 'google_drive', label: 'Google Drive', icon: Cloud },
  { value: 'pdf_url', label: 'PDF Document', icon: FileText },
  { value: 'api_endpoint', label: 'API Endpoint', icon: Zap },
];

export const BulkCustomSourceManager: React.FC = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<BulkStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Motor search and selection
  const [motors, setMotors] = useState<Motor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMotor, setSelectedMotor] = useState<Motor | null>(null);
  const [filteredMotors, setFilteredMotors] = useState<Motor[]>([]);
  
  // Custom sources for selected motor
  const [customSources, setCustomSources] = useState<CustomSource[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSource, setNewSource] = useState({
    source_type: '',
    source_url: '',
    source_name: '',
    priority: 1,
  });
  
  // Motors with custom sources view
  const [motorsWithSources, setMotorsWithSources] = useState<Array<{
    motor: Motor;
    sources: CustomSource[];
  }>>([]);

  useEffect(() => {
    fetchStats();
    fetchMotors();
    fetchMotorsWithSources();
  }, []);

  useEffect(() => {
    if (selectedMotor) {
      fetchCustomSourcesForMotor(selectedMotor.id);
    }
  }, [selectedMotor]);

  useEffect(() => {
    const filtered = motors.filter(motor => 
      motor.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      motor.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      motor.horsepower.toString().includes(searchTerm)
    );
    setFilteredMotors(filtered);
  }, [searchTerm, motors]);

  const fetchStats = async () => {
    try {
      // Get motor counts
      const { count: totalMotors } = await supabase
        .from('motor_models')
        .select('*', { count: 'exact', head: true });

      // Get custom sources stats
      const { data: customSources, error: customSourcesError } = await supabase
        .from('motor_custom_sources')
        .select('motor_id, is_active');

      if (customSourcesError) throw customSourcesError;

      const totalCustomSources = customSources?.length || 0;
      const activeCustomSources = customSources?.filter(cs => cs.is_active).length || 0;
      const motorsWithCustomSources = new Set(customSources?.map(cs => cs.motor_id)).size;

      setStats({
        total_motors: totalMotors || 0,
        motors_with_custom_sources: motorsWithCustomSources,
        total_custom_sources: totalCustomSources,
        active_custom_sources: activeCustomSources,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch statistics',
        variant: 'destructive',
      });
    }
  };

  const fetchMotors = async () => {
    try {
      const { data, error } = await supabase
        .from('motor_models')
        .select('id, model, horsepower, make')
        .order('model', { ascending: true });

      if (error) throw error;
      setMotors(data || []);
    } catch (error) {
      console.error('Error fetching motors:', error);
    }
  };

  const fetchCustomSourcesForMotor = async (motorId: string) => {
    try {
      const { data, error } = await supabase
        .from('motor_custom_sources')
        .select('*')
        .eq('motor_id', motorId)
        .order('priority', { ascending: true });

      if (error) throw error;
      setCustomSources(data || []);
    } catch (error) {
      console.error('Error fetching custom sources:', error);
    }
  };

  const fetchMotorsWithSources = async () => {
    try {
      const { data: sourcesData, error: sourcesError } = await supabase
        .from('motor_custom_sources')
        .select('*')
        .order('motor_id, priority');

      if (sourcesError) throw sourcesError;

      const motorIds = [...new Set(sourcesData?.map(s => s.motor_id) || [])];
      
      if (motorIds.length === 0) {
        setMotorsWithSources([]);
        return;
      }

      const { data: motorsData, error: motorsError } = await supabase
        .from('motor_models')
        .select('id, model, horsepower, make')
        .in('id', motorIds);

      if (motorsError) throw motorsError;

      const result = motorsData?.map(motor => ({
        motor,
        sources: sourcesData?.filter(s => s.motor_id === motor.id) || []
      })) || [];

      setMotorsWithSources(result);
    } catch (error) {
      console.error('Error fetching motors with sources:', error);
    }
  };

  const handleAddSource = async () => {
    if (!selectedMotor || !newSource.source_type || !newSource.source_url || !newSource.source_name) {
      toast({
        title: 'Error',
        description: 'Please select a motor and fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('motor_custom_sources')
        .insert({
          motor_id: selectedMotor.id,
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
      
      // Refresh data
      fetchCustomSourcesForMotor(selectedMotor.id);
      fetchStats();
      fetchMotorsWithSources();
    } catch (error) {
      console.error('Error adding custom source:', error);
      toast({
        title: 'Error',
        description: 'Failed to add custom source',
        variant: 'destructive',
      });
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

      if (selectedMotor) {
        fetchCustomSourcesForMotor(selectedMotor.id);
      }
      fetchStats();
      fetchMotorsWithSources();
    } catch (error) {
      console.error('Error deleting custom source:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete custom source',
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

      const { data, error } = await supabase.functions.invoke('multi-source-scraper', {
        body: {
          motor_id: source.motor_id,
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

      if (selectedMotor) {
        fetchCustomSourcesForMotor(selectedMotor.id);
      }
      fetchMotorsWithSources();
    } catch (error) {
      console.error('Error testing source:', error);
      toast({
        title: 'Test Failed',
        description: 'Failed to test source connectivity',
        variant: 'destructive',
      });
    }
  };

  const handleBulkScrapeWithCustomSources = async () => {
    setIsProcessing(true);
    try {
      toast({
        title: 'Bulk Scraping Started',
        description: 'Processing all motors with custom sources...',
      });

      // Get all motors that have active custom sources
      const { data: motorsWithSources, error } = await supabase
        .from('motor_custom_sources')
        .select('motor_id')
        .eq('is_active', true);

      if (error) throw error;

      const uniqueMotorIds = [...new Set(motorsWithSources?.map(m => m.motor_id) || [])];

      // Process motors in batches
      for (const motorId of uniqueMotorIds) {
        try {
          await supabase.functions.invoke('multi-source-scraper', {
            body: {
              motor_id: motorId,
              include_custom_sources: true,
              background: true,
            },
          });
        } catch (motorError) {
          console.error(`Error processing motor ${motorId}:`, motorError);
        }
      }

      toast({
        title: 'Bulk Scraping Complete',
        description: `Processed ${uniqueMotorIds.length} motors with custom sources`,
      });

      fetchStats();
      fetchMotorsWithSources();
    } catch (error) {
      console.error('Error in bulk scraping:', error);
      toast({
        title: 'Bulk Scraping Failed',
        description: 'Failed to process motors with custom sources',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading custom source management...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Custom Source Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.total_motors}</div>
                <div className="text-sm text-muted-foreground">Total Motors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.motors_with_custom_sources}</div>
                <div className="text-sm text-muted-foreground">With Custom Sources</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.total_custom_sources}</div>
                <div className="text-sm text-muted-foreground">Total Sources</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.active_custom_sources}</div>
                <div className="text-sm text-muted-foreground">Active Sources</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Motor Search and Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Add Custom Sources to Motor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="motor-search">Search Motors</Label>
              <Input
                id="motor-search"
                placeholder="Search by model, make, or horsepower..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {selectedMotor && (
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(!showAddForm)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Source
                </Button>
              </div>
            )}
          </div>

          {searchTerm && (
            <div className="max-h-48 overflow-y-auto border rounded-lg">
              {filteredMotors.slice(0, 10).map((motor) => (
                <div
                  key={motor.id}
                  className={`p-3 cursor-pointer hover:bg-muted ${
                    selectedMotor?.id === motor.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => setSelectedMotor(motor)}
                >
                  <div className="font-medium">
                    {motor.make} {motor.model} - {motor.horsepower}HP
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedMotor && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="font-medium">Selected Motor:</div>
              <div className="text-sm text-muted-foreground">
                {selectedMotor.make} {selectedMotor.model} - {selectedMotor.horsepower}HP
              </div>
            </div>
          )}

          {showAddForm && selectedMotor && (
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
                  <Button onClick={handleAddSource}>
                    Add Source
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedMotor && customSources.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Custom Sources for {selectedMotor.model}</h4>
              {customSources.map((source) => {
                const sourceInfo = SOURCE_TYPES.find(type => type.value === source.source_type);
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Motors with Custom Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Motors with Custom Sources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {motorsWithSources.map(({ motor, sources }) => (
              <Card key={motor.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{motor.make} {motor.model} - {motor.horsepower}HP</h4>
                      <p className="text-sm text-muted-foreground">
                        {sources.length} custom source{sources.length !== 1 ? 's' : ''} 
                        ({sources.filter(s => s.is_active).length} active)
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedMotor(motor)}
                    >
                      Manage
                    </Button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {sources.map((source) => (
                      <Badge key={source.id} variant={source.is_active ? 'default' : 'secondary'}>
                        {source.source_name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {motorsWithSources.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No motors have custom sources configured yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Operations */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Process All Custom Sources</h4>
              <p className="text-sm text-muted-foreground">
                Run the multi-source scraper on all motors with active custom sources
              </p>
            </div>
            <Button
              onClick={handleBulkScrapeWithCustomSources}
              disabled={isProcessing || !stats?.active_custom_sources}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Play className="mr-2 h-4 w-4" />
              Process All ({stats?.active_custom_sources || 0})
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};