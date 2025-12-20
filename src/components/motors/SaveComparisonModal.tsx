import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Save className="text-primary" size={20} />
                  <h3 className="font-semibold text-lg">Save Comparison</h3>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Save this comparison to your account for later reference.
                </p>
                
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
              </div>
              
              {/* Footer */}
              <div className="p-4 bg-muted/30 border-t border-border flex gap-3">
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
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}