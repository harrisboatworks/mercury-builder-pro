import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Folder, ChevronRight, ArrowLeft, Loader2, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';

interface DropboxFolder {
  name: string;
  path: string;
}

interface DropboxFolderBrowserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectFolder: (path: string) => void;
}

export function DropboxFolderBrowser({ open, onOpenChange, onSelectFolder }: DropboxFolderBrowserProps) {
  const [folders, setFolders] = useState<DropboxFolder[]>([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const loadFolders = async (path: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('browse-dropbox-folders', {
        body: { path: path === '/' ? '' : path },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setFolders(data.folders);
      setCurrentPath(data.currentPath);
      setParentPath(data.parentPath);
    } catch (err: any) {
      console.error('Failed to load folders:', err);
      toast.error('Failed to load Dropbox folders', {
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Load root folders when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && !initialized) {
      setInitialized(true);
      loadFolders('');
    }
    if (!isOpen) {
      setInitialized(false);
      setFolders([]);
      setCurrentPath('/');
      setParentPath(null);
    }
    onOpenChange(isOpen);
  };

  const navigateToFolder = (path: string) => {
    loadFolders(path);
  };

  const goBack = () => {
    if (parentPath !== null) {
      loadFolders(parentPath);
    }
  };

  const selectCurrentFolder = () => {
    onSelectFolder(currentPath === '/' ? '' : currentPath);
    onOpenChange(false);
  };

  // Build breadcrumb parts
  const breadcrumbParts = currentPath === '/' 
    ? [{ name: 'Root', path: '/' }]
    : [
        { name: 'Root', path: '/' },
        ...currentPath.split('/').filter(Boolean).map((part, idx, arr) => ({
          name: part,
          path: '/' + arr.slice(0, idx + 1).join('/'),
        })),
      ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Browse Dropbox Folders
          </DialogTitle>
        </DialogHeader>

        {/* Breadcrumb navigation */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground overflow-x-auto pb-2">
          {breadcrumbParts.map((part, idx) => (
            <span key={part.path} className="flex items-center gap-1 shrink-0">
              {idx > 0 && <ChevronRight className="h-3 w-3" />}
              <button
                onClick={() => navigateToFolder(part.path === '/' ? '' : part.path)}
                className="hover:text-foreground hover:underline"
                disabled={loading}
              >
                {part.name}
              </button>
            </span>
          ))}
        </div>

        {/* Back button */}
        {parentPath !== null && (
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            disabled={loading}
            className="w-fit"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        )}

        {/* Folder list */}
        <div className="border rounded-md min-h-[200px] max-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-[200px]">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : folders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <Folder className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">No subfolders found</p>
              <p className="text-xs">This folder contains only files</p>
            </div>
          ) : (
            <ul className="divide-y">
              {folders.map((folder) => (
                <li key={folder.path}>
                  <button
                    onClick={() => navigateToFolder(folder.path)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                  >
                    <Folder className="h-5 w-5 text-primary shrink-0" />
                    <span className="truncate">{folder.name}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Select button */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={selectCurrentFolder} disabled={loading}>
            Select "{currentPath === '/' ? 'Root' : currentPath}"
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
