import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AdminNav from '@/components/admin/AdminNav';
import { QuickMediaUpload } from '@/components/admin/QuickMediaUpload';
import { CustomSourceManager } from '@/components/admin/CustomSourceManager';
import { MotorFeaturesManager } from '@/components/admin/MotorFeaturesManager';

interface Motor {
  id: string;
  model_display: string;
  model_number: string;
  horsepower: number;
  motor_type: string;
  family: string;
  availability: string;
  dealer_price: number;
  msrp: number;
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

const AdminMotorManagement = () => {
  const { motorId } = useParams<{ motorId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [motor, setMotor] = useState<Motor | null>(null);
  const [motorMedia, setMotorMedia] = useState<MediaItem[]>([]);
  const [availableMedia, setAvailableMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Motor Management | Admin';
    if (motorId) {
      loadMotor();
      loadMotorMedia();
      loadAvailableMedia();
    }
  }, [motorId]);

  const loadMotor = async () => {
    if (!motorId) return;
    
    try {
      const { data, error } = await supabase
        .from('motor_models')
        .select('id, model_display, model_number, horsepower, motor_type, family, availability, dealer_price, msrp, media_summary, hero_media_id')
        .eq('id', motorId)
        .single();

      if (error) throw error;
      setMotor(data);
    } catch (error) {
      console.error('Failed to load motor:', error);
      toast({
        title: "Failed to load motor",
        description: "Motor not found or access denied.",
        variant: "destructive",
      });
      navigate('/admin/inventory');
    }
  };

  const loadMotorMedia = async () => {
    if (!motorId) return;
    
    try {
      const { data, error } = await supabase
        .from('motor_media')
        .select('id, media_type, media_category, media_url, title, description, alt_text')
        .eq('motor_id', motorId)
        .order('media_category');

      if (error) throw error;
      setMotorMedia(data || []);
    } catch (error) {
      console.error('Failed to load motor media:', error);
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
    } finally {
      setLoading(false);
    }
  };

  const assignMediaToMotor = async (mediaId: string) => {
    if (!motorId) return;
    
    try {
      const { error } = await supabase
        .from('motor_media')
        .update({ 
          motor_id: motorId,
          assignment_type: 'individual'
        })
        .eq('id', mediaId);

      if (error) throw error;

      loadMotorMedia();
      loadAvailableMedia();
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

      loadMotorMedia();
      loadAvailableMedia();
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

  const setHeroMedia = async (mediaId: string | null) => {
    if (!motorId) return;
    
    try {
      const { error } = await supabase
        .from('motor_models')
        .update({ hero_media_id: mediaId })
        .eq('id', motorId);

      if (error) throw error;

      setMotor(prev => prev ? { ...prev, hero_media_id: mediaId } : null);
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

  const handleUploadComplete = () => {
    loadMotorMedia();
    loadAvailableMedia();
    loadMotor(); // Refresh motor to update media summary
  };

  if (loading || !motor) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNav />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-8">
            Loading motor data...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin/inventory')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Inventory
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Settings2 className="h-8 w-8" />
                Motor Management
              </h1>
              <p className="text-muted-foreground">
                Managing media and settings for {motor.model_display}
              </p>
            </div>
          </div>

          {/* Motor Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>{motor.model_display}</CardTitle>
              <CardDescription>
                {motor.horsepower}HP {motor.motor_type} 
                {motor.family && ` • ${motor.family}`}
                {motor.model_number && ` • Model: ${motor.model_number}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-center">
                <Badge variant={motor.availability === 'In Stock' ? 'default' : 'secondary'}>
                  {motor.availability}
                </Badge>
                {motor.dealer_price && (
                  <span className="text-sm">Dealer Price: ${motor.dealer_price.toLocaleString()}</span>
                )}
                {motor.msrp && (
                  <span className="text-sm">MSRP: ${motor.msrp.toLocaleString()}</span>
                )}
                {motor.hero_media_id && (
                  <Badge variant="outline">Hero Image Set</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Management Tabs */}
          <Tabs defaultValue="media" className="space-y-4">
            <TabsList>
              <TabsTrigger value="media">Media Management</TabsTrigger>
              <TabsTrigger value="sources">Custom Sources</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
            </TabsList>

            <TabsContent value="media" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle>Upload Media</CardTitle>
                    <CardDescription>
                      Upload new media files for this motor
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <QuickMediaUpload 
                      motorId={motorId!} 
                      onUploadComplete={handleUploadComplete}
                    />
                  </CardContent>
                </Card>

                {/* Current Media */}
                <Card>
                  <CardHeader>
                    <CardTitle>Current Media ({motorMedia.length})</CardTitle>
                    <CardDescription>
                      Media files assigned to this motor
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                    {motorMedia.map((media) => (
                      <div key={media.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="text-sm font-medium">
                              {media.title || 'Untitled'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {media.media_category} • {media.media_type}
                            </div>
                          </div>
                          {motor.hero_media_id === media.id && (
                            <Badge variant="default" className="text-xs">Hero</Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {media.media_type === 'image' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setHeroMedia(
                                motor.hero_media_id === media.id ? null : media.id
                              )}
                            >
                              {motor.hero_media_id === media.id ? 'Remove Hero' : 'Set Hero'}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => unassignMediaFromMotor(media.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                    {motorMedia.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        No media assigned to this motor yet.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Available Media */}
              {availableMedia.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Available Media ({availableMedia.length})</CardTitle>
                    <CardDescription>
                      Unassigned media files that can be assigned to this motor
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                    {availableMedia.map((media) => (
                      <div key={media.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
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
                          onClick={() => assignMediaToMotor(media.id)}
                        >
                          Assign
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="sources">
              <CustomSourceManager 
                motorId={motorId!} 
                motorModel={motor.model_display}
              />
            </TabsContent>

            <TabsContent value="features">
              <MotorFeaturesManager motor={{ 
                id: motorId!, 
                model_display: motor.model_display, 
                horsepower: motor.horsepower 
              }} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AdminMotorManagement;