import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Image, FileText, Video, Link as LinkIcon, Plus, Trash2, Star, StarOff, Upload, Sparkles, Cloud } from 'lucide-react';
import { MotorFeaturesManager } from './MotorFeaturesManager';
import { QuickMediaUpload } from './QuickMediaUpload';
import { CompactDropboxImport } from './media/CompactDropboxImport';
import { MediaThumbnail } from './media/MediaThumbnail';

interface MediaItem {
  id: string;
  media_type: 'image' | 'pdf' | 'video' | 'url' | 'document';
  media_category: string;
  media_url: string;
  title: string | null;
  description: string | null;
  alt_text: string | null;
  file_size: number | null;
}

interface MotorMediaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  motor: {
    id: string;
    model_display: string;
    horsepower: number;
    hero_media_id: string | null;
  } | null;
  onMediaUpdated?: () => void;
}

export function MotorMediaDialog({ isOpen, onClose, motor, onMediaUpdated }: MotorMediaDialogProps) {
  const [assignedMedia, setAssignedMedia] = useState<MediaItem[]>([]);
  const [availableMedia, setAvailableMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && motor) {
      loadMediaData();
    }
  }, [isOpen, motor]);

  const loadMediaData = async () => {
    if (!motor) return;
    
    setLoading(true);
    try {
      // Load assigned media
      const { data: assigned, error: assignedError } = await supabase
        .from('motor_media')
        .select('id, media_type, media_category, media_url, title, description, alt_text, file_size')
        .eq('motor_id', motor.id)
        .eq('is_active', true)
        .order('media_category', { ascending: true });

      if (assignedError) throw assignedError;

      // Load available media (unassigned)
      const { data: available, error: availableError } = await supabase
        .from('motor_media')
        .select('id, media_type, media_category, media_url, title, description, alt_text, file_size')
        .is('motor_id', null)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (availableError) throw availableError;

      setAssignedMedia(assigned || []);
      setAvailableMedia(available || []);
    } catch (error) {
      console.error('Error loading media data:', error);
      toast({
        title: "Error loading media",
        description: "Failed to load media data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const assignMedia = async (mediaId: string) => {
    if (!motor) return;

    try {
      const { error } = await supabase
        .from('motor_media')
        .update({ 
          motor_id: motor.id,
          assignment_type: 'individual'
        })
        .eq('id', mediaId);

      if (error) throw error;

      toast({
        title: "Media assigned",
        description: "Media has been successfully assigned to the motor.",
      });

      loadMediaData();
      onMediaUpdated?.();
    } catch (error) {
      console.error('Error assigning media:', error);
      toast({
        title: "Assignment failed",
        description: "Failed to assign media. Please try again.",
        variant: "destructive",
      });
    }
  };

  const unassignMedia = async (mediaId: string) => {
    try {
      const { error } = await supabase
        .from('motor_media')
        .update({ 
          motor_id: null,
          assignment_type: 'individual'
        })
        .eq('id', mediaId);

      if (error) throw error;

      toast({
        title: "Media unassigned",
        description: "Media has been removed from the motor.",
      });

      loadMediaData();
      onMediaUpdated?.();
    } catch (error) {
      console.error('Error unassigning media:', error);
      toast({
        title: "Unassignment failed",
        description: "Failed to unassign media. Please try again.",
        variant: "destructive",
      });
    }
  };

  const setHeroMedia = async (mediaId: string | null) => {
    if (!motor) return;

    try {
      const { error } = await supabase
        .from('motor_models')
        .update({ hero_media_id: mediaId })
        .eq('id', motor.id);

      if (error) throw error;

      toast({
        title: "Hero media updated",
        description: mediaId ? "Hero media has been set." : "Hero media has been cleared.",
      });

      loadMediaData();
      onMediaUpdated?.();
    } catch (error) {
      console.error('Error updating hero media:', error);
      toast({
        title: "Hero update failed",
        description: "Failed to update hero media. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'pdf': 
      case 'document': return <FileText className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'url': return <LinkIcon className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  };

  const MediaCard = ({ media, isAssigned }: { media: MediaItem; isAssigned: boolean }) => {
    const isHero = motor?.hero_media_id === media.id;
    
    return (
      <div className="flex items-start gap-3 p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
        {/* Thumbnail */}
        <MediaThumbnail 
          media={media} 
          size="lg" 
          className="flex-shrink-0"
        />
        
        {/* Content */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">
                {media.title || 'Untitled'}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="capitalize">{media.media_category}</span>
                <span>•</span>
                <span className="uppercase">{media.media_type}</span>
                {media.file_size && (
                  <>
                    <span>•</span>
                    <span>{formatFileSize(media.file_size)}</span>
                  </>
                )}
              </div>
              {media.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {media.description}
                </p>
              )}
            </div>
            
            {/* Hero Badge */}
            {isAssigned && isHero && (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">
                <Star className="h-3 w-3 mr-1 fill-current" />
                Hero
              </Badge>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            {isAssigned ? (
              <>
                {media.media_type === 'image' && (
                  <Button
                    size="sm"
                    variant={isHero ? "secondary" : "default"}
                    className={isHero ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" : "bg-blue-600 hover:bg-blue-700 text-white"}
                    onClick={() => setHeroMedia(isHero ? null : media.id)}
                  >
                    {isHero ? "Remove Hero" : "Set Hero"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => unassignMedia(media.id)}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => assignMedia(media.id)}
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                <Plus className="h-4 w-4 mr-1" />
                Assign
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!motor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5 text-blue-600" />
            Motor Media Manager - {motor.model_display} ({motor.horsepower}HP)
          </DialogTitle>
          <DialogDescription>
            Comprehensive media management for this motor model - upload, assign, and organize images, PDFs, videos, and documents
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="media" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="media" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Media
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Features
            </TabsTrigger>
          </TabsList>

          <TabsContent value="media" className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading media...</div>
              </div>
            ) : (
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
                 {/* Media Import - Enhanced with Dropbox */}
                 <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <h3 className="text-lg font-semibold text-primary">
                       Import Media
                     </h3>
                   </div>
                   
                   {/* Quick Upload */}
                   <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                     <div className="flex items-center gap-2 mb-3">
                       <Upload className="h-4 w-4" />
                       <span className="text-sm font-medium">File Upload</span>
                     </div>
                     <QuickMediaUpload 
                       motorId={motor.id}
                       onUploadComplete={loadMediaData}
                     />
                   </div>

                   {/* Dropbox Integration */}
                   <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                     <div className="flex items-center gap-2 mb-3">
                       <Cloud className="h-4 w-4 text-blue-600" />
                       <span className="text-sm font-medium text-blue-700">Dropbox Import</span>
                     </div>
                     <CompactDropboxImport motorId={motor.id} onUploadComplete={loadMediaData} />
                   </div>
                 </div>

                  {/* Assigned Media */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-primary">
                        Current Media ({assignedMedia.length})
                      </h3>
                      {motor?.hero_media_id && (
                        <Badge variant="outline" className="text-xs bg-yellow-50 border-yellow-300 text-yellow-700">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Hero Set
                        </Badge>
                      )}
                    </div>

                    <ScrollArea className="h-96">
                      <div className="space-y-3">
                        {assignedMedia.map((media) => (
                          <MediaCard key={media.id} media={media} isAssigned={true} />
                        ))}
                        
                        {assignedMedia.length === 0 && (
                          <div className="text-center py-12 text-muted-foreground">
                            <div className="bg-primary/5 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                              <Image className="h-8 w-8 opacity-50" />
                            </div>
                            <p className="text-base font-medium">No media assigned yet</p>
                            <p className="text-sm">Upload new media or assign from available library</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                 {/* Available Media */}
                 <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <h3 className="text-lg font-semibold">
                       Available Media ({availableMedia.length})
                     </h3>
                   </div>

                   <ScrollArea className="h-96">
                     <div className="space-y-3">
                       {availableMedia.map((media) => (
                         <MediaCard key={media.id} media={media} isAssigned={false} />
                       ))}
                       
                       {availableMedia.length === 0 && (
                         <div className="text-center py-8 text-muted-foreground">
                           <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                           <p>No unassigned media available.</p>
                           <p className="text-sm">Upload new media using Quick Upload.</p>
                         </div>
                       )}
                     </div>
                   </ScrollArea>
                 </div>
               </div>
            )}
          </TabsContent>

          <TabsContent value="features" className="flex-1 overflow-hidden">
            <MotorFeaturesManager 
              motor={motor} 
              onFeaturesUpdated={onMediaUpdated}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}