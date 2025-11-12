import { useState } from 'react';
import { Phone, Mail, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { COMPANY_INFO } from '@/lib/companyInfo';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

export const ContactButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isMobile = useIsMobile();
  const { triggerHaptic } = useHapticFeedback();

  const handleClick = () => {
    triggerHaptic('medium');
    setIsModalOpen(true);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <>
      {/* Fixed Contact Button - appears on all pages */}
      <div className="fixed bottom-4 right-4 z-40">
        <Button
          onClick={handleClick}
          className="h-12 w-12 rounded-full bg-white border border-gray-300 shadow-md hover:shadow-lg hover:border-gray-400 active:scale-95 active:shadow-sm transition-all duration-150"
          aria-label="Contact us"
        >
          <MessageSquare className="h-5 w-5 text-gray-700" />
        </Button>
      </div>

      {/* Contact Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-light text-gray-900">
              How can we help?
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            {/* Call Option */}
            <a 
              href={`tel:${COMPANY_INFO.contact.phone}`}
              onClick={() => triggerHaptic('light')}
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] active:bg-gray-100 transition-all duration-100"
            >
              <Phone className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Call</p>
                <p className="text-sm text-gray-600">{COMPANY_INFO.contact.phone}</p>
              </div>
            </a>

            {/* Text Option */}
            <a 
              href="sms:647-952-2153"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] active:bg-gray-100 transition-all duration-100"
              onClick={(e) => {
                triggerHaptic('light');
                if (!isMobile) {
                  e.preventDefault();
                  copyToClipboard('647-952-2153', 'Text number');
                }
              }}
            >
              <MessageSquare className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Text</p>
                <p className="text-sm text-gray-600">647-952-2153</p>
              </div>
            </a>

            {/* Email Option */}
            <a 
              href={`mailto:${COMPANY_INFO.contact.email}`}
              onClick={() => triggerHaptic('light')}
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] active:bg-gray-100 transition-all duration-100"
            >
              <Mail className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Email</p>
                <p className="text-sm text-gray-600">{COMPANY_INFO.contact.email}</p>
              </div>
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
