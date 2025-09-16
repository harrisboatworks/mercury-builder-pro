import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings, Plus, Edit, Trash2, Play, Pause } from 'lucide-react';

interface AssignmentRule {
  id: string;
  rule_name: string;
  description: string;
  conditions: {
    hp_min?: number;
    hp_max?: number;
    model_family?: string;
    motor_type?: string;
    year_min?: number;
    year_max?: number;
  };
  media_assignments: string[];
  is_active: boolean;
  priority: number;
  created_at: string;
}

export function BulkAssignmentRules() {
  const [rules, setRules] = useState<AssignmentRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<Partial<AssignmentRule> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const { data, error } = await supabase
        .from('motor_media_assignment_rules')
        .select('*')
        .order('priority', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Failed to load assignment rules:', error);
      toast({
        title: "Failed to load rules",
        description: "Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveRule = async () => {
    if (!editingRule?.rule_name || !editingRule.conditions) {
      toast({
        title: "Missing information",
        description: "Please fill in the rule name and conditions.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingRule.id) {
        // Update existing rule
        const { error } = await supabase
          .from('motor_media_assignment_rules')
          .update({
            rule_name: editingRule.rule_name,
            description: editingRule.description || '',
            conditions: editingRule.conditions,
            media_assignments: editingRule.media_assignments || [],
            is_active: editingRule.is_active ?? true,
            priority: editingRule.priority ?? 0,
          })
          .eq('id', editingRule.id);

        if (error) throw error;
      } else {
        // Create new rule
        const { error } = await supabase
          .from('motor_media_assignment_rules')
          .insert({
            rule_name: editingRule.rule_name,
            description: editingRule.description || '',
            conditions: editingRule.conditions,
            media_assignments: editingRule.media_assignments || [],
            is_active: editingRule.is_active ?? true,
            priority: editingRule.priority ?? 0,
          });

        if (error) throw error;
      }

      toast({
        title: "Rule saved",
        description: "Bulk assignment rule has been saved successfully.",
      });

      setEditingRule(null);
      setShowForm(false);
      loadRules();
    } catch (error) {
      console.error('Failed to save rule:', error);
      toast({
        title: "Failed to save rule",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('motor_media_assignment_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRules(prev => prev.filter(rule => rule.id !== id));
      toast({
        title: "Rule deleted",
        description: "Assignment rule has been removed.",
      });
    } catch (error) {
      console.error('Failed to delete rule:', error);
      toast({
        title: "Failed to delete rule",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleRule = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('motor_media_assignment_rules')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;

      setRules(prev => prev.map(rule => 
        rule.id === id ? { ...rule, is_active: isActive } : rule
      ));
    } catch (error) {
      console.error('Failed to toggle rule:', error);
      toast({
        title: "Failed to update rule",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const startEditing = (rule?: AssignmentRule) => {
    setEditingRule(rule ? { ...rule } : {
      rule_name: '',
      description: '',
      conditions: {},
      media_assignments: [],
      is_active: true,
      priority: 0,
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Bulk Assignment Rules
            </div>
            <Button onClick={() => startEditing()}>
              <Plus className="h-4 w-4 mr-2" />
              New Rule
            </Button>
          </CardTitle>
          <CardDescription>
            Create rules to automatically assign media to groups of motors based on horsepower, model family, or other criteria.
          </CardDescription>
        </CardHeader>
      </Card>

      {showForm && editingRule && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingRule.id ? 'Edit Assignment Rule' : 'Create New Assignment Rule'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rule-name">Rule Name</Label>
                <Input
                  id="rule-name"
                  placeholder="e.g., FourStroke 15-25HP Gallery Images"
                  value={editingRule.rule_name || ''}
                  onChange={(e) => setEditingRule(prev => ({ ...prev, rule_name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  placeholder="0"
                  value={editingRule.priority || 0}
                  onChange={(e) => setEditingRule(prev => ({ ...prev, priority: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this rule does..."
                value={editingRule.description || ''}
                onChange={(e) => setEditingRule(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="hp-min">Min HP</Label>
                <Input
                  id="hp-min"
                  type="number"
                  placeholder="15"
                  value={editingRule.conditions?.hp_min || ''}
                  onChange={(e) => setEditingRule(prev => ({
                    ...prev,
                    conditions: {
                      ...prev?.conditions,
                      hp_min: e.target.value ? Number(e.target.value) : undefined
                    }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="hp-max">Max HP</Label>
                <Input
                  id="hp-max"
                  type="number"
                  placeholder="25"
                  value={editingRule.conditions?.hp_max || ''}
                  onChange={(e) => setEditingRule(prev => ({
                    ...prev,
                    conditions: {
                      ...prev?.conditions,
                      hp_max: e.target.value ? Number(e.target.value) : undefined
                    }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="model-family">Model Family</Label>
                <Select
                  value={editingRule.conditions?.model_family || ''}
                  onValueChange={(value) => setEditingRule(prev => ({
                    ...prev,
                    conditions: {
                      ...prev?.conditions,
                      model_family: value || undefined
                    }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select family" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    <SelectItem value="FourStroke">FourStroke</SelectItem>
                    <SelectItem value="ProXS">Pro XS</SelectItem>
                    <SelectItem value="Verado">Verado</SelectItem>
                    <SelectItem value="SeaPro">SeaPro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is-active"
                checked={editingRule.is_active ?? true}
                onCheckedChange={(checked) => setEditingRule(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is-active">Rule is active</Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={saveRule}>
                Save Rule
              </Button>
              <Button variant="outline" onClick={() => {
                setEditingRule(null);
                setShowForm(false);
              }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Active Rules</CardTitle>
          <CardDescription>
            Manage your bulk assignment rules for automatic media assignment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading rules...</div>
          ) : rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No assignment rules created yet. Create your first rule to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <Card key={rule.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{rule.rule_name}</h4>
                        <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">Priority: {rule.priority}</Badge>
                      </div>
                      
                      {rule.description && (
                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                      )}

                      <div className="flex flex-wrap gap-2 text-sm">
                        {rule.conditions.hp_min && (
                          <Badge variant="outline">Min HP: {rule.conditions.hp_min}</Badge>
                        )}
                        {rule.conditions.hp_max && (
                          <Badge variant="outline">Max HP: {rule.conditions.hp_max}</Badge>
                        )}
                        {rule.conditions.model_family && (
                          <Badge variant="outline">Family: {rule.conditions.model_family}</Badge>
                        )}
                        <Badge variant="outline">
                          Media Items: {rule.media_assignments.length}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleRule(rule.id, !rule.is_active)}
                      >
                        {rule.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditing(rule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}