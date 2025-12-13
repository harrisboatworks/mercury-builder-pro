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
        
        <div className="space-y-3 py-4">
          {/* Call Option */}
          <a 
            href={`tel:${COMPANY_INFO.contact.phone}`}
            onClick={() => triggerHaptic('light')}
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-border/80 hover:bg-muted/50 active:scale-[0.98] active:bg-muted transition-all duration-100"
          >
            <Phone className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Call</p>
              <p className="text-sm text-muted-foreground">{COMPANY_INFO.contact.phone}</p>
            </div>
          </a>

          {/* Text Option */}
          <a 
            href="sms:647-952-2153"
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-border/80 hover:bg-muted/50 active:scale-[0.98] active:bg-muted transition-all duration-100"
            onClick={(e) => {
              triggerHaptic('light');
              const canSendSMS = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
              if (!canSendSMS) {
                e.preventDefault();
                copyToClipboard('647-952-2153', 'Text number');
              }
            }}
          >
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Text</p>
              <p className="text-sm text-muted-foreground">647-952-2153</p>
            </div>
          </a>

          {/* Email Option */}
          <a 
            href={`mailto:${COMPANY_INFO.contact.email}`}
            onClick={() => triggerHaptic('light')}
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-border/80 hover:bg-muted/50 active:scale-[0.98] active:bg-muted transition-all duration-100"
          >
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Email</p>
              <p className="text-sm text-muted-foreground">{COMPANY_INFO.contact.email}</p>
            </div>
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
