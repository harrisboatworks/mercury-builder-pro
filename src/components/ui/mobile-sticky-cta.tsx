import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

interface MobileStickyCTAProps {
  onQuoteClick: () => void;
  className?: string;
}

export const MobileStickyCTA = ({ onQuoteClick, className = "" }: MobileStickyCTAProps) => {
  const handleClick = () => {
    // Fire analytics event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'cta_quote_open', {
        source: 'sticky_mobile_cta'
      });
    }
    onQuoteClick();
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 sm:hidden ${className}`}>
      <Button 
        onClick={handleClick}
        className="bg-red-600 hover:bg-red-700 text-white shadow-lg rounded-full w-14 h-14 p-0 flex items-center justify-center"
        aria-label="Get a Quote"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    </div>
  );
};