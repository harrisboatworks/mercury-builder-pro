import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Save, Plus, X, Edit3, Database, Globe, User } from 'lucide-react';
import { CustomSourceManager } from './CustomSourceManager';
import { QuickMediaUpload } from './QuickMediaUpload';
import { DropboxIntegration } from './media/DropboxIntegration';

interface Motor {
  id: string;
  model: string;
  horsepower: number;
  description?: string;
  features: string[];
  specifications: any;
  manual_overrides: any;
  data_sources: any;
  data_quality_score: number;
  images: Array<{ url: string; source?: string; type?: string }>;
  base_price: number;
  sale_price?: number;
  msrp?: number;
  dealer_price?: number;
}

interface ManualOverrideProps {
  motorId?: string;
  onClose?: () => void;
}

export const MotorManualOverride: React.FC<ManualOverrideProps> = ({
  motorId,
  onClose,
}) => {
  const { toast } = useToast();
  const [motor, setMotor] = useState<Motor | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [overrides, setOverrides] = useState<any>({});
  const [newFeature, setNewFeature] = useState('');
  const [newSpec, setNewSpec] = useState({ key: '', value: '' });

  useEffect(() => {
    if (motorId) {
      fetchMotor();
    }
  }, [motorId]);

  const fetchMotor = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('motor_models')
        .select('*')
        .eq('id', motorId)
        .single();

      if (error) throw error;
      setMotor(data);
      setOverrides(data.manual_overrides || {});
    } catch (error) {
      console.error('Error fetching motor:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch motor data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!motor) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('motor_models')
        .update({
          manual_overrides: overrides,
          data_sources: {
            ...motor.data_sources,
            manual: {
              added_at: new Date().toISOString(),
              user_id: (await supabase.auth.getUser()).data.user?.id,
            },
          },
        })
        .eq('id', motor.id);

      if (error) throw error;

      // Log the manual override action
      await supabase.from('motor_enrichment_log').insert({
        motor_id: motor.id,
        source_name: 'manual',
        action: 'manual_override',
        data_added: overrides,
        user_id: (await supabase.auth.getUser()).data.user?.id,
      });

      toast({
        title: 'Success',
        description: 'Manual overrides saved successfully',
      });

      if (onClose) onClose();
    } catch (error) {
      console.error('Error saving overrides:', error);
      toast({
        title: 'Error',
        description: 'Failed to save manual overrides',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateOverride = (field: string, value: any) => {
    setOverrides((prev: any) => ({ ...prev, [field]: value }));
  };

  const addFeature = () => {
    if (!newFeature.trim()) return;
    const currentFeatures = overrides.features || motor?.features || [];
    updateOverride('features', [...currentFeatures, newFeature.trim()]);
    setNewFeature('');
  };

  const removeFeature = (index: number) => {
    const currentFeatures = overrides.features || motor?.features || [];
    updateOverride('features', currentFeatures.filter((_: any, i: number) => i !== index));
  };

  const addSpecification = () => {
    if (!newSpec.key.trim() || !newSpec.value.trim()) return;
    const currentSpecs = overrides.specifications || motor?.specifications || {};
    updateOverride('specifications', {
      ...currentSpecs,
      [newSpec.key]: newSpec.value,
    });
    setNewSpec({ key: '', value: '' });
  };

  const removeSpecification = (key: string) => {
    const currentSpecs = overrides.specifications || motor?.specifications || {};
    const { [key]: removed, ...rest } = currentSpecs;
    updateOverride('specifications', rest);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!motor) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Manual Motor Override
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No motor selected</p>
        </CardContent>
      </Card>
    );
  }

  const displayFeatures = overrides.features || motor.features || [];
  const displaySpecs = { ...(motor.specifications || {}), ...(overrides.specifications || {}) };

  return (
    <Card className="max-w-6xl">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Manual Override: {motor.model}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {motor.horsepower} HP
            </Badge>
            <Badge variant={motor.data_quality_score > 70 ? 'default' : 'destructive'}>
              Quality: {motor.data_quality_score}%
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Database className="h-4 w-4" />
            Harris: {motor.data_sources?.harris?.success ? '✓' : '✗'}
          </div>
          <div className="flex items-center gap-1">
            <Globe className="h-4 w-4" />
            Mercury: {motor.data_sources?.mercury_official?.success ? '✓' : '✗'}
          </div>
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            Manual: {motor.data_sources?.manual?.added_at ? '✓' : '✗'}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="specs">Specifications</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="sources">Custom Sources</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="description">Description Override</Label>
                <Textarea
                  id="description"
                  placeholder="Add custom description..."
                  value={overrides.description || ''}
                  onChange={(e) => updateOverride('description', e.target.value)}
                  rows={4}
                />
                {motor.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Original: {motor.description.substring(0, 100)}...
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="base-price">Base Price (MSRP) Override</Label>
                <Input
                  id="base-price"
                  type="number"
                  placeholder="Enter base price..."
                  value={overrides.base_price || ''}
                  onChange={(e) => updateOverride('base_price', parseFloat(e.target.value) || null)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Original: ${motor.base_price || motor.msrp || 'Not set'}
                </p>
              </div>

              <div>
                <Label htmlFor="sale-price">Sale Price Override</Label>
                <Input
                  id="sale-price"
                  type="number"
                  placeholder="Enter sale price..."
                  value={overrides.sale_price || ''}
                  onChange={(e) => updateOverride('sale_price', parseFloat(e.target.value) || null)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Original: ${motor.sale_price || motor.dealer_price || 'Not set'}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add new feature..."
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addFeature()}
              />
              <Button onClick={addFeature} disabled={!newFeature.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {displayFeatures.map((feature: string, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span>{feature}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFeature(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="specs" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Spec name..."
                value={newSpec.key}
                onChange={(e) => setNewSpec({ ...newSpec, key: e.target.value })}
              />
              <Input
                placeholder="Spec value..."
                value={newSpec.value}
                onChange={(e) => setNewSpec({ ...newSpec, value: e.target.value })}
              />
              <Button
                onClick={addSpecification}
                disabled={!newSpec.key.trim() || !newSpec.value.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {Object.entries(displaySpecs).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1">
                    <span className="font-medium">{key}:</span> {String(value)}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSpecification(key)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="images" className="space-y-6">
            {/* Upload Section */}
            <QuickMediaUpload 
              motorId={motor.id} 
              onUploadComplete={fetchMotor}
            />
            
            <Separator />
            
            {/* Existing Images Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Current Images</h4>
              <div className="grid gap-4 md:grid-cols-3">
                {motor.images?.filter(image => {
                  const url = typeof image === 'string' ? image : image.url;
                  return url && 
                         !url.includes('facebook.com') && 
                         !url.includes('ThumbGenerator') &&
                         !url.includes('template') &&
                         !url.includes('tracking');
                }).map((image, index) => {
                  const imageUrl = typeof image === 'string' ? image : image.url;
                  const imageSource = typeof image === 'string' ? 'Unknown' : image.source || 'Unknown';
                  
                  return (
                    <div key={index} className="relative group space-y-2">
                      <img
                        src={imageUrl}
                        alt={`${motor.model} ${index + 1}`}
                        className="w-full h-32 object-cover rounded border"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.svg';
                          target.className = 'w-full h-32 object-cover rounded border opacity-50';
                        }}
                      />
                      <div className="text-xs text-muted-foreground">
                        <div>Source: {imageSource}</div>
                        <div className="truncate" title={imageUrl}>URL: {imageUrl}</div>
                      </div>
                    </div>
                  );
                })}
                {(!motor.images || motor.images.length === 0) && (
                  <div className="col-span-3 text-center text-muted-foreground py-8">
                    No images available for this motor
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sources" className="space-y-6">
            {/* Dropbox Integration Section */}
            <DropboxIntegration />
            
            <Separator />
            
            {/* Custom Sources Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Custom Data Sources</h4>
              <CustomSourceManager motorId={motor.id} motorModel={motor.model} />
            </div>
          </TabsContent>
        </Tabs>

        <Separator className="my-6" />

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Override data will take priority over scraped data
          </div>
          <div className="flex gap-2">
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Overrides
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};