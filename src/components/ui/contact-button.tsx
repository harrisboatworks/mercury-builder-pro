import { useState } from 'react';
import { Phone, Mail, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { COMPANY_INFO } from '@/lib/companyInfo';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

// Exported modal component for reuse in UnifiedMobileBar
interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const { triggerHaptic } = useHapticFeedback();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-light text-foreground">
            How can we help?
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-3 gap-3 py-4">
          {/* Call */}
          <a 
            href={`tel:${COMPANY_INFO.contact.phone}`}
            onClick={() => triggerHaptic('light')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:bg-muted/50 active:scale-[0.98] transition-all"
          >
            <Phone className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Call</span>
          </a>

          {/* Text */}
          <a 
            href="sms:647-952-2153"
            onClick={(e) => {
              triggerHaptic('light');
              const canSendSMS = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
              if (!canSendSMS) {
                e.preventDefault();
                copyToClipboard('647-952-2153', 'Text number');
              }
            }}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:bg-muted/50 active:scale-[0.98] transition-all"
          >
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Text</span>
          </a>

          {/* Email */}
          <a 
            href={`mailto:${COMPANY_INFO.contact.email}`}
            onClick={() => triggerHaptic('light')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:bg-muted/50 active:scale-[0.98] transition-all"
          >
            <Mail className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Email</span>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const ContactButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isMobile = useIsMobile();
  const { triggerHaptic } = useHapticFeedback();

  // Hide on mobile - handled by UnifiedMobileBar
  if (isMobile) return null;

  const handleClick = () => {
    triggerHaptic('medium');
    setIsModalOpen(true);
  };

  return (
    <>
      {/* Fixed Contact Button - desktop only */}
      <div className="fixed bottom-4 right-4 z-40">
        <Button
          onClick={handleClick}
          className="h-12 w-12 rounded-full bg-white border border-border shadow-md hover:shadow-lg hover:border-border/80 active:scale-95 active:shadow-sm transition-all duration-150"
          aria-label="Contact us"
        >
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>

      <ContactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
