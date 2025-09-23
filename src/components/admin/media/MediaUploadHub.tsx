import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, Image, FileText, Video, Link as LinkIcon, Plus, X } from 'lucide-react';

interface MediaFile {
  id: string;
  file?: File;
  url?: string;
  type: 'image' | 'pdf' | 'video' | 'url' | 'document';
  category: 'hero' | 'gallery' | 'specs' | 'manual' | 'brochure' | 'video' | 'general';
  title: string;
  description: string;
  altText?: string;
}

interface MediaUploadHubProps {
  motorId?: string;
  onUploadComplete?: () => void;
}

export function MediaUploadHub({ motorId, onUploadComplete }: MediaUploadHubProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const addMediaFile = useCallback((type: MediaFile['type']) => {
    const newFile: MediaFile = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      category: 'general',
      title: '',
      description: '',
      altText: type === 'image' ? '' : undefined,
    };
    setMediaFiles(prev => [...prev, newFile]);
  }, []);

  const updateMediaFile = useCallback((id: string, updates: Partial<MediaFile>) => {
    setMediaFiles(prev => prev.map(file => 
      file.id === id ? { ...file, ...updates } : file
    ));
  }, []);

  const removeMediaFile = useCallback((id: string) => {
    setMediaFiles(prev => prev.filter(file => file.id !== id));
  }, []);

  const handleFileSelect = useCallback((id: string, file: File) => {
    updateMediaFile(id, { 
      file, 
      title: file.name.replace(/\.[^/.]+$/, ''),
      type: file.type.startsWith('image/') ? 'image' : 
            file.type === 'application/pdf' ? 'pdf' : 
            file.type.startsWith('video/') ? 'video' : 'document'
    });
  }, [updateMediaFile]);

  const uploadToStorage = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('motor-images')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('motor-images')
      .getPublicUrl(data.path);
      
    return publicUrl;
  };

  const handleUpload = async () => {
    if (mediaFiles.length === 0) {
      toast({
        title: "No media to upload",
        description: "Please add some media files first.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const mediaFile of mediaFiles) {
        try {
          let mediaUrl = mediaFile.url || '';
          
          if (mediaFile.file) {
            // Upload file to storage
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const path = `uploads/${timestamp}-${mediaFile.file.name}`;
            mediaUrl = await uploadToStorage(mediaFile.file, path);
          }

          if (!mediaUrl) {
            throw new Error('No media URL provided');
          }

          // Save to database
          const { error } = await supabase
            .from('motor_media')
            .insert({
              motor_id: motorId || undefined, // Auto-assign to motor if provided
              media_type: mediaFile.type,
              media_category: mediaFile.category,
              media_url: mediaUrl,
              original_filename: mediaFile.file?.name,
              file_size: mediaFile.file?.size,
              mime_type: mediaFile.file?.type,
              title: mediaFile.title,
              description: mediaFile.description,
              alt_text: mediaFile.altText,
              assignment_type: 'individual', // Will be assigned later
            });

          if (error) throw error;
          successCount++;
        } catch (error) {
          console.error(`Failed to upload ${mediaFile.title}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Upload successful",
          description: `Successfully uploaded ${successCount} media files.`,
        });

        setMediaFiles([]);
        
        // Call onUploadComplete callback if provided
        if (onUploadComplete) {
          onUploadComplete();
        }
      } else {
        toast({
          title: "Upload failed",
          description: `${errorCount} files failed to upload.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Multi-Media Upload Hub
          </CardTitle>
          <CardDescription>
            Upload and organize images, PDFs, videos, and documents for motor models.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => addMediaFile('image')}>
              <Image className="h-4 w-4 mr-2" />
              Add Image
            </Button>
            <Button variant="outline" size="sm" onClick={() => addMediaFile('pdf')}>
              <FileText className="h-4 w-4 mr-2" />
              Add PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => addMediaFile('video')}>
              <Video className="h-4 w-4 mr-2" />
              Add Video
            </Button>
            <Button variant="outline" size="sm" onClick={() => addMediaFile('url')}>
              <LinkIcon className="h-4 w-4 mr-2" />
              Add URL
            </Button>
            <Button variant="outline" size="sm" onClick={() => addMediaFile('document')}>
              <FileText className="h-4 w-4 mr-2" />
              Add Document
            </Button>
          </div>

          {mediaFiles.length > 0 && (
            <div className="space-y-4">
              <div className="grid gap-4">
                {mediaFiles.map((mediaFile) => (
                  <Card key={mediaFile.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant="outline">
                        {mediaFile.type.toUpperCase()}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMediaFile(mediaFile.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        {(mediaFile.type !== 'url') && (
                          <div>
                            <Label htmlFor={`file-${mediaFile.id}`}>File</Label>
                            <Input
                              id={`file-${mediaFile.id}`}
                              type="file"
                              accept={
                                mediaFile.type === 'image' ? 'image/*' :
                                mediaFile.type === 'pdf' ? '.pdf' :
                                mediaFile.type === 'video' ? 'video/*' :
                                '*/*'
                              }
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileSelect(mediaFile.id, file);
                              }}
                            />
                          </div>
                        )}

                        {mediaFile.type === 'url' && (
                          <div>
                            <Label htmlFor={`url-${mediaFile.id}`}>URL</Label>
                            <Input
                              id={`url-${mediaFile.id}`}
                              placeholder="https://example.com/media"
                              value={mediaFile.url || ''}
                              onChange={(e) => updateMediaFile(mediaFile.id, { url: e.target.value })}
                            />
                          </div>
                        )}

                        <div>
                          <Label htmlFor={`title-${mediaFile.id}`}>Title</Label>
                          <Input
                            id={`title-${mediaFile.id}`}
                            placeholder="Media title"
                            value={mediaFile.title}
                            onChange={(e) => updateMediaFile(mediaFile.id, { title: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label htmlFor={`category-${mediaFile.id}`}>Category</Label>
                          <Select 
                            value={mediaFile.category} 
                            onValueChange={(value: MediaFile['category']) => 
                              updateMediaFile(mediaFile.id, { category: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hero">Hero Image</SelectItem>
                              <SelectItem value="gallery">Gallery</SelectItem>
                              <SelectItem value="specs">Specifications</SelectItem>
                              <SelectItem value="manual">Manual</SelectItem>
                              <SelectItem value="brochure">Brochure</SelectItem>
                              <SelectItem value="video">Video</SelectItem>
                              <SelectItem value="general">General</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor={`description-${mediaFile.id}`}>Description</Label>
                          <Textarea
                            id={`description-${mediaFile.id}`}
                            placeholder="Media description"
                            value={mediaFile.description}
                            onChange={(e) => updateMediaFile(mediaFile.id, { description: e.target.value })}
                            rows={2}
                          />
                        </div>

                        {mediaFile.type === 'image' && (
                          <div>
                            <Label htmlFor={`alt-${mediaFile.id}`}>Alt Text</Label>
                            <Input
                              id={`alt-${mediaFile.id}`}
                              placeholder="Descriptive alt text"
                              value={mediaFile.altText || ''}
                              onChange={(e) => updateMediaFile(mediaFile.id, { altText: e.target.value })}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleUpload} disabled={uploading}>
                  {uploading ? 'Uploading...' : `Upload ${mediaFiles.length} item${mediaFiles.length !== 1 ? 's' : ''}`}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}