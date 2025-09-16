import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings2, Search, Image, FileText, Video, Link as LinkIcon, Plus, Trash2 } from 'lucide-react';

interface Motor {
  id: string;
  model_display: string;
  horsepower: number;
  motor_type: string;
  family: string;
  media_summary: {
    images: number;
    pdfs: number;
    videos: number;
    urls: number;
    documents: number;
  };
  hero_media_id: string | null;
}

interface MediaItem {
  id: string;
  media_type: 'image' | 'pdf' | 'video' | 'url' | 'document';
  media_category: string;
  media_url: string;
  title: string | null;
  description: string | null;
  alt_text: string | null;
}

export function MotorMediaManager() {
  const [motors, setMotors] = useState<Motor[]>([]);
  const [selectedMotor, setSelectedMotor] = useState<Motor | null>(null);
  const [motorMedia, setMotorMedia] = useState<MediaItem[]>([]);
  const [availableMedia, setAvailableMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadMotors();
    loadAvailableMedia();
  }, []);

  useEffect(() => {
    if (selectedMotor) {
      loadMotorMedia(selectedMotor.id);
    }
  }, [selectedMotor]);

  const loadMotors = async () => {
    try {
      const { data, error } = await supabase
        .from('motor_models')
        .select('id, model_display, horsepower, motor_type, family, media_summary, hero_media_id')
        .order('model_display');

      if (error) throw error;
      setMotors(data || []);
    } catch (error) {
      console.error('Failed to load motors:', error);
      toast({
        title: "Failed to load motors",
        description: "Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableMedia = async () => {
    try {
      const { data, error } = await supabase
        .from('motor_media')
        .select('id, media_type, media_category, media_url, title, description, alt_text')
        .is('motor_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAvailableMedia(data || []);
    } catch (error) {
      console.error('Failed to load available media:', error);
    }
  };

  const loadMotorMedia = async (motorId: string) => {
    try {
      const { data, error } = await supabase
        .from('motor_media')
        .select('id, media_type, media_category, media_url, title, description, alt_text')
        .eq('motor_id', motorId)
        .order('media_category', { ascending: true });

      if (error) throw error;
      setMotorMedia(data || []);
    } catch (error) {
      console.error('Failed to load motor media:', error);
      toast({
        title: "Failed to load motor media",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const assignMediaToMotor = async (mediaId: string, motorId: string) => {
    try {
      const { error } = await supabase
        .from('motor_media')
        .update({ 
          motor_id: motorId,
          assignment_type: 'individual'
        })
        .eq('id', mediaId);

      if (error) throw error;

      // Refresh data
      loadAvailableMedia();
      if (selectedMotor) {
        loadMotorMedia(selectedMotor.id);
        // Update motor summary
        const updatedMotors = await supabase
          .from('motor_models')
          .select('media_summary')
          .eq('id', motorId)
          .single();
        
        if (updatedMotors.data) {
          setMotors(prev => prev.map(motor => 
            motor.id === motorId 
              ? { ...motor, media_summary: updatedMotors.data.media_summary }
              : motor
          ));
        }
      }

      toast({
        title: "Media assigned",
        description: "Media has been assigned to the motor.",
      });
    } catch (error) {
      console.error('Failed to assign media:', error);
      toast({
        title: "Failed to assign media",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const unassignMediaFromMotor = async (mediaId: string) => {
    try {
      const { error } = await supabase
        .from('motor_media')
        .update({ 
          motor_id: null,
          assignment_type: 'individual'
        })
        .eq('id', mediaId);

      if (error) throw error;

      // Refresh data
      loadAvailableMedia();
      if (selectedMotor) {
        loadMotorMedia(selectedMotor.id);
      }

      toast({
        title: "Media unassigned",
        description: "Media has been removed from the motor.",
      });
    } catch (error) {
      console.error('Failed to unassign media:', error);
      toast({
        title: "Failed to unassign media",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const setHeroMedia = async (mediaId: string | null, motorId: string) => {
    try {
      const { error } = await supabase
        .from('motor_models')
        .update({ hero_media_id: mediaId })
        .eq('id', motorId);

      if (error) throw error;

      setMotors(prev => prev.map(motor => 
        motor.id === motorId 
          ? { ...motor, hero_media_id: mediaId }
          : motor
      ));

      toast({
        title: "Hero media updated",
        description: mediaId ? "Hero media has been set." : "Hero media has been cleared.",
      });
    } catch (error) {
      console.error('Failed to update hero media:', error);
      toast({
        title: "Failed to update hero media",
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

  const filteredMotors = motors.filter(motor =>
    motor.model_display?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    motor.motor_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    motor.family?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          Loading motor data...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Individual Motor Media Manager
          </CardTitle>
          <CardDescription>
            Assign and manage media for individual motor models with precise control.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search motors by model, type, or family..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Motor List */}
        <Card>
          <CardHeader>
            <CardTitle>Motors ({filteredMotors.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {filteredMotors.map((motor) => (
              <Card 
                key={motor.id} 
                className={`p-3 cursor-pointer transition-colors ${
                  selectedMotor?.id === motor.id ? 'bg-muted' : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedMotor(motor)}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{motor.model_display}</h4>
                    {motor.hero_media_id && (
                      <Badge variant="outline" className="text-xs">Hero Set</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{motor.horsepower}HP</span>
                    <span>•</span>
                    <span>{motor.motor_type}</span>
                    {motor.family && (
                      <>
                        <span>•</span>
                        <span>{motor.family}</span>
                      </>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {motor.media_summary?.images > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        <Image className="h-3 w-3 mr-1" />
                        {motor.media_summary.images}
                      </Badge>
                    )}
                    {motor.media_summary?.pdfs > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        {motor.media_summary.pdfs}
                      </Badge>
                    )}
                    {motor.media_summary?.videos > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        <Video className="h-3 w-3 mr-1" />
                        {motor.media_summary.videos}
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Motor Media Management */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedMotor 
                ? `Media for ${selectedMotor.model_display}`
                : 'Select a Motor'
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedMotor ? (
              <div className="space-y-4">
                {/* Current Media */}
                <div>
                  <h4 className="font-medium mb-2">Current Media ({motorMedia.length})</h4>
                  <div className="space-y-2">
                    {motorMedia.map((media) => (
                      <div key={media.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          {getMediaIcon(media.media_type)}
                          <div>
                            <div className="text-sm font-medium">
                              {media.title || 'Untitled'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {media.media_category} • {media.media_type}
                            </div>
                          </div>
                          {selectedMotor.hero_media_id === media.id && (
                            <Badge variant="default" className="text-xs">Hero</Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {media.media_type === 'image' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setHeroMedia(
                                selectedMotor.hero_media_id === media.id ? null : media.id,
                                selectedMotor.id
                              )}
                            >
                              {selectedMotor.hero_media_id === media.id ? 'Remove Hero' : 'Set Hero'}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => unassignMediaFromMotor(media.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {motorMedia.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        No media assigned to this motor yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Available Media */}
                <div>
                  <h4 className="font-medium mb-2">Available Media ({availableMedia.length})</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableMedia.map((media) => (
                      <div key={media.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          {getMediaIcon(media.media_type)}
                          <div>
                            <div className="text-sm font-medium">
                              {media.title || 'Untitled'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {media.media_category} • {media.media_type}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => assignMediaToMotor(media.id, selectedMotor.id)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    {availableMedia.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        No unassigned media available. Upload media in the Upload Hub.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Select a motor from the left to manage its media.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}