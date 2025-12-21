import { useState } from 'react';
import { Share2, Link2, Check, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BlogShareButtonsProps {
  url: string;
  title: string;
  description: string;
  image?: string;
  variant?: 'inline' | 'full';
  articleSlug?: string;
  location?: 'header' | 'footer';
}

// Custom SVG icons for social platforms
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const PinterestIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>
  </svg>
);

export function BlogShareButtons({ 
  url, 
  title, 
  description, 
  image, 
  variant = 'inline',
  articleSlug,
  location = 'header'
}: BlogShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [canShare] = useState(() => typeof navigator !== 'undefined' && !!navigator.share);
  const { toast } = useToast();

  const trackShare = async (platform: string) => {
    if (!articleSlug) return;
    try {
      await supabase.functions.invoke('track-share-event', {
        body: { articleSlug, platform, shareLocation: location }
      });
    } catch (err) {
      // Fire-and-forget - don't block the share
      console.error('Failed to track share:', err);
    }
  };

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);
  const encodedImage = image ? encodeURIComponent(image) : '';

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedImage}&description=${encodedTitle}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0ARead more: ${encodedUrl}`,
  };

  const handleNativeShare = async () => {
    trackShare('native');
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
      } catch (err) {
        // User cancelled - silently ignore AbortError
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    }
  };

  const handleCopyLink = async () => {
    trackShare('copy');
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Article link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the URL manually",
        variant: "destructive",
      });
    }
  };

  const openShareWindow = (shareUrl: string, platform: string) => {
    trackShare(platform);
    window.open(shareUrl, platform, 'width=600,height=400,menubar=no,toolbar=no');
  };

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2">
        {/* Native share button on mobile */}
        {canShare && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNativeShare}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary md:hidden"
            aria-label="Share article"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        )}
        
        {/* Social buttons - hidden on mobile when native share is available */}
        <div className={`flex items-center gap-1 ${canShare ? 'hidden md:flex' : 'flex'}`}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openShareWindow(shareLinks.facebook, 'facebook')}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-[#1877F2]"
            aria-label="Share on Facebook"
          >
            <FacebookIcon />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openShareWindow(shareLinks.twitter, 'twitter')}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            aria-label="Share on X"
          >
            <TwitterIcon />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openShareWindow(shareLinks.linkedin, 'linkedin')}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-[#0A66C2]"
            aria-label="Share on LinkedIn"
          >
            <LinkedInIcon />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyLink}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
            aria-label="Copy link"
          >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Link2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    );
  }

  // Full variant with labels
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-foreground">Share this article</h3>
      
      <div className="flex flex-wrap gap-2">
        {/* Native share button - prominent on mobile */}
        {canShare && (
          <Button
            variant="outline"
            onClick={handleNativeShare}
            className="gap-2 md:hidden"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        )}
        
        {/* Social buttons - always visible on desktop, hidden on mobile when native available */}
        <div className={`flex flex-wrap gap-2 ${canShare ? 'hidden md:flex' : 'flex'}`}>
          <Button
            variant="outline"
            onClick={() => openShareWindow(shareLinks.facebook, 'facebook')}
            className="gap-2 hover:border-[#1877F2] hover:text-[#1877F2]"
          >
            <FacebookIcon />
            Facebook
          </Button>
          <Button
            variant="outline"
            onClick={() => openShareWindow(shareLinks.twitter, 'twitter')}
            className="gap-2 hover:border-foreground"
          >
            <TwitterIcon />
            X
          </Button>
          <Button
            variant="outline"
            onClick={() => openShareWindow(shareLinks.linkedin, 'linkedin')}
            className="gap-2 hover:border-[#0A66C2] hover:text-[#0A66C2]"
          >
            <LinkedInIcon />
            LinkedIn
          </Button>
          <Button
            variant="outline"
            onClick={() => openShareWindow(shareLinks.pinterest, 'pinterest')}
            className="gap-2 hover:border-[#E60023] hover:text-[#E60023]"
          >
            <PinterestIcon />
            Pinterest
          </Button>
          <Button
            variant="outline"
            onClick={handleCopyLink}
            className="gap-2"
          >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Link2 className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
          <Button
            variant="outline"
            asChild
            className="gap-2"
            onClick={() => trackShare('email')}
          >
            <a href={shareLinks.email}>
              <Mail className="h-4 w-4" />
              Email
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
