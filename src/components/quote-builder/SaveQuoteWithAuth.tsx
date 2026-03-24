import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { Bookmark, Shield, RefreshCw, Share2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { SITE_URL } from '@/lib/site';

interface SaveQuoteWithAuthProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFallbackEmail: () => void;
}

const benefits = [
  { icon: RefreshCw, text: 'Pick up where you left off' },
  { icon: Share2, text: 'Share with a co-owner' },
  { icon: Shield, text: 'Your quote is saved for 30 days' },
];

function SaveQuoteContent({ onOpenChange, onFallbackEmail }: Omit<SaveQuoteWithAuthProps, 'open'>) {
  const [authError, setAuthError] = useState<string | null>(null);

  // Build redirect URL back to summary page so auto-save hook can fire
  const redirectUrl = `${SITE_URL}/quote/summary?auth_save=1`;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 text-primary">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Bookmark className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">
            Sign in to keep this quote safe. Access it anytime from any device.
          </p>
        </div>
      </div>

      <GoogleSignInButton
        redirectTo={redirectUrl}
        variant="outline"
        className="h-12 text-base"
        onError={(err) => setAuthError(err.message)}
      />

      {authError && (
        <p className="text-sm text-destructive text-center">{authError}</p>
      )}

      <ul className="space-y-2">
        {benefits.map((b, i) => (
          <li key={i} className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <b.icon className="h-4 w-4 text-primary/70 flex-shrink-0" />
            <span>{b.text}</span>
          </li>
        ))}
      </ul>

      <div className="border-t pt-4 space-y-2">
        <button
          onClick={onFallbackEmail}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
        >
          I'd rather enter my email manually
        </button>
        <button
          onClick={() => onOpenChange(false)}
          className="w-full text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          No thanks, continue without saving
        </button>
      </div>
    </div>
  );
}

export function SaveQuoteWithAuth({ open, onOpenChange, onFallbackEmail }: SaveQuoteWithAuthProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="px-4 pb-8">
          <DrawerHeader className="text-left">
            <DrawerTitle>Save Your Quote</DrawerTitle>
            <DrawerDescription className="sr-only">Sign in to save your quote configuration</DrawerDescription>
          </DrawerHeader>
          <SaveQuoteContent onOpenChange={onOpenChange} onFallbackEmail={onFallbackEmail} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Save Your Quote</DialogTitle>
          <DialogDescription className="sr-only">Sign in to save your quote configuration</DialogDescription>
        </DialogHeader>
        <SaveQuoteContent onOpenChange={onOpenChange} onFallbackEmail={onFallbackEmail} />
      </DialogContent>
    </Dialog>
  );
}
