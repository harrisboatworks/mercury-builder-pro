import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Plus, Phone, Mail, StickyNote } from 'lucide-react';

interface LogEntry {
  id: string;
  contact_type: string;
  notes: string | null;
  created_at: string;
}

interface Props {
  quoteId: string;
  customerEmail: string;
}

const contactTypes = [
  { value: 'call', label: 'Call', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'note', label: 'Note', icon: StickyNote },
];

const ContactLog = ({ quoteId, customerEmail }: Props) => {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newType, setNewType] = useState('note');
  const [newNotes, setNewNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase
      .from('quote_contact_log')
      .select('id, contact_type, notes, created_at')
      .eq('customer_email', customerEmail)
      .order('created_at', { ascending: false })
      .limit(20);
    setEntries((data as any) || []);
  };

  useEffect(() => { load(); }, [customerEmail]);

  const handleAdd = async () => {
    if (!newNotes.trim() || !user?.id) return;
    setSaving(true);
    const { error } = await supabase.from('quote_contact_log').insert({
      quote_id: quoteId,
      customer_email: customerEmail,
      contact_type: newType,
      notes: newNotes.trim(),
      contacted_by: user.id,
    } as any);
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to save log entry.', variant: 'destructive' });
    } else {
      // Also increment contact_attempts on the quote
      await supabase.rpc('increment_contact_attempts' as any, { quote_id: quoteId } as any).catch(() => {});
      setNewNotes('');
      setNewType('note');
      setIsAdding(false);
      load();
      toast({ title: 'Logged', description: 'Contact entry saved.' });
    }
    setSaving(false);
  };

  const getIcon = (type: string) => {
    const ct = contactTypes.find(c => c.value === type);
    const Icon = ct?.icon || StickyNote;
    return <Icon className="w-3.5 h-3.5" />;
  };

  return (
    <Card className="p-4">
      <h2 className="font-semibold mb-3 flex items-center gap-2">
        <MessageSquare className="w-4 h-4" />
        Contact Log
        <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setIsAdding(!isAdding)}>
          <Plus className="w-4 h-4" />
        </Button>
      </h2>

      {isAdding && (
        <div className="mb-3 p-3 border rounded-lg space-y-2 bg-muted/30">
          <div className="flex gap-1">
            {contactTypes.map(ct => (
              <Button
                key={ct.value}
                variant={newType === ct.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setNewType(ct.value)}
              >
                <ct.icon className="w-3.5 h-3.5 mr-1" />
                {ct.label}
              </Button>
            ))}
          </div>
          <Textarea
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder="What happened..."
            rows={2}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={saving || !newNotes.trim()}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No contact history yet.</p>
        ) : (
          entries.map(e => (
            <div key={e.id} className="flex gap-2 text-sm p-2 rounded hover:bg-muted/30">
              <div className="mt-0.5 text-muted-foreground">{getIcon(e.contact_type)}</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] px-1 py-0">{e.contact_type}</Badge>
                  {new Date(e.created_at).toLocaleString()}
                </div>
                <div className="mt-0.5">{e.notes}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default ContactLog;
