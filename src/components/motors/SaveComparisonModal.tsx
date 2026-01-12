import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

interface SaveComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  motorIds: string[];
  onSaved: () => void;
}

export function SaveComparisonModal({ 
  isOpen, 
  onClose, 
  motorIds,
  onSaved 
}: SaveComparisonModalProps) {
  const isMobile = useIsMobile();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please log in to save comparisons');
        return;
      }

      const { error } = await supabase
        .from('saved_comparisons')
        .insert({
          user_id: user.id,
          name: name.trim() || `Comparison ${new Date().toLocaleDateString()}`,
          motor_ids: motorIds
        });

      if (error) throw error;
      
      onSaved();
      setName('');
    } catch (err) {
      console.error('Error saving comparison:', err);
      toast.error('Failed to save comparison');
    } finally {
      setSaving(false);
    }
  };

  const descriptionText = "Save this comparison to your account for later reference.";

  // Shared form content
  const formContent = (
    <div className="space-y-2">
      <Label htmlFor="comparison-name">Name (optional)</Label>
      <Input 
        id="comparison-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g., Bass Boat Options"
        className="w-full"
      />
    </div>
  );

  // Shared buttons
  const formButtons = (
    <div className="flex gap-3">
      <Button onClick={onClose} variant="ghost" className="flex-1">
        Cancel
      </Button>
      <Button 
        onClick={handleSave} 
        className="flex-1 gap-2"
        disabled={saving}
      >
        {saving ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Save size={16} />
        )}
        Save
      </Button>
    </div>
  );

  // Mobile: Bottom drawer
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="px-4 pb-8">
          <DrawerHeader className="text-left">
            <div className="flex items-center gap-2">
              <Save className="text-primary" size={20} />
              <DrawerTitle>Save Comparison</DrawerTitle>
            </div>
            <DrawerDescription>{descriptionText}</DrawerDescription>
          </DrawerHeader>

          <div className="px-4">
            {formContent}
          </div>

          <DrawerFooter className="pt-4">
            {formButtons}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Centered dialog
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Save className="text-primary" size={20} />
            <DialogTitle>Save Comparison</DialogTitle>
          </div>
          <DialogDescription>{descriptionText}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {formContent}
        </div>

        <div className="bg-muted/30 -mx-6 -mb-6 px-6 py-4 border-t border-border rounded-b-lg">
          {formButtons}
        </div>
      </DialogContent>
    </Dialog>
  );
}
