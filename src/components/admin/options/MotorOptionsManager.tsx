import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Search, PackagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

export default function MotorOptionsManager() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMotorId, setSelectedMotorId] = useState<string | null>(null);

  // Fetch motors
  const { data: motors = [] } = useQuery({
    queryKey: ['motors-list', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('motor_models')
        .select('id, model_display, horsepower, motor_type, family, year')
        .order('horsepower', { ascending: true });

      if (searchTerm) {
        query = query.ilike('model_display', `%${searchTerm}%`);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Fetch assigned options for selected motor
  const { data: assignedOptions = [] } = useQuery({
    queryKey: ['motor-option-assignments', selectedMotorId],
    queryFn: async () => {
      if (!selectedMotorId) return [];

      const { data, error } = await supabase
        .from('motor_option_assignments')
        .select(`
          *,
          motor_options (*)
        `)
        .eq('motor_id', selectedMotorId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!selectedMotorId,
  });

  // Fetch available options (not yet assigned)
  const { data: availableOptions = [] } = useQuery({
    queryKey: ['available-options', selectedMotorId],
    queryFn: async () => {
      if (!selectedMotorId) return [];

      const assignedIds = assignedOptions.map((a: any) => a.option_id);
      
      let query = supabase
        .from('motor_options')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (assignedIds.length > 0) {
        query = query.not('id', 'in', `(${assignedIds.join(',')})`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!selectedMotorId && assignedOptions !== undefined,
  });

  // Assign option mutation
  const assignMutation = useMutation({
    mutationFn: async ({ optionId, assignmentType }: { optionId: string; assignmentType: string }) => {
      if (!selectedMotorId) throw new Error('No motor selected');

      const { error } = await supabase
        .from('motor_option_assignments')
        .insert({
          motor_id: selectedMotorId,
          option_id: optionId,
          assignment_type: assignmentType,
          is_active: true,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motor-option-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['available-options'] });
      toast.success('Option assigned successfully');
    },
    onError: (error) => {
      toast.error('Failed to assign option: ' + error.message);
    },
  });

  // Remove assignment mutation
  const removeMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('motor_option_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motor-option-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['available-options'] });
      toast.success('Option removed');
    },
    onError: (error) => {
      toast.error('Failed to remove option: ' + error.message);
    },
  });

  // Update assignment mutation
  const updateMutation = useMutation({
    mutationFn: async ({ assignmentId, updates }: { assignmentId: string; updates: any }) => {
      const { error } = await supabase
        .from('motor_option_assignments')
        .update(updates)
        .eq('id', assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motor-option-assignments'] });
      toast.success('Option updated');
    },
  });

  const selectedMotor = motors.find((m: any) => m.id === selectedMotorId);

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Motor List */}
      <div className="col-span-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Select Motor</CardTitle>
            <CardDescription>Choose a motor to manage its options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search motors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {motors.map((motor: any) => (
                <Card
                  key={motor.id}
                  className={`cursor-pointer transition-colors ${
                    selectedMotorId === motor.id ? 'border-primary' : 'hover:border-muted-foreground/50'
                  }`}
                  onClick={() => setSelectedMotorId(motor.id)}
                >
                  <CardContent className="p-3">
                    <div className="font-medium text-sm">{motor.model_display}</div>
                    <div className="text-xs text-muted-foreground">
                      {motor.horsepower}HP • {motor.year}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Options Management */}
      <div className="col-span-8">
        {!selectedMotor ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <PackagePlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a motor from the list to manage its options</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Options for {selectedMotor.model_display}</CardTitle>
              <CardDescription>
                Assign options, set pricing, and configure requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="assigned">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="assigned">
                    Assigned Options ({assignedOptions.length})
                  </TabsTrigger>
                  <TabsTrigger value="available">
                    Add Options ({availableOptions.length})
                  </TabsTrigger>
                </TabsList>

                {/* Assigned Options Tab */}
                <TabsContent value="assigned" className="space-y-4 mt-4">
                  {assignedOptions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No options assigned yet. Add options from the "Add Options" tab.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {assignedOptions.map((assignment: any) => (
                        <Card key={assignment.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{assignment.motor_options.name}</h4>
                                  <Badge variant={
                                    assignment.assignment_type === 'required' ? 'destructive' :
                                    assignment.assignment_type === 'recommended' ? 'default' : 'outline'
                                  }>
                                    {assignment.assignment_type}
                                  </Badge>
                                  {assignment.is_included && (
                                    <Badge variant="secondary">Included</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {assignment.motor_options.short_description}
                                </p>
                                
                                <div className="grid grid-cols-3 gap-4 mt-3">
                                  <div>
                                    <Label htmlFor={`type-${assignment.id}`} className="text-xs">Type</Label>
                                    <Select
                                      value={assignment.assignment_type}
                                      onValueChange={(value) => 
                                        updateMutation.mutate({
                                          assignmentId: assignment.id,
                                          updates: { assignment_type: value }
                                        })
                                      }
                                    >
                                      <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="required">Required</SelectItem>
                                        <SelectItem value="recommended">Recommended</SelectItem>
                                        <SelectItem value="available">Available</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div>
                                    <Label htmlFor={`price-${assignment.id}`} className="text-xs">Price Override</Label>
                                    <Input
                                      id={`price-${assignment.id}`}
                                      type="number"
                                      step="0.01"
                                      placeholder={`$${assignment.motor_options.base_price}`}
                                      defaultValue={assignment.price_override || ''}
                                      onBlur={(e) => {
                                        const value = e.target.value ? parseFloat(e.target.value) : null;
                                        updateMutation.mutate({
                                          assignmentId: assignment.id,
                                          updates: { price_override: value }
                                        });
                                      }}
                                      className="h-8 text-xs"
                                    />
                                  </div>

                                  <div className="flex items-end">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <Checkbox
                                        checked={assignment.is_included}
                                        onCheckedChange={(checked) =>
                                          updateMutation.mutate({
                                            assignmentId: assignment.id,
                                            updates: { is_included: checked }
                                          })
                                        }
                                      />
                                      <span className="text-xs">Included (no charge)</span>
                                    </label>
                                  </div>
                                </div>

                                {assignment.notes && (
                                  <p className="text-xs text-muted-foreground mt-2 italic">
                                    {assignment.notes}
                                  </p>
                                )}
                              </div>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeMutation.mutate(assignment.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Available Options Tab */}
                <TabsContent value="available" className="space-y-4 mt-4">
                  {availableOptions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      All available options have been assigned to this motor.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {availableOptions.map((option: any) => (
                        <Card key={option.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{option.name}</h4>
                                  <Badge variant="outline">{option.category}</Badge>
                                </div>
                                {option.short_description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {option.short_description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  <span>Price: ${option.base_price.toFixed(2)}</span>
                                  {option.part_number && <span>Part: {option.part_number}</span>}
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => assignMutation.mutate({ optionId: option.id, assignmentType: 'required' })}
                                >
                                  Required
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => assignMutation.mutate({ optionId: option.id, assignmentType: 'recommended' })}
                                >
                                  Recommended
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => assignMutation.mutate({ optionId: option.id, assignmentType: 'available' })}
                                >
                                  Available
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
