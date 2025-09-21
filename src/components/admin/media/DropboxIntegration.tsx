import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Cloud, FileImage, Upload, AlertCircle } from 'lucide-react';

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

export function DropboxIntegration() {
  const [uploading, setUploading] = useState(false);
  const [motorId, setMotorId] = useState('');
  const [dropboxReady, setDropboxReady] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load Dropbox Chooser script if not already loaded
    if (!document.getElementById('dropboxjs')) {
      const script = document.createElement('script');
      script.id = 'dropboxjs';
      script.type = 'text/javascript';
      script.src = 'https://www.dropbox.com/static/api/2/dropins.js';
      script.setAttribute('data-app-key', 'demo'); // Demo mode - replace with actual Dropbox app key
      script.onload = () => setDropboxReady(true);
      document.head.appendChild(script);
    } else {
      setDropboxReady(true);
    }
  }, []);

  const uploadFileToSupabase = async (fileUrl: string, fileName: string) => {
    try {
      // Download the file from Dropbox
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      
      // Generate unique filename
      const timestamp = Date.now();
      const extension = fileName.split('.').pop();
      const uniqueFileName = `dropbox_${timestamp}.${extension}`;
      
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('motor-images')
        .upload(uniqueFileName, blob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('motor-images')
        .getPublicUrl(uniqueFileName);

      return { storageKey: uniqueFileName, publicUrl };
    } catch (error) {
      console.error('Failed to upload file to Supabase:', error);
      throw error;
    }
  };

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
              // Upload file to Supabase storage
              const { storageKey, publicUrl } = await uploadFileToSupabase(file.link, file.name);
              
              // Determine media type and category
              const extension = file.name.split('.').pop()?.toLowerCase() || '';
              const mediaType = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension) 
                ? 'image' : 'document';
              
              // Insert into motor_media table
              const { error: insertError } = await supabase
                .from('motor_media')
                .insert({
                  motor_id: motorId || null,
                  media_type: mediaType,
                  media_category: 'general',
                  media_url: publicUrl,
                  original_filename: file.name,
                  file_size: file.bytes,
                  title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
                  dropbox_path: file.link,
                  dropbox_sync_status: 'completed',
                  assignment_type: motorId ? 'individual' : 'unassigned',
                  is_active: true
                });

              if (insertError) throw insertError;
              successCount++;
              
            } catch (error) {
              console.error(`Failed to process file ${file.name}:`, error);
              errorCount++;
            }
          }

          toast({
            title: "Files imported",
            description: `Successfully imported ${successCount} files. ${errorCount > 0 ? `${errorCount} files failed.` : ''}`,
            variant: errorCount > 0 ? "destructive" : "default",
          });

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
      extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'],
      folderselect: false
    });
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          Dropbox File Import
        </CardTitle>
        <CardDescription>
          Import images and documents directly from your Dropbox account using the official Dropbox Chooser.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Demo Mode:</strong> This is currently running in demo mode. To enable full Dropbox integration, 
            create a Dropbox app at <a href="https://www.dropbox.com/developers/apps" target="_blank" className="underline">Dropbox Developers</a> 
            and replace the app key in the component. The demo allows you to test the interface without a real Dropbox connection.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label htmlFor="motor-id">Assign to Motor (Optional)</Label>
            <Input
              id="motor-id"
              placeholder="Enter Motor ID to auto-assign files"
              value={motorId}
              onChange={(e) => setMotorId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to import files without motor assignment
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <div className="flex items-center gap-3">
              <FileImage className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <h3 className="font-semibold">Import from Dropbox</h3>
                <p className="text-sm text-muted-foreground">
                  Select images and documents from your Dropbox account
                </p>
              </div>
            </div>

            <Button 
              onClick={handleDropboxChooser}
              disabled={!dropboxReady || uploading}
              size="lg"
              className="flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Upload className="h-4 w-4 animate-spin" />
                  Importing Files...
                </>
              ) : !dropboxReady ? (
                <>
                  <Cloud className="h-4 w-4" />
                  Loading Dropbox...
                </>
              ) : (
                <>
                  <Cloud className="h-4 w-4" />
                  Choose Files from Dropbox
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center max-w-md">
              Supported formats: JPG, PNG, GIF, WebP, PDF. Files will be uploaded to your motor media library.
            </p>
          </div>
        </div>

        {!dropboxReady && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Dropbox Chooser is loading. If this takes too long, please check your internet connection and refresh the page.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}