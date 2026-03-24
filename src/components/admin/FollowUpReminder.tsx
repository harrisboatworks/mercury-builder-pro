import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CalendarClock, Check, X } from 'lucide-react';

interface Props {
  quoteId: string;
  currentDate: string | null;
  onUpdate: (newDate: string | null) => void;
}

const FollowUpReminder = ({ quoteId, currentDate, onUpdate }: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [date, setDate] = useState(currentDate ? currentDate.slice(0, 10) : '');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    const followUpDate = date ? new Date(date).toISOString() : null;
    const { error } = await supabase
      .from('customer_quotes')
      .update({ follow_up_date: followUpDate } as any)
      .eq('id', quoteId);
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to set reminder.', variant: 'destructive' });
    } else {
      onUpdate(followUpDate);
      setIsEditing(false);
      toast({ title: followUpDate ? 'Reminder Set' : 'Reminder Cleared' });
    }
    setSaving(false);
  };

  const handleClear = async () => {
    setDate('');
    setSaving(true);
    const { error } = await supabase
      .from('customer_quotes')
      .update({ follow_up_date: null } as any)
      .eq('id', quoteId);
    if (!error) {
      onUpdate(null);
      setIsEditing(false);
      toast({ title: 'Reminder Cleared' });
    }
    setSaving(false);
  };

  const isOverdue = currentDate && new Date(currentDate) < new Date();
  const isToday = currentDate && new Date(currentDate).toDateString() === new Date().toDateString();

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <CalendarClock className="w-4 h-4 text-muted-foreground" />
      {!isEditing ? (
        <>
          {currentDate ? (
            <Badge 
              variant={isOverdue ? 'destructive' : isToday ? 'default' : 'secondary'}
              className="cursor-pointer"
              onClick={() => setIsEditing(true)}
            >
              Follow-up: {new Date(currentDate).toLocaleDateString()}
              {isOverdue && !isToday && ' (overdue)'}
              {isToday && ' (today!)'}
            </Badge>
          ) : (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setIsEditing(true)}>
              Set follow-up
            </Button>
          )}
        </>
      ) : (
        <div className="flex items-center gap-1">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-7 w-[140px] text-xs"
          />
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSave} disabled={saving}>
            <Check className="w-3.5 h-3.5" />
          </Button>
          {currentDate && (
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleClear} disabled={saving}>
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};

export default FollowUpReminder;
