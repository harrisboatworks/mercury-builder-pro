import { useState } from 'react';
import { Image, FileText, Video, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaThumbnailProps {
  media: {
    id: string;
    media_type: 'image' | 'pdf' | 'video' | 'url' | 'document';
    media_url: string;
    title?: string | null;
    alt_text?: string | null;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function MediaThumbnail({ media, size = 'md', className }: MediaThumbnailProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  if (media.media_type === 'image' && !imageError) {
    return (
      <div className={cn(
        'relative overflow-hidden rounded border bg-muted flex-shrink-0',
        sizeClasses[size],
        className
      )}>
        <img
          src={media.media_url}
          alt={media.alt_text || media.title || 'Media thumbnail'}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  // Fallback or non-image types
  const getIcon = () => {
    switch (media.media_type) {
      case 'image':
        return <AlertCircle className={cn(iconSizes[size], 'text-destructive')} />;
      case 'pdf':
      case 'document':
        return <FileText className={cn(iconSizes[size], 'text-blue-500')} />;
      case 'video':
        return <Video className={cn(iconSizes[size], 'text-green-500')} />;
      case 'url':
        return <LinkIcon className={cn(iconSizes[size], 'text-purple-500')} />;
      default:
        return <FileText className={cn(iconSizes[size], 'text-muted-foreground')} />;
    }
  };

  const getBgColor = () => {
    switch (media.media_type) {
      case 'image':
        return 'bg-destructive/10';
      case 'pdf':
      case 'document':
        return 'bg-blue-50 dark:bg-blue-950/20';
      case 'video':
        return 'bg-green-50 dark:bg-green-950/20';
      case 'url':
        return 'bg-purple-50 dark:bg-purple-950/20';
      default:
        return 'bg-muted';
    }
  };

  return (
    <div className={cn(
      'relative overflow-hidden rounded border flex items-center justify-center flex-shrink-0',
      sizeClasses[size],
      getBgColor(),
      className
    )}>
      {getIcon()}
    </div>
  );
}