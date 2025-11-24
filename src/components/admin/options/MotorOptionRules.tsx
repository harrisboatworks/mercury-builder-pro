import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, TestTube2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface OptionRule {
  id?: string;
  rule_name: string;
  description: string | null;
  option_id: string;
  conditions: {
    hp_min?: number;
    hp_max?: number;
    motor_family?: string;
    motor_type?: string;
    is_tiller?: boolean;
    year_min?: number;
  };
  assignment_type: string;
  price_override: number | null;
  priority: number;
  is_active: boolean;
}

export default function MotorOptionRules() {
  const queryClient = useQueryClient();
  const [editingRule, setEditingRule] = useState<OptionRule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null);

  // Fetch rules
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['motor-option-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('motor_option_rules')
        .select(`
          *,
          motor_options (id, name, category, base_price)
        `)
        .order('priority', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch available options for dropdown
  const { data: options = [] } = useQuery({
    queryKey: ['motor-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('motor_options')
        .select('id, name, category, base_price')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (rule: OptionRule) => {
      if (rule.id) {
        const { error } = await supabase
          .from('motor_option_rules')
          .update(rule)
          .eq('id', rule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('motor_option_rules')
          .insert([rule]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motor-option-rules'] });
      setIsDialogOpen(false);
      setEditingRule(null);
      toast.success(editingRule?.id ? 'Rule updated successfully' : 'Rule created successfully');
    },
    onError: (error) => {
      toast.error('Failed to save rule: ' + error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('motor_option_rules')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motor-option-rules'] });
      toast.success('Rule deleted successfully');
      setDeleteRuleId(null);
    },
    onError: (error) => {
      toast.error('Failed to delete rule: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const conditions: any = {};
    
    const hpMin = formData.get('hp_min') as string;
    const hpMax = formData.get('hp_max') as string;
    const motorFamily = formData.get('motor_family') as string;
    const motorType = formData.get('motor_type') as string;
    const isTiller = formData.get('is_tiller') as string;
    const yearMin = formData.get('year_min') as string;

    if (hpMin) conditions.hp_min = parseFloat(hpMin);
    if (hpMax) conditions.hp_max = parseFloat(hpMax);
    if (motorFamily && motorFamily !== 'any') conditions.motor_family = motorFamily;
    if (motorType && motorType !== 'any') conditions.motor_type = motorType;
    if (isTiller && isTiller !== 'any') conditions.is_tiller = isTiller === 'true';
    if (yearMin) conditions.year_min = parseInt(yearMin);

    const rule: OptionRule = {
      id: editingRule?.id,
      rule_name: formData.get('rule_name') as string,
      description: formData.get('description') as string || null,
      option_id: formData.get('option_id') as string,
      conditions,
      assignment_type: formData.get('assignment_type') as string,
      price_override: parseFloat(formData.get('price_override') as string) || null,
      priority: parseInt(formData.get('priority') as string) || 0,
      is_active: formData.get('is_active') === 'true',
    };

    saveMutation.mutate(rule);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Motor Option Rules</h2>
          <p className="text-muted-foreground">Define rule-based auto-assignments for motor options</p>
        </div>
        <Button onClick={() => { setEditingRule(null); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading rules...</div>
      ) : rules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No rules defined yet. Create your first rule to auto-assign options based on motor characteristics.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rules.map((rule: any) => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{rule.rule_name}</CardTitle>
                      <Badge variant={
                        rule.assignment_type === 'required' ? 'destructive' :
                        rule.assignment_type === 'recommended' ? 'default' : 'outline'
                      }>
                        {rule.assignment_type}
                      </Badge>
                      {!rule.is_active && <Badge variant="secondary">Inactive</Badge>}
                    </div>
                    <CardDescription className="mt-1">
                      Option: {rule.motor_options?.name} • Priority: {rule.priority}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setEditingRule(rule); setIsDialogOpen(true); }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteRuleId(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {rule.description && (
                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-2 text-xs">
                    {rule.conditions.hp_min && (
                      <Badge variant="outline">HP Min: {rule.conditions.hp_min}</Badge>
                    )}
                    {rule.conditions.hp_max && (
                      <Badge variant="outline">HP Max: {rule.conditions.hp_max}</Badge>
                    )}
                    {rule.conditions.motor_family && (
                      <Badge variant="outline">Family: {rule.conditions.motor_family}</Badge>
                    )}
                    {rule.conditions.motor_type && (
                      <Badge variant="outline">Type: {rule.conditions.motor_type}</Badge>
                    )}
                    {rule.conditions.is_tiller !== undefined && (
                      <Badge variant="outline">Tiller: {rule.conditions.is_tiller ? 'Yes' : 'No'}</Badge>
                    )}
                    {rule.conditions.year_min && (
                      <Badge variant="outline">Year Min: {rule.conditions.year_min}</Badge>
                    )}
                  </div>

                  {rule.price_override && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Price Override:</span>{' '}
                      <span className="font-medium">${rule.price_override.toFixed(2)}</span>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit Rule' : 'Create New Rule'}</DialogTitle>
            <DialogDescription>
              Define conditions to auto-assign options to matching motors
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="rule_name">Rule Name *</Label>
                <Input id="rule_name" name="rule_name" defaultValue={editingRule?.rule_name} required />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingRule?.description || ''}
                  rows={2}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="option_id">Option *</Label>
                <Select name="option_id" defaultValue={editingRule?.option_id} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((opt: any) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.name} ({opt.category}) - ${opt.base_price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <h3 className="text-sm font-semibold mb-3">Conditions (leave blank for "any")</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hp_min">Min HP</Label>
                    <Input
                      id="hp_min"
                      name="hp_min"
                      type="number"
                      step="0.1"
                      defaultValue={editingRule?.conditions?.hp_min || ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hp_max">Max HP</Label>
                    <Input
                      id="hp_max"
                      name="hp_max"
                      type="number"
                      step="0.1"
                      defaultValue={editingRule?.conditions?.hp_max || ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motor_family">Motor Family</Label>
                    <Select name="motor_family" defaultValue={editingRule?.conditions?.motor_family || 'any'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="FourStroke">FourStroke</SelectItem>
                        <SelectItem value="ProXS">ProXS</SelectItem>
                        <SelectItem value="Verado">Verado</SelectItem>
                        <SelectItem value="SeaPro">SeaPro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motor_type">Motor Type</Label>
                    <Select name="motor_type" defaultValue={editingRule?.conditions?.motor_type || 'any'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="Outboard">Outboard</SelectItem>
                        <SelectItem value="Pontoon">Pontoon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="is_tiller">Tiller Motor?</Label>
                    <Select name="is_tiller" defaultValue={
                      editingRule?.conditions?.is_tiller === undefined ? 'any' :
                      editingRule.conditions.is_tiller ? 'true' : 'false'
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year_min">Min Year</Label>
                    <Input
                      id="year_min"
                      name="year_min"
                      type="number"
                      defaultValue={editingRule?.conditions?.year_min || ''}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignment_type">Assignment Type *</Label>
                <Select name="assignment_type" defaultValue={editingRule?.assignment_type || 'available'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="required">Required</SelectItem>
                    <SelectItem value="recommended">Recommended</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  name="priority"
                  type="number"
                  defaultValue={editingRule?.priority || 0}
                  placeholder="0 = lowest"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price_override">Price Override</Label>
                <Input
                  id="price_override"
                  name="price_override"
                  type="number"
                  step="0.01"
                  defaultValue={editingRule?.price_override || ''}
                  placeholder="Leave blank for base price"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="is_active">Status</Label>
                <Select name="is_active" defaultValue={editingRule?.is_active !== false ? 'true' : 'false'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Rule'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRuleId} onOpenChange={() => setDeleteRuleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this rule? Motors currently assigned via this rule will keep their assignments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRuleId && deleteMutation.mutate(deleteRuleId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
