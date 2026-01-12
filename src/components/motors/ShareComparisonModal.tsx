import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Copy, Check, Link2, Mail, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

interface ShareComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  motorCount: number;
}

export function ShareComparisonModal({ 
  isOpen, 
  onClose, 
  shareUrl, 
  motorCount 
}: ShareComparisonModalProps) {
  const isMobile = useIsMobile();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Check out this motor comparison`);
    const body = encodeURIComponent(`I'm comparing ${motorCount} motors and wanted to share with you:\n\n${shareUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleSMSShare = () => {
    const body = encodeURIComponent(`Check out this motor comparison: ${shareUrl}`);
    window.open(`sms:?body=${body}`);
  };

  // Shared content
  const descriptionText = `Share this link with anyone to show them your ${motorCount}-motor comparison.`;

  const copyLinkSection = (
    <div className="flex gap-2">
      <Input 
        value={shareUrl} 
        readOnly 
        className="flex-1 text-sm bg-muted/50"
      />
      <Button onClick={handleCopy} variant="default" className="shrink-0">
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </Button>
    </div>
  );

  const shareOptionsSection = (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">Or share via:</p>
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={handleEmailShare}
          className="flex-1 gap-2"
        >
          <Mail size={16} />
          Email
        </Button>
        <Button 
          variant="outline" 
          onClick={handleSMSShare}
          className="flex-1 gap-2"
        >
          <MessageSquare size={16} />
          Text
        </Button>
      </div>
    </div>
  );

  // Mobile: Bottom drawer
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="px-4 pb-8">
          <DrawerHeader className="text-left">
            <div className="flex items-center gap-2">
              <Link2 className="text-primary" size={20} />
              <DrawerTitle>Share Comparison</DrawerTitle>
            </div>
            <DrawerDescription>{descriptionText}</DrawerDescription>
          </DrawerHeader>

          <div className="px-4 space-y-6">
            {copyLinkSection}
            {shareOptionsSection}
          </div>

          <DrawerFooter className="pt-4">
            <Button onClick={onClose} variant="ghost" className="w-full">
              Done
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Centered dialog
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Link2 className="text-primary" size={20} />
            <DialogTitle>Share Comparison</DialogTitle>
          </div>
          <DialogDescription>{descriptionText}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {copyLinkSection}
          {shareOptionsSection}
        </div>

        <div className="pt-2">
          <Button onClick={onClose} variant="ghost" className="w-full">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
