import { Button } from "@/components/ui/button";

interface MobileStickyCTAProps {
  onAction: () => void;
  label: string;
  price?: string;
  className?: string;
}

export const MobileStickyCTA = ({ onAction, label, price, className = "" }: MobileStickyCTAProps) => {
  return (
    <div className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-sm border-t border-gray-200 p-3 ${className}`}>
      <div className="flex gap-2 items-center max-w-screen-2xl mx-auto">
        {price && (
          <div className="text-gray-900">
            <div className="text-xs text-gray-600">Your Build</div>
            <div className="text-xl font-bold text-gray-900">{price}</div>
          </div>
        )}
        <Button 
          onClick={onAction}
          className="flex-1 bg-red-600 hover:bg-red-700 py-3 px-4 rounded-lg text-white font-semibold min-h-[48px]"
        >
          {label}
        </Button>
      </div>
    </div>
  );
};