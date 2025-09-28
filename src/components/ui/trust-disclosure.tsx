import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function TrustDisclosure() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`trust-line ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
      <div className="flex items-center justify-between">
        <button className="trust-toggle flex items-center gap-2">
          <span>Dealer Verified</span>
          <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
      
      <div className="trust-content">
        Award-Winning Service Team • Certified Repower Center • Mercury Premier Dealer
      </div>
    </div>
  );
}