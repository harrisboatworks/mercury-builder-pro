import { useState } from 'react';
import { ChevronDown, Shield, Award, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface TrustModal {
  title: string;
  description: string;
  details: string[];
}

const trustModals: Record<string, TrustModal> = {
  csi: {
    title: "CSI Award",
    description: "Customer-Nominated Service Excellence",
    details: [
      "Awarded based on customer satisfaction surveys",
      "Recognizes exceptional service quality"
    ]
  },
  repower: {
    title: "Mercury Repower Center",
    description: "Expert repower consultation & installation",
    details: [
      "Certified Mercury repower specialists",
      "Professional installation and support"
    ]
  },
  platinum: {
    title: "Platinum Mercury Dealer",
    description: "Family owned since 1947, serving Rice Lake area",
    details: [
      "Over 75 years of marine experience",
      "Trusted by generations of boaters"
    ]
  }
};

export const MobileTrustAccordion = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const handleModalOpen = (modalKey: string) => {
    setActiveModal(modalKey);
  };

  const handleModalClose = () => {
    setActiveModal(null);
  };

  return (
    <>
      {/* Mobile Trust Accordion - Only visible on mobile */}
      <div className="block sm:hidden bg-white border-b border-gray-200">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
          aria-expanded={isOpen}
        >
          <span className="font-medium text-gray-900">Why Buy From Us</span>
          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <div className="p-3 pt-0 bg-gray-50">
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => handleModalOpen('csi')}
                  className="flex items-center gap-3 w-full p-2 text-left hover:bg-white rounded-lg"
                >
                  <img 
                    src="/lovable-uploads/5d3b9997-5798-47af-8034-82bf5dcdd04c.png" 
                    alt="CSI Award" 
                    className="h-8 w-auto"
                  />
                  <span className="text-sm font-medium text-gray-900">CSI Award</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleModalOpen('repower')}
                  className="flex items-center gap-3 w-full p-2 text-left hover:bg-white rounded-lg"
                >
                  <img 
                    src="/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png" 
                    alt="Repower Center" 
                    className="h-8 w-auto"
                  />
                  <span className="text-sm font-medium text-gray-900">Mercury Repower Center</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleModalOpen('platinum')}
                  className="flex items-center gap-3 w-full p-2 text-left hover:bg-white rounded-lg"
                >
                  <img 
                    src="/lovable-uploads/bdce50a1-2d19-4696-a2ec-6b67379cbe23.png" 
                    alt="Harris Boat Works" 
                    className="h-8 w-auto"
                  />
                  <span className="text-sm font-medium text-gray-900">Platinum Mercury Dealer</span>
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Trust Modal */}
      <Dialog open={!!activeModal} onOpenChange={() => handleModalClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              {activeModal && trustModals[activeModal]?.title}
            </DialogTitle>
            <DialogDescription>
              {activeModal && trustModals[activeModal]?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {activeModal && trustModals[activeModal]?.details.map((detail, index) => (
              <p key={index} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-green-500 font-bold">•</span>
                {detail}
              </p>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};