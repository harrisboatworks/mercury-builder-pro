import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Library, Search, Image, FileText, Video, Link as LinkIcon, Trash2, Edit, Download } from 'lucide-react';

interface MediaItem {
  id: string;
  media_type: 'image' | 'pdf' | 'video' | 'url' | 'document';
  media_category: 'hero' | 'gallery' | 'specs' | 'manual' | 'brochure' | 'video' | 'general';
  media_url: string;
  original_filename: string | null;
  title: string | null;
  description: string | null;
  alt_text: string | null;
  file_size: number | null;
  assignment_type: 'individual' | 'bulk_rule' | 'smart_match';
  created_at: string;
  motor_id: string | null;
  motor_model?: string;
}

export function MediaLibrary() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [assignmentFilter, setAssignmentFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadMedia();
  }, []);

  useEffect(() => {
    filterMedia();
  }, [media, searchTerm, typeFilter, categoryFilter, assignmentFilter]);

  const loadMedia = async () => {
    try {
      const { data, error } = await supabase
        .from('motor_media')
        .select(`
          *,
          motor_models!motor_media_motor_id_fkey(model_display)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mediaWithMotor = data.map(item => ({
        ...item,
        motor_model: item.motor_models?.model_display
      }));
      
      setMedia(mediaWithMotor || []);
    } catch (error) {
      console.error('Failed to load media library:', error);
      toast({
        title: "Failed to load media library",
        description: "Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterMedia = () => {
    let filtered = media;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        (item.title?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.original_filename?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.motor_model?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.media_type === typeFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.media_category === categoryFilter);
    }

    if (assignmentFilter !== 'all') {
      if (assignmentFilter === 'unassigned') {
        filtered = filtered.filter(item => !item.motor_id);
      } else {
        filtered = filtered.filter(item => item.assignment_type === assignmentFilter);
      }
    }

    setFilteredMedia(filtered);
  };

  const deleteMedia = async (id: string) => {
    try {
      const { error } = await supabase
        .from('motor_media')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMedia(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Media deleted",
        description: "Media item has been removed.",
      });
    } catch (error) {
      console.error('Failed to delete media:', error);
      toast({
        title: "Failed to delete media",
        description: "Please try again.",
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
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          Loading media library...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Library className="h-5 w-5" />
            Media Library
          </CardTitle>
          <CardDescription>
            Browse, search, and manage all media assets across your motor models.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search media..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Media Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="pdf">PDFs</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="url">URLs</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="hero">Hero</SelectItem>
                <SelectItem value="gallery">Gallery</SelectItem>
                <SelectItem value="specs">Specs</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="brochure">Brochure</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>

            <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Assignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Media</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="bulk_rule">Bulk Rule</SelectItem>
                <SelectItem value="smart_match">Smart Match</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground flex items-center">
              {filteredMedia.length} of {media.length} items
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMedia.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getMediaIcon(item.media_type)}
                    <Badge variant="outline">{item.media_type.toUpperCase()}</Badge>
                    <Badge variant="secondary">{item.media_category}</Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteMedia(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {item.media_type === 'image' && (
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    <img
                      src={item.media_url}
                      alt={item.alt_text || item.title || 'Media item'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <h4 className="font-medium text-sm">
                    {item.title || item.original_filename || 'Untitled'}
                  </h4>
                  {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  {item.motor_model && (
                    <div>Motor: {item.motor_model}</div>
                  )}
                  {item.file_size && (
                    <div>Size: {formatFileSize(item.file_size)}</div>
                  )}
                  <div>
                    Assignment: {item.assignment_type.replace('_', ' ')}
                  </div>
                  <div>
                    Created: {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={item.media_url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-3 w-3 mr-1" />
                      View
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMedia.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Library className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No media found</h3>
            <p className="text-muted-foreground">
              {media.length === 0 
                ? "No media has been uploaded yet. Use the Upload Hub to get started."
                : "Try adjusting your search or filter criteria."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}