import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Lock, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Note {
  id: string;
  content: string;
  created_at: string;
  created_by: string | null;
  author_name: string;
}

interface NotesTimelineProps {
  applicationId: string;
  notesHistory: Note[];
  onNotesUpdate: () => void;
}

export function NotesTimeline({ applicationId, notesHistory, onNotesUpdate }: NotesTimelineProps) {
  const [newNote, setNewNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save debounced
  useEffect(() => {
    if (!newNote.trim()) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      handleAutoSave();
    }, 2000);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [newNote]);

  const handleAutoSave = async () => {
    if (!newNote.trim()) return;

    setIsSaving(true);
    await saveNote();
    setIsSaving(false);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error('Note cannot be empty');
      return;
    }

    setIsSaving(true);
    const success = await saveNote();
    setIsSaving(false);

    if (success) {
      setNewNote('');
      toast.success('Note added successfully');
    }
  };

  const saveNote = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user profile for name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, display_name')
        .eq('user_id', user.id)
        .single();

      const authorName = profile?.display_name || profile?.full_name || user.email?.split('@')[0] || 'Admin';

      // Get current notes history
      const { data: application } = await supabase
        .from('financing_applications')
        .select('notes_history')
        .eq('id', applicationId)
        .single();

      const currentHistory = (application?.notes_history as Note[]) || [];

      // Add new note to history
      const newNoteObj: Note = {
        id: crypto.randomUUID(),
        content: newNote.trim(),
        created_at: new Date().toISOString(),
        created_by: user.id,
        author_name: authorName,
      };

      const updatedHistory = [...currentHistory, newNoteObj];

      // Update database
      const { error } = await supabase
        .from('financing_applications')
        .update({ notes_history: updatedHistory })
        .eq('id', applicationId);

      if (error) throw error;

      onNotesUpdate();
      return true;
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save note');
      return false;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sortedNotes = [...notesHistory].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-4">
      {/* Add New Note */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="newNote" className="flex items-center gap-2">
            <Lock className="h-3 w-3" />
            Internal Notes
          </Label>
          {isSaving && <span className="text-xs text-muted-foreground">Saving...</span>}
          {showSaved && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Saved
            </span>
          )}
        </div>
        <Textarea
          id="newNote"
          placeholder="Add internal notes about this application..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          rows={3}
          className="resize-none"
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {newNote.length}/1000 characters
          </span>
          <Button
            onClick={handleAddNote}
            disabled={!newNote.trim() || isSaving}
            size="sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Note'
            )}
          </Button>
        </div>
      </div>

      {/* Notes History */}
      {sortedNotes.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Notes History</Label>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sortedNotes.map((note) => (
              <Card key={note.id} className="p-3">
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(note.author_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{note.author_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {sortedNotes.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No notes yet. Add the first note above.
        </p>
      )}
    </div>
  );
}
