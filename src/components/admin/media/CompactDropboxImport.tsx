import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Cloud, Upload, AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    Dropbox: {
      choose: (options: {
        success: (files: Array<{ link: string; name: string; bytes: number }>) => void;
        linkType: 'preview' | 'direct';
        multiselect: boolean;
        extensions: string[];
        folderselect: boolean;
      }) => void;
    };
  }
}

interface CompactDropboxImportProps {
  motorId: string;
  onUploadComplete?: () => void;
}

export function CompactDropboxImport({ motorId, onUploadComplete }: CompactDropboxImportProps) {
  const [uploading, setUploading] = useState(false);
  const [dropboxReady, setDropboxReady] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [appKeyError, setAppKeyError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    const loadDropboxConfig = async () => {
      try {
        setConfigLoading(true);
        
        // Get the Dropbox configuration
        const { data, error } = await supabase.functions.invoke('get-dropbox-config');
        
        if (error) {
          console.error('Failed to get Dropbox config:', error);
          setAppKeyError('Failed to load Dropbox configuration');
          return;
        }

        if (!data?.appKey) {
          setAppKeyError('Dropbox App Key not configured');
          return;
        }

        // Set access token if available
        if (data.accessToken) {
          setAccessToken(data.accessToken);
        }

        // Dynamically load Dropbox Chooser script
        const script = document.createElement('script');
        script.src = `https://www.dropbox.com/static/api/2/dropins.js`;
        script.id = 'dropboxjs';
        script.dataset.appKey = data.appKey;
        
        script.onload = () => {
          console.log('Dropbox Chooser script loaded successfully');
          setDropboxReady(true);
        };
        
        script.onerror = () => {
          console.error('Failed to load Dropbox Chooser script');
          setAppKeyError('Failed to load Dropbox Chooser');
        };

        if (!document.getElementById('dropboxjs')) {
          document.head.appendChild(script);
        } else {
          setDropboxReady(true);
        }

      } catch (error) {
        console.error('Error loading Dropbox config:', error);
        setAppKeyError('Configuration error');
      } finally {
        setConfigLoading(false);
      }
    };

    loadDropboxConfig();
  }, []);

  const handleDropboxChooser = () => {
    if (!window.Dropbox) {
      toast({
        title: "Dropbox not ready",
        description: "Please wait for Dropbox to load and try again.",
        variant: "destructive",
      });
      return;
    }

    window.Dropbox.choose({
      success: async (files) => {
        setUploading(true);
        let successCount = 0;
        let errorCount = 0;

        try {
          for (const file of files) {
            try {
              console.log(`Processing file: ${file.name}`);
              
              const { data: uploadData, error: uploadError } = await supabase.functions.invoke('dropbox-file-handler', {
                body: {
                  fileUrl: file.link,
                  fileName: file.name,
                  motorId: motorId,
                  accessToken: accessToken || null
                }
              });

              if (uploadError) {
                console.error(`Failed to upload ${file.name}:`, uploadError);
                throw new Error(uploadError.message || 'Upload failed');
              }

              if (!uploadData?.success) {
                console.error(`Upload failed for ${file.name}:`, uploadData);
                throw new Error(uploadData?.error || 'Upload failed');
              }

              console.log(`Successfully uploaded: ${file.name}`);
              successCount++;
              
            } catch (error) {
              console.error(`Failed to process file ${file.name}:`, error);
              errorCount++;
            }
          }

          // Show results
          if (successCount > 0) {
            toast({
              title: "Files imported successfully",
              description: `Successfully imported ${successCount} files${errorCount > 0 ? `. ${errorCount} files failed.` : '.'}`,
            });

            // Call onUploadComplete callback if provided
            if (onUploadComplete) {
              onUploadComplete();
            }
          } else {
            toast({
              title: "Import failed",
              description: "No files were successfully imported.",
              variant: "destructive",
            });
          }

        } catch (error) {
          console.error('Failed to import files:', error);
          toast({
            title: "Import failed",
            description: "Failed to import files from Dropbox.",
            variant: "destructive",
          });
        } finally {
          setUploading(false);
        }
      },
      linkType: 'direct',
      multiselect: true,
      extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.mp4', '.mov'],
      folderselect: false
    });
  };

  if (appKeyError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          {appKeyError}
        </AlertDescription>
      </Alert>
    );
  }

  if (configLoading) {
    return (
      <div className="flex items-center justify-center py-3">
        <div className="text-xs text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-2">
          Select images and documents from your Dropbox account
        </p>
      </div>

      <Button 
        onClick={handleDropboxChooser}
        disabled={!dropboxReady || uploading}
        size="sm"
        className="w-full flex items-center gap-2"
      >
        {uploading ? (
          <>
            <Upload className="h-3 w-3 animate-spin" />
            Importing...
          </>
        ) : !dropboxReady ? (
          <>
            <Cloud className="h-3 w-3" />
            Loading...
          </>
        ) : (
          <>
            <Cloud className="h-3 w-3" />
            Choose Files from Dropbox
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        JPG, PNG, PDF, DOC, MP4, MOV supported
      </p>
    </div>
  );
}