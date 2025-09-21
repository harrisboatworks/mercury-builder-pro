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

interface DropboxIntegrationProps {
  motorId?: string;
  onUploadComplete?: () => void;
}

export function DropboxIntegration({ motorId: propMotorId, onUploadComplete }: DropboxIntegrationProps = {}) {
  const [uploading, setUploading] = useState(false);
  const [motorId, setMotorId] = useState(propMotorId || '');
  const [dropboxReady, setDropboxReady] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [appKeyError, setAppKeyError] = useState<string | null>(null);
  const [dropboxConfig, setDropboxConfig] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    const loadDropboxConfig = async () => {
      try {
        setConfigLoading(true);
        console.log('Loading Dropbox configuration...');
        
        // Get the Dropbox configuration (including OAuth capabilities)
        const { data, error } = await supabase.functions.invoke('get-dropbox-config');
        
        if (error) {
          console.error('Failed to get Dropbox config:', error);
          setAppKeyError('Failed to load Dropbox configuration');
          return;
        }

        if (!data?.appKey) {
          console.error('No app key returned from config');
          setAppKeyError('Dropbox app key not configured');
          return;
        }

        setDropboxConfig(data);
        console.log('Successfully loaded Dropbox configuration');

        // Check for OAuth callback in URL
        const urlParams = new URLSearchParams(window.location.search);
        const oauthCode = urlParams.get('code');
        const oauthState = urlParams.get('state');
        
        if (oauthCode && oauthState) {
          console.log('Processing OAuth callback...');
          try {
            const { data: oauthData, error: oauthError } = await supabase.functions.invoke('dropbox-oauth', {
              body: { code: oauthCode, state: oauthState }
            });
            
            if (oauthError || !oauthData?.access_token) {
              console.error('OAuth exchange failed:', oauthError);
              toast({
                title: "OAuth failed",
                description: "Failed to authenticate with Dropbox.",
                variant: "destructive",
              });
            } else {
              console.log('OAuth successful, got access token');
              setAccessToken(oauthData.access_token);
              // Clean up URL
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          } catch (error) {
            console.error('Error processing OAuth:', error);
          }
        }

        // Load Dropbox Chooser script if not already loaded
        if (!document.getElementById('dropboxjs')) {
          const script = document.createElement('script');
          script.id = 'dropboxjs';
          script.type = 'text/javascript';
          script.src = 'https://www.dropbox.com/static/api/2/dropins.js';
          script.setAttribute('data-app-key', data.appKey);
          script.onload = () => {
            console.log('Dropbox Chooser script loaded successfully');
            setDropboxReady(true);
          };
          script.onerror = () => {
            console.error('Failed to load Dropbox Chooser script');
            setAppKeyError('Failed to load Dropbox Chooser');
          };
          document.head.appendChild(script);
        } else {
          setDropboxReady(true);
        }
        
      } catch (error) {
        console.error('Error loading Dropbox config:', error);
        setAppKeyError('Failed to initialize Dropbox integration');
      } finally {
        setConfigLoading(false);
      }
    };

    loadDropboxConfig();
  }, []);

  const startOAuthFlow = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-dropbox-config', {
        body: { action: 'oauth-url' }
      });
      
      if (error || !data?.oauthUrl) {
        toast({
          title: "OAuth unavailable",
          description: "OAuth authentication is not configured.",
          variant: "destructive",
        });
        return;
      }

      // Redirect to Dropbox OAuth
      window.location.href = data.oauthUrl;
    } catch (error) {
      console.error('Error starting OAuth flow:', error);
      toast({
        title: "OAuth failed",
        description: "Failed to start authentication flow.",
        variant: "destructive",
      });
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
              console.log(`Processing file: ${file.name}`);
              
              // Use the new enhanced dropbox-file-handler edge function
              const { data: uploadData, error: uploadError } = await supabase.functions.invoke('dropbox-file-handler', {
                body: {
                  fileUrl: file.link,
                  fileName: file.name,
                  motorId: propMotorId || null,
                  accessToken: accessToken || null // Include access token if available
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
              variant: errorCount > 0 ? "destructive" : "default",
            });
          } else {
            toast({
              title: "Import failed",
              description: "No files were successfully imported.",
              variant: "destructive",
            });
          }

          // Call onUploadComplete callback if provided
          if (onUploadComplete) {
            onUploadComplete();
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
        {appKeyError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Configuration Error:</strong> {appKeyError}. Please check your Dropbox app configuration in the admin settings.
            </AlertDescription>
          </Alert>
        )}

        {configLoading && (
          <Alert>
            <Cloud className="h-4 w-4" />
            <AlertDescription>
              Loading Dropbox configuration...
            </AlertDescription>
          </Alert>
        )}

        {!appKeyError && !configLoading && (
          <div className="space-y-4">
            {dropboxConfig?.hasOAuth && !accessToken && (
              <Alert>
                <Cloud className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Enhanced authentication available for better file access.</span>
                  <Button onClick={startOAuthFlow} size="sm" variant="outline">
                    Authenticate with Dropbox
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {accessToken && (
              <Alert>
                <Cloud className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  ✓ Authenticated with Dropbox - Enhanced file access enabled
                </AlertDescription>
              </Alert>
            )}

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
                disabled={!dropboxReady || uploading || appKeyError !== null}
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
                Supported formats: JPG, PNG, GIF, WebP, PDF, DOC, DOCX, MP4, MOV. 
                {accessToken ? ' Enhanced authentication provides better file access.' : ' Authenticate for improved compatibility.'}
              </p>
            </div>
          </div>
        )}

        {!dropboxReady && !appKeyError && !configLoading && (
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