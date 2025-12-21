import { useState, useEffect } from 'react';
import { Share2, Link2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FloatingShareBarProps {
  url: string;
  title: string;
  description: string;
  articleSlug: string;
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

export function FloatingShareBar({ url, title, description, articleSlug }: FloatingShareBarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canShare] = useState(() => typeof navigator !== 'undefined' && !!navigator.share);
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 400px and hide near bottom
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const footerThreshold = docHeight - windowHeight - 400;
      
      setIsVisible(scrollY > 400 && scrollY < footerThreshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const trackShare = async (platform: string) => {
    try {
      await supabase.functions.invoke('track-share-event', {
        body: { articleSlug, platform, shareLocation: 'floating' }
      });
    } catch (err) {
      // Fire-and-forget - don't block the share
      console.error('Failed to track share:', err);
    }
  };

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}`,
  };

  const handleNativeShare = async () => {
    trackShare('native');
    if (navigator.share) {
      try {
        await navigator.share({ title, text: description, url });
      } catch (err) {
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
      toast({ title: "Link copied!", description: "Article link copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({ title: "Failed to copy", description: "Please copy the URL manually", variant: "destructive" });
    }
  };

  const openShareWindow = (shareUrl: string, platform: string) => {
    trackShare(platform);
    window.open(shareUrl, platform, 'width=600,height=400,menubar=no,toolbar=no');
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Desktop: Left side vertical bar */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-2 animate-fade-in">
        <div className="flex flex-col gap-2 bg-background/95 backdrop-blur-sm border border-border rounded-lg p-2 shadow-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openShareWindow(shareLinks.facebook, 'facebook')}
            className="h-9 w-9 p-0 text-muted-foreground hover:text-[#1877F2] hover:bg-[#1877F2]/10"
            aria-label="Share on Facebook"
          >
            <FacebookIcon />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openShareWindow(shareLinks.twitter, 'twitter')}
            className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Share on X"
          >
            <TwitterIcon />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openShareWindow(shareLinks.linkedin, 'linkedin')}
            className="h-9 w-9 p-0 text-muted-foreground hover:text-[#0A66C2] hover:bg-[#0A66C2]/10"
            aria-label="Share on LinkedIn"
          >
            <LinkedInIcon />
          </Button>
          <div className="h-px bg-border" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyLink}
            className="h-9 w-9 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
            aria-label="Copy link"
          >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Link2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile: Bottom bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 lg:hidden animate-fade-in">
        <div className="flex items-center gap-1 bg-background/95 backdrop-blur-sm border border-border rounded-full px-3 py-2 shadow-lg">
          {canShare ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNativeShare}
              className="h-8 gap-2 px-3 text-muted-foreground hover:text-primary"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          ) : (
            <>
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
            </>
          )}
          <div className="w-px h-5 bg-border" />
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
    </>
  );
}
