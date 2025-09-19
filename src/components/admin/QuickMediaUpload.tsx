import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, Image, X, Plus, Star } from 'lucide-react';

interface MediaFile {
  id: string;
  file: File;
  category: 'hero' | 'gallery' | 'specs' | 'manual' | 'brochure' | 'video' | 'general';
  title: string;
  altText?: string;
}

interface QuickMediaUploadProps {
  motorId: string;
  onUploadComplete: () => void;
}

export function QuickMediaUpload({ motorId, onUploadComplete }: QuickMediaUploadProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const addMediaFile = useCallback((file: File) => {
    const newFile: MediaFile = {
      id: Math.random().toString(36).substr(2, 9),
      file,
      category: 'gallery',
      title: file.name.replace(/\.[^/.]+$/, ''),
      altText: file.type.startsWith('image/') ? '' : undefined,
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

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      Array.from(e.dataTransfer.files).forEach(file => {
        if (file.type.startsWith('image/') || file.type === 'application/pdf' || file.type.startsWith('video/')) {
          addMediaFile(file);
        }
      });
    }
  }, [addMediaFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(file => {
        addMediaFile(file);
      });
    }
  }, [addMediaFile]);

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
    if (mediaFiles.length === 0) return;

    setUploading(true);
    let successCount = 0;

    try {
      for (const mediaFile of mediaFiles) {
        try {
          // Upload file to storage
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const path = `uploads/${timestamp}-${mediaFile.file.name}`;
          const mediaUrl = await uploadToStorage(mediaFile.file, path);

          // Determine media type
          const mediaType = mediaFile.file.type.startsWith('image/') ? 'image' : 
                           mediaFile.file.type === 'application/pdf' ? 'pdf' : 
                           mediaFile.file.type.startsWith('video/') ? 'video' : 'document';

          // Save to database and assign to motor immediately
          const { error } = await supabase
            .from('motor_media')
            .insert({
              motor_id: motorId, // Auto-assign to current motor
              media_type: mediaType,
              media_category: mediaFile.category,
              media_url: mediaUrl,
              original_filename: mediaFile.file.name,
              file_size: mediaFile.file.size,
              mime_type: mediaFile.file.type,
              title: mediaFile.title,
              alt_text: mediaFile.altText,
              assignment_type: 'individual',
            });

          if (error) throw error;
          successCount++;
        } catch (error) {
          console.error(`Failed to upload ${mediaFile.title}:`, error);
        }
      }

      toast({
        title: "Upload complete",
        description: `${successCount} files uploaded and assigned to motor.`,
      });

      setMediaFiles([]);
      onUploadComplete();
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Quick Upload</h3>
      </div>

      {/* Upload Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">
          Drag & drop files here, or click to select
        </p>
        <input
          type="file"
          multiple
          accept="image/*,.pdf,video/*"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <Label htmlFor="file-upload">
          <Button variant="outline" size="sm" asChild>
            <span>
              <Plus className="h-4 w-4 mr-2" />
              Select Files
            </span>
          </Button>
        </Label>
      </div>

      {/* File List */}
      {mediaFiles.length > 0 && (
        <div className="space-y-3">
          {mediaFiles.map((mediaFile) => (
            <div key={mediaFile.id} className="border rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  <span className="font-medium text-sm truncate">
                    {mediaFile.title}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {mediaFile.file.type.split('/')[0]}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMediaFile(mediaFile.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Title</Label>
                  <Input
                    value={mediaFile.title}
                    onChange={(e) => updateMediaFile(mediaFile.id, { title: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Category</Label>
                  <Select 
                    value={mediaFile.category} 
                    onValueChange={(value: MediaFile['category']) => 
                      updateMediaFile(mediaFile.id, { category: value })
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hero">
                        <div className="flex items-center gap-2">
                          <Star className="h-3 w-3" />
                          Hero
                        </div>
                      </SelectItem>
                      <SelectItem value="gallery">Gallery</SelectItem>
                      <SelectItem value="specs">Specifications</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="brochure">Brochure</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

                <div>
                  <Label className="text-xs">Alt Text</Label>
                  <Input
                    placeholder="Descriptive alt text"
                    value={mediaFile.altText || ''}
                    onChange={(e) => updateMediaFile(mediaFile.id, { altText: e.target.value })}
                  />
                </div>
            </div>
          ))}

          <Button 
            onClick={handleUpload} 
            disabled={uploading}
            className="w-full"
          >
            {uploading ? 'Uploading...' : `Upload & Assign ${mediaFiles.length} file${mediaFiles.length !== 1 ? 's' : ''}`}
          </Button>
        </div>
      )}
    </div>
  );
}