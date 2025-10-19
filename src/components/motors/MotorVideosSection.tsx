import React, { useState, useEffect } from 'react';
import { Play, ExternalLink, Loader2, Video, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { supabase } from '../../integrations/supabase/client';

interface VideoItem {
  id: string;
  media_type: 'video' | 'url';
  media_category: string;
  media_url: string;
  title?: string;
  description?: string;
}

interface MotorVideosSectionProps {
  motorId: string;
  motorFamily?: string;
}

const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const getVideoThumbnail = (url: string): string => {
  const youtubeId = extractYouTubeId(url);
  if (youtubeId) {
    return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
  }
  return '/placeholder.svg';
};

const getCategoryBadgeColor = (category: string) => {
  const colorMap: Record<string, string> = {
    'demo': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
    'tutorial': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
    'review': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
    'installation': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
    'maintenance': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
    'general': 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
  };
  return colorMap[category] || colorMap.general;
};

export default function MotorVideosSection({ motorId, motorFamily }: MotorVideosSectionProps) {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState<VideoItem | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadVideos();
  }, [motorId, motorFamily]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      
      // Query for motor-specific videos and family-wide videos
      const { data, error } = await supabase
        .from('motor_media')
        .select('id, media_type, media_category, media_url, title, description')
        .or(`motor_id.eq.${motorId},and(motor_id.is.null,assignment_type.eq.family)`)
        .in('media_type', ['video', 'url'])
        .eq('is_active', true)
        .order('media_category')
        .order('title');

      if (error) throw error;
      
      // Filter for video-related URLs (YouTube, Vimeo, etc.)
      const videoData = (data || []).filter(item => {
        if (item.media_type === 'video') return true;
        if (item.media_type === 'url') {
          const url = item.media_url.toLowerCase();
          return url.includes('youtube.') || url.includes('youtu.be') || 
                 url.includes('vimeo.') || url.includes('video');
        }
        return false;
      });
      
      setVideos(videoData);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayVideo = (video: VideoItem) => {
    const youtubeId = extractYouTubeId(video.media_url);
    if (youtubeId) {
      setPlayingVideo(video);
    } else {
      // Open non-YouTube videos in new tab
      window.open(video.media_url, '_blank');
    }
  };

  const getEmbedUrl = (url: string): string => {
    const youtubeId = extractYouTubeId(url);
    if (youtubeId) {
      return `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`;
    }
    return url;
  };

  // Group videos by category
  const groupedVideos = videos.reduce((acc, video) => {
    const category = video.media_category || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push(video);
    return acc;
  }, {} as Record<string, VideoItem[]>);

  const categoryOrder = ['demo', 'tutorial', 'review', 'installation', 'maintenance', 'general'];
  const sortedCategories = Object.keys(groupedVideos).sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a);
    const bIndex = categoryOrder.indexOf(b);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading videos...</span>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-8">
        <Video className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="text-muted-foreground">No videos available for this motor</p>
      </div>
    );
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      {sortedCategories.map(category => {
        const categoryVideos = groupedVideos[category];
        const isExpanded = expandedCategories.has(category);
        const visibleVideos = isExpanded ? categoryVideos : categoryVideos.slice(0, 2);
        
        return (
        <div key={category} className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            {visibleVideos.map(video => (
              <div
                key={video.id}
                className="group cursor-pointer bg-muted/30 rounded-lg border hover:border-primary/20 transition-colors overflow-hidden"
                onClick={() => handlePlayVideo(video)}
              >
                {/* Video Thumbnail */}
                <div className="relative aspect-video bg-slate-200 dark:bg-slate-800">
                  <img
                    src={getVideoThumbnail(video.media_url)}
                    alt={video.title || 'Video thumbnail'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 ml-1" fill="currentColor" />
                    </div>
                  </div>
                </div>
                
                {/* Video Info */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h5 className="font-medium text-sm line-clamp-2">
                      {video.title || 'Motor Video'}
                    </h5>
                    <Badge className={`text-xs flex-shrink-0 ${getCategoryBadgeColor(video.media_category)}`}>
                      {video.media_category}
                    </Badge>
                  </div>
                  {video.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {video.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {categoryVideos.length > 2 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleCategory(category)}
              className="w-full mt-2"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Show All {categoryVideos.length} Videos
                </>
              )}
            </Button>
          )}
        </div>
      )})}
    

      {/* Video Player Dialog */}
      {playingVideo && (
        <Dialog open={!!playingVideo} onOpenChange={() => setPlayingVideo(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle>{playingVideo.title || 'Motor Video'}</DialogTitle>
            </DialogHeader>
            <div className="aspect-video">
              <iframe
                src={getEmbedUrl(playingVideo.media_url)}
                className="w-full h-full"
                title={playingVideo.title || 'Motor Video'}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-6 pt-4">
              {playingVideo.description && (
                <p className="text-sm text-muted-foreground">{playingVideo.description}</p>
              )}
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setPlayingVideo(null)}>
                  Close
                </Button>
                <Button onClick={() => window.open(playingVideo.media_url, '_blank')}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in New Tab
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}