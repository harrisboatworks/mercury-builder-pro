import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
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

interface MotorOption {
  id?: string;
  name: string;
  description: string | null;
  short_description: string | null;
  category: string;
  base_price: number;
  msrp: number | null;
  image_url: string | null;
  part_number: string | null;
  is_active: boolean;
  is_taxable: boolean;
  display_order: number;
}

const CATEGORIES = [
  { value: 'accessory', label: 'Accessory' },
  { value: 'upgrade', label: 'Upgrade' },
  { value: 'kit', label: 'Kit' },
  { value: 'propeller', label: 'Propeller' },
  { value: 'rigging', label: 'Rigging' },
  { value: 'controls', label: 'Controls' },
  { value: 'maintenance', label: 'Maintenance' },
];

export default function MotorOptionsCatalog() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingOption, setEditingOption] = useState<MotorOption | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteOptionId, setDeleteOptionId] = useState<string | null>(null);

  // Fetch options
  const { data: options = [], isLoading } = useQuery({
    queryKey: ['motor-options', searchTerm, selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('motor_options')
        .select('*')
        .order('category', { ascending: true })
        .order('display_order', { ascending: true });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,part_number.ilike.%${searchTerm}%`);
      }

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (option: MotorOption) => {
      if (option.id) {
        const { error } = await supabase
          .from('motor_options')
          .update(option)
          .eq('id', option.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('motor_options')
          .insert([option]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motor-options'] });
      setIsDialogOpen(false);
      setEditingOption(null);
      toast.success(editingOption?.id ? 'Option updated successfully' : 'Option created successfully');
    },
    onError: (error) => {
      toast.error('Failed to save option: ' + error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('motor_options')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motor-options'] });
      toast.success('Option deleted successfully');
      setDeleteOptionId(null);
    },
    onError: (error) => {
      toast.error('Failed to delete option: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const option: MotorOption = {
      id: editingOption?.id,
      name: formData.get('name') as string,
      description: formData.get('description') as string || null,
      short_description: formData.get('short_description') as string || null,
      category: formData.get('category') as string,
      base_price: parseFloat(formData.get('base_price') as string) || 0,
      msrp: parseFloat(formData.get('msrp') as string) || null,
      image_url: formData.get('image_url') as string || null,
      part_number: formData.get('part_number') as string || null,
      is_active: formData.get('is_active') === 'true',
      is_taxable: formData.get('is_taxable') === 'true',
      display_order: parseInt(formData.get('display_order') as string) || 0,
    };

    saveMutation.mutate(option);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Motor Options Catalog</h2>
          <p className="text-muted-foreground">Manage the central catalog of motor options and accessories</p>
        </div>
        <Button onClick={() => { setEditingOption(null); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Option
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search options..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Options Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading options...</div>
      ) : options.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No options found. Create your first option to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {options.map((option: any) => (
            <Card key={option.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{option.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {CATEGORIES.find(c => c.value === option.category)?.label}
                      {option.part_number && ` • ${option.part_number}`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setEditingOption(option); setIsDialogOpen(true); }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteOptionId(option.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price:</span>
                    <span className="font-semibold">${option.base_price.toFixed(2)}</span>
                  </div>
                  {option.msrp && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">MSRP:</span>
                      <span className="text-xs line-through">${option.msrp.toFixed(2)}</span>
                    </div>
                  )}
                  {option.short_description && (
                    <p className="text-xs text-muted-foreground mt-2">{option.short_description}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOption ? 'Edit Option' : 'Create New Option'}</DialogTitle>
            <DialogDescription>
              {editingOption ? 'Update option details' : 'Add a new option to the catalog'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" name="name" defaultValue={editingOption?.name} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select name="category" defaultValue={editingOption?.category || 'accessory'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="part_number">Part Number</Label>
                <Input id="part_number" name="part_number" defaultValue={editingOption?.part_number || ''} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="base_price">Price *</Label>
                <Input
                  id="base_price"
                  name="base_price"
                  type="number"
                  step="0.01"
                  defaultValue={editingOption?.base_price || 0}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="msrp">MSRP</Label>
                <Input
                  id="msrp"
                  name="msrp"
                  type="number"
                  step="0.01"
                  defaultValue={editingOption?.msrp || ''}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="short_description">Short Description</Label>
                <Input
                  id="short_description"
                  name="short_description"
                  defaultValue={editingOption?.short_description || ''}
                  placeholder="Brief description for card view"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="description">Full Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingOption?.description || ''}
                  rows={3}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  name="image_url"
                  defaultValue={editingOption?.image_url || ''}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  name="display_order"
                  type="number"
                  defaultValue={editingOption?.display_order || 0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="is_taxable">Taxable</Label>
                <Select name="is_taxable" defaultValue={editingOption?.is_taxable !== false ? 'true' : 'false'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="is_active">Status</Label>
                <Select name="is_active" defaultValue={editingOption?.is_active !== false ? 'true' : 'false'}>
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
                {saveMutation.isPending ? 'Saving...' : editingOption ? 'Update Option' : 'Create Option'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteOptionId} onOpenChange={() => setDeleteOptionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Option</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this option? This will also remove all motor assignments and rules. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteOptionId && deleteMutation.mutate(deleteOptionId)}
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
