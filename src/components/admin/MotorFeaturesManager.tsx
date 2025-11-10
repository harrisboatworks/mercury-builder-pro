import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, GripVertical, Sparkles, Zap, Cog, Star, Gauge, Flame, Bolt, Rocket, Activity, Cpu, Settings, Wrench, Monitor, Wifi, Droplet, Wind, Leaf, Battery, Shield, Award, CheckCircle, Target, Layers, CircuitBoard } from 'lucide-react';

interface CustomFeature {
  id: string;
  title: string;
  description: string;
  category: 'Performance' | 'Design' | 'Convenience' | 'Technology' | 'Durability' | 'Fuel Economy';
  order: number;
  icon?: 'sparkles' | 'zap' | 'cog' | 'star' | 'gauge' | 'flame' | 'bolt' | 'rocket' | 'activity' | 'cpu' | 'settings' | 'wrench' | 'monitor' | 'wifi' | 'droplet' | 'wind' | 'leaf' | 'battery' | 'shield' | 'award' | 'checkCircle' | 'target' | 'layers' | 'circuitBoard';
}

interface MotorFeaturesManagerProps {
  motor: {
    id: string;
    model_display: string;
    horsepower: number;
    features?: CustomFeature[];
  };
  onFeaturesUpdated?: () => void;
}

const categoryColors = {
  'Performance': 'bg-red-100 text-red-800 border-red-200',
  'Design': 'bg-blue-100 text-blue-800 border-blue-200', 
  'Convenience': 'bg-green-100 text-green-800 border-green-200',
  'Technology': 'bg-purple-100 text-purple-800 border-purple-200',
  'Durability': 'bg-orange-100 text-orange-800 border-orange-200',
  'Fuel Economy': 'bg-emerald-100 text-emerald-800 border-emerald-200'
};

const featureIcons = {
  sparkles: Sparkles,
  zap: Zap,
  cog: Cog,
  star: Star,
  gauge: Gauge,
  flame: Flame,
  bolt: Bolt,
  rocket: Rocket,
  activity: Activity,
  cpu: Cpu,
  settings: Settings,
  wrench: Wrench,
  monitor: Monitor,
  wifi: Wifi,
  droplet: Droplet,
  wind: Wind,
  leaf: Leaf,
  battery: Battery,
  shield: Shield,
  award: Award,
  checkCircle: CheckCircle,
  target: Target,
  layers: Layers,
  circuitBoard: CircuitBoard
};

const featureTemplates = {
  'Performance': [
    { title: 'Advanced Combustion System', description: 'Optimized fuel and air mixture for maximum power output and efficiency', icon: 'zap' as const },
    { title: 'Precision Machined Components', description: 'Computer-controlled machining ensures perfect tolerances for optimal performance', icon: 'cog' as const },
    { title: 'High-Performance Cooling', description: 'Advanced cooling system maintains optimal operating temperature under all conditions', icon: 'sparkles' as const }
  ],
  'Design': [
    { title: 'Compact & Lightweight Design', description: 'Engineered for optimal power-to-weight ratio without compromising durability', icon: 'star' as const },
    { title: 'Streamlined Cowling', description: 'Aerodynamic design reduces drag and improves overall boat performance', icon: 'sparkles' as const },
    { title: 'Integrated Cable Routing', description: 'Clean, protected cable routing for professional installation appearance', icon: 'cog' as const }
  ],
  'Technology': [
    { title: 'SmartCraft Integration', description: 'Advanced engine monitoring and diagnostics for optimal performance', icon: 'zap' as const },
    { title: 'Digital Throttle & Shift', description: 'Precise electronic controls for smooth operation and enhanced reliability', icon: 'cog' as const },
    { title: 'Advanced Fuel Management', description: 'Intelligent fuel system optimizes consumption across all RPM ranges', icon: 'sparkles' as const }
  ]
};

export function MotorFeaturesManager({ motor, onFeaturesUpdated }: MotorFeaturesManagerProps) {
  const [features, setFeatures] = useState<CustomFeature[]>([]);
  const [editingFeature, setEditingFeature] = useState<CustomFeature | null>(null);
  const [isAddingFeature, setIsAddingFeature] = useState(false);
  const [newFeature, setNewFeature] = useState<Partial<CustomFeature>>({
    category: 'Performance',
    icon: 'sparkles'
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadFeatures();
  }, [motor.id]);

  const loadFeatures = async () => {
    try {
      const { data, error } = await supabase
        .from('motor_models')
        .select('features')
        .eq('id', motor.id)
        .single();

      if (error) throw error;

      const loadedFeatures = (data?.features as CustomFeature[]) || [];
      setFeatures(loadedFeatures.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error('Error loading features:', error);
      toast({
        title: "Error loading features",
        description: "Failed to load motor features. Please try again.",
        variant: "destructive",
      });
    }
  };

  const saveFeatures = async (updatedFeatures: CustomFeature[]) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('motor_models')
        .update({ features: updatedFeatures })
        .eq('id', motor.id);

      if (error) throw error;

      setFeatures(updatedFeatures);
      toast({
        title: "Features updated",
        description: "Motor features have been successfully updated.",
      });
      onFeaturesUpdated?.();
    } catch (error) {
      console.error('Error saving features:', error);
      toast({
        title: "Save failed",
        description: "Failed to save features. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addFeature = () => {
    if (!newFeature.title || !newFeature.description) {
      toast({
        title: "Missing information",
        description: "Please fill in both title and description.",
        variant: "destructive",
      });
      return;
    }

    const feature: CustomFeature = {
      id: `feature_${Date.now()}`,
      title: newFeature.title,
      description: newFeature.description,
      category: newFeature.category || 'Performance',
      order: features.length,
      icon: newFeature.icon || 'sparkles'
    };

    const updatedFeatures = [...features, feature];
    saveFeatures(updatedFeatures);

    setNewFeature({ category: 'Performance', icon: 'sparkles' });
    setIsAddingFeature(false);
  };

  const updateFeature = (updatedFeature: CustomFeature) => {
    const updatedFeatures = features.map(f => 
      f.id === updatedFeature.id ? updatedFeature : f
    );
    saveFeatures(updatedFeatures);
    setEditingFeature(null);
  };

  const deleteFeature = (featureId: string) => {
    const updatedFeatures = features.filter(f => f.id !== featureId);
    saveFeatures(updatedFeatures);
  };

  const addTemplateFeature = (template: typeof featureTemplates.Performance[0], category: string) => {
    const feature: CustomFeature = {
      id: `feature_${Date.now()}`,
      title: template.title,
      description: template.description,
      category: category as CustomFeature['category'],
      order: features.length,
      icon: template.icon
    };

    const updatedFeatures = [...features, feature];
    saveFeatures(updatedFeatures);
  };

  const FeatureIcon = ({ icon }: { icon?: string }) => {
    const IconComponent = featureIcons[icon as keyof typeof featureIcons] || Sparkles;
    return <IconComponent className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Custom Features</h3>
          <p className="text-sm text-muted-foreground">
            Add detailed features to enhance the motor's product page
          </p>
        </div>
        <Button onClick={() => setIsAddingFeature(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Feature
        </Button>
      </div>

      {/* Feature Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quick Add Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(featureTemplates).map(([category, templates]) => (
              <div key={category} className="space-y-2">
                <Badge variant="outline" className={categoryColors[category as keyof typeof categoryColors]}>
                  {category}
                </Badge>
                {templates.map((template, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-left h-auto p-2"
                    onClick={() => addTemplateFeature(template, category)}
                  >
                    <FeatureIcon icon={template.icon} />
                    <span className="ml-2 text-xs">{template.title}</span>
                  </Button>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Features List */}
      <ScrollArea className="h-96">
        <div className="space-y-3">
          {features.map((feature) => (
            <Card key={feature.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <GripVertical className="w-4 h-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FeatureIcon icon={feature.icon} />
                        <h4 className="font-medium">{feature.title}</h4>
                        <Badge variant="outline" className={categoryColors[feature.category]}>
                          {feature.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingFeature(feature)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteFeature(feature.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {features.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No custom features added yet.</p>
              <p className="text-sm">Add features to enhance the motor's product page.</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Add Feature Dialog */}
      <Dialog open={isAddingFeature} onOpenChange={setIsAddingFeature}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Feature</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Feature Title</Label>
              <Input
                id="title"
                value={newFeature.title || ''}
                onChange={(e) => setNewFeature({ ...newFeature, title: e.target.value })}
                placeholder="e.g., Advanced Combustion System"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newFeature.description || ''}
                onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
                placeholder="Detailed description of the feature and its benefits..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newFeature.category}
                  onValueChange={(value) => setNewFeature({ ...newFeature, category: value as CustomFeature['category'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[100] bg-white dark:bg-gray-800">
                    {Object.keys(categoryColors).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="icon">Icon</Label>
                <Select
                  value={newFeature.icon}
                  onValueChange={(value) => setNewFeature({ ...newFeature, icon: value as CustomFeature['icon'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[100] bg-white dark:bg-gray-800">
                    {Object.entries(featureIcons).map(([key, Icon]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {key}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingFeature(false)}>
                Cancel
              </Button>
              <Button onClick={addFeature} disabled={loading}>
                Add Feature
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Feature Dialog */}
      <Dialog open={!!editingFeature} onOpenChange={() => setEditingFeature(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Feature</DialogTitle>
          </DialogHeader>
          {editingFeature && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Feature Title</Label>
                <Input
                  id="edit-title"
                  value={editingFeature.title}
                  onChange={(e) => setEditingFeature({ ...editingFeature, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingFeature.description}
                  onChange={(e) => setEditingFeature({ ...editingFeature, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    value={editingFeature.category}
                    onValueChange={(value) => setEditingFeature({ ...editingFeature, category: value as CustomFeature['category'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  <SelectContent className="z-[100] bg-white dark:bg-gray-800">
                    {Object.keys(categoryColors).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-icon">Icon</Label>
                  <Select
                    value={editingFeature.icon}
                    onValueChange={(value) => setEditingFeature({ ...editingFeature, icon: value as CustomFeature['icon'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  <SelectContent className="z-[100] bg-white dark:bg-gray-800">
                    {Object.entries(featureIcons).map(([key, Icon]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {key}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingFeature(null)}>
                  Cancel
                </Button>
                <Button onClick={() => updateFeature(editingFeature)} disabled={loading}>
                  Update Feature
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}